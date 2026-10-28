"""Controlled A/B application-only maintenance; never changes partition tables/eFuses."""
import argparse
import base64
import hashlib
import re
import time
from pathlib import Path

CHUNK_BYTES = 128
MAX_APP_BYTES = 0x1F0000
ACK_TIMEOUT_SECONDS = 15


def exchange(stream, command, prefix):
    stream.write((command + '\n').encode('ascii'))
    stream.flush()
    deadline = time.monotonic() + ACK_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        line = stream.readline().decode('utf-8', errors='replace').strip()
        if 'UPDATE_REJECTED' in line or 'UPDATE_ABORTED' in line:
            raise RuntimeError('Controller rejected the transfer; active application was not replaced')
        if line.startswith(prefix):
            return line
    raise TimeoutError('Controller acknowledgement missing; do not assume update success')


def stage(stream, image, expected_hash):
    if not 0 < len(image) <= MAX_APP_BYTES or not re.fullmatch('[0-9a-f]{64}', expected_hash):
        raise ValueError('Invalid image length or governed SHA256')
    if hashlib.sha256(image).hexdigest() != expected_hash:
        raise ValueError('Image differs from the governed release hash')
    try:
        exchange(stream, f'updatebegin {len(image)} {expected_hash}', 'UPDATE_READY 0')
        for offset in range(0, len(image), CHUNK_BYTES):
            chunk = image[offset:offset + CHUNK_BYTES]
            result = exchange(stream, f'updatechunk {offset} ' + base64.b64encode(chunk).decode(), 'UPDATE_ACK ')
            if result != f'UPDATE_ACK {offset + len(chunk)}':
                raise RuntimeError('Unexpected offset acknowledgement; transfer stopped')
        exchange(stream, 'updateend', 'UPDATE_STAGED ')
    except Exception:
        stream.write(b'updateabort\n')
        stream.flush()
        raise
    return {'state': 'STAGED_NOT_ACCEPTED', 'sha256': expected_hash, 'bytes': len(image)}


def identity(stream, expected_uid, require_pending=False):
    stream.write(b'status\n'); stream.flush()
    deadline = time.monotonic() + 3
    lines = []
    while time.monotonic() < deadline:
        lines.append(stream.readline().decode('utf-8', errors='replace'))
    text = ''.join(lines)
    def field(name):
        values = re.findall(r'^\s*' + re.escape(name) + r':\s*(\S+)\s*$', text, re.M)
        return values[0] if len(values) == 1 else None
    if field('hardware-uid') != expected_uid or field('update-profile') != 'USB_AB_MAINTENANCE':
        raise ValueError('Hardware UID or installed recovery profile mismatch')
    if require_pending and field('update-state') not in ('PENDING_VERIFY', 'BASELINE_UNCONFIRMED'):
        raise ValueError('Controller has no unconfirmed baseline or pending update')
    return text


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', required=True)
    parser.add_argument('--uid', required=True)
    parser.add_argument('--action', choices=['inspect', 'stage', 'confirm', 'rollback'], default='inspect')
    parser.add_argument('--image')
    parser.add_argument('--sha256')
    parser.add_argument('--accept-functional-checks', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch('[a-fA-F0-9]{12,32}', args.uid):
        parser.error('Use the exact hardware-uid printed by this controller')
    if args.action == 'confirm' and not args.accept_functional_checks:
        parser.error('Confirm only after real identity/network/telemetry/storage checks')
    import serial
    with serial.Serial(port=None, baudrate=115200, timeout=.2) as stream:
        # Configure lines before opening; some USB adapters still pulse on open.
        stream.dtr = False; stream.rts = False
        stream.port = args.port
        stream.open()
        time.sleep(.5); stream.reset_input_buffer()
        print(identity(stream, args.uid, args.action == 'confirm'))
        if args.action == 'stage':
            if not args.image or not args.sha256:
                parser.error('Stage requires the application image and its governed SHA256')
            print(stage(stream, Path(args.image).read_bytes(), args.sha256))
            print('Reconnect and inspect immediately. Confirm after checks within the configured deadline; otherwise automatic rollback follows.')
        elif args.action == 'confirm':
            print(exchange(stream, 'updateconfirm', 'UPDATE_CONFIRMED'))
        elif args.action == 'rollback':
            print(exchange(stream, 'updaterollback', 'UPDATE_ROLLBACK '))


if __name__ == '__main__':
    main()
