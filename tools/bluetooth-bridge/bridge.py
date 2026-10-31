"""Opaque BLE/HTTPS relay. No device secrets; acknowledgements originate at BIO-EMS."""
import argparse
import asyncio
import json
import logging
import ssl
import sys
import urllib.request
from urllib.parse import urlsplit

SERVICE = "4b494f45-4d53-4000-8000-000000000001"
TX = "4b494f45-4d53-4000-8000-000000000002"
RX = "4b494f45-4d53-4000-8000-000000000003"
MAX_FRAME = 8192


class Frames:
    def __init__(self):
        self.buffer = bytearray()

    def feed(self, data):
        self.buffer.extend(data)
        if len(self.buffer) > MAX_FRAME:
            self.buffer.clear()
            raise ValueError("BLE frame exceeded limit")
        frames = []
        while b"\n" in self.buffer:
            end = self.buffer.index(b"\n")
            frames.append(bytes(self.buffer[:end]))
            del self.buffer[:end + 1]
        return frames


def local_origin(value):
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or parsed.hostname not in ("localhost", "127.0.0.1", "::1")
            or parsed.username or parsed.password or parsed.query or parsed.fragment
            or parsed.path not in ("", "/")):
        raise ValueError("Bridge requires a local HTTPS origin")
    return value.rstrip("/")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("BIO-EMS relay endpoint must not redirect")


def exchange(origin, frame, context):
    envelope = json.loads(frame)
    if not isinstance(envelope, dict) or set(envelope) != {"binding", "nonce", "data", "tag"}:
        raise ValueError("Invalid encrypted envelope")
    opener = urllib.request.build_opener(
        urllib.request.ProxyHandler({}), urllib.request.HTTPSHandler(context=context), NoRedirect())
    request = urllib.request.Request(origin + "/api/v1/controller-runtime/exchange", data=frame,
                                     headers={"Content-Type": "application/json"}, method="POST")
    with opener.open(request, timeout=5) as response:
        body = response.read(MAX_FRAME + 1)
        if len(body) > MAX_FRAME:
            raise ValueError("Oversized server acknowledgement")
        return body + b"\n"


async def session(device, origin, context):
    from bleak import BleakClient
    queue = asyncio.Queue(maxsize=2)
    frames = Frames()

    def on_data(_sender, data):
        try:
            for frame in frames.feed(data):
                queue.put_nowait(frame)
        except (ValueError, asyncio.QueueFull):
            logging.warning("Malformed or excessive BLE traffic discarded")

    async with BleakClient(device, timeout=10) as client:
        await client.start_notify(TX, on_data)
        logging.info("Main relay connected")
        while client.is_connected:
            try:
                frame = await asyncio.wait_for(queue.get(), timeout=15)
            except asyncio.TimeoutError:
                continue
            try:
                response = await asyncio.to_thread(exchange, origin, frame, context)
                for offset in range(0, len(response), 20):
                    await client.write_gatt_char(RX, response[offset:offset + 20], response=True)
            except (OSError, ValueError):
                logging.warning("Relay delivery failed; Main retains unacknowledged records")


async def run(origin, ca_file):
    from bleak import BleakScanner
    # Python's default context uses the Windows system certificate store.
    context = ssl.create_default_context(cafile=ca_file)
    tasks = {}
    try:
        while True:
            try:
                devices = await BleakScanner.discover(timeout=4, service_uuids=[SERVICE])
                for device in devices:
                    if device.address not in tasks or tasks[device.address].done():
                        if device.address in tasks:
                            try:
                                tasks[device.address].result()
                            except Exception:
                                logging.warning("Main disconnected; rediscovery scheduled")
                        if sum(not t.done() for t in tasks.values()) < 4:
                            tasks[device.address] = asyncio.create_task(session(device, origin, context))
                tasks = {key: task for key, task in tasks.items() if not task.done()}
            except Exception:
                logging.warning("BLE adapter unavailable; retrying")
            await asyncio.sleep(3)
    finally:
        for task in tasks.values():
            task.cancel()
        await asyncio.gather(*tasks.values(), return_exceptions=True)


if __name__ == "__main__":
    if sys.platform == "win32":
        sys.coinit_flags = 0  # WinRT BLE runs on the MTA asyncio thread, including unattended mode.
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", default="https://localhost")
    parser.add_argument("--ca-file")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(run(local_origin(args.origin), args.ca_file))
