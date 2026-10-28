"""Read-only acquisition through operational Main USB console; no platform required."""
import json
import re
import time

PROTOCOL = 'bioems-main-scan/1'


def exchange(port, command, stop, timeout=12, clock=time.monotonic):
    # Only these read-only commands are permitted in this transport.
    if command not in ('status', 'simscan'):
        raise ValueError('Unsupported integrated test command')
    port.reset_input_buffer()
    port.write((command + '\n').encode('ascii'))
    deadline = clock() + timeout
    lines = []
    total = 0
    while not stop.is_set() and clock() < deadline:
        raw = port.read_until(b'\n', size=4097)
        if not raw:
            continue
        total += len(raw)
        if len(raw) > 4096 or total > 32768:
            raise ValueError('Main output exceeded capture limit')
        text = re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', raw.decode('utf-8', errors='replace'))
        lines.append(text)
        if command == 'simscan' and 'BIOEMS_SIM_SCAN:' in text:
            if not raw.endswith(b'\n'):
                raise ValueError('Truncated SIM scan')
            return text.split('BIOEMS_SIM_SCAN:', 1)[1].strip()
        if command == 'status' and 'firmware:' in ''.join(lines) and 'bioems> ' in text:
            return ''.join(lines)
    raise ValueError('Main ' + command + ' timed out or stopped')


def identify(text):
    def field(name):
        found = re.search(r'^\s*' + name + r':\s*(\S+)\s*$', text, re.M)
        if not found:
            raise ValueError('Missing Main ' + name + '; install operational firmware')
        return found.group(1)
    uid, firmware = field('hardware-uid'), field('firmware')
    if not re.fullmatch(r'[0-9a-fA-F]{12,64}', uid):
        raise ValueError('Invalid Main hardware UID')
    if firmware not in ('0.1.0-pilot.7','0.1.0-pilot.8'):
        raise ValueError('Integrated acquisition requires validated operational pilot.8 firmware')
    return uid, firmware


def frame(raw, uid, firmware, address, seq, elapsed_ms):
    """Keep raw scan as evidence. No invented sensor ROM or Nano hardware UID."""
    data = json.loads(raw)
    if not isinstance(data, dict) or data.get('hardwareUid') != uid:
        raise ValueError('Main identity changed')
    modules = data.get('modules')
    if not isinstance(modules, list) or len(modules) != 4:
        raise ValueError('Incomplete SIM scan')
    by_address = {}
    for module in modules:
        a = module.get('address')
        if type(a) is not int or a not in range(1, 5) or a in by_address or type(module.get('responding')) is not bool:
            raise ValueError('Invalid/duplicate module address or response flag')
        by_address[a] = module
    module = by_address[address]
    channels = []
    if module['responding']:
        inputs = module.get('inputs')
        if not isinstance(inputs, list) or len(inputs) != 4:
            raise ValueError('Expected four SIM inputs')
        seen = set()
        for item in inputs:
            ch = item.get('input')
            status = item.get('status')
            if type(ch) is not int or ch not in range(1, 5) or ch in seen or type(status) is not int or status not in range(4):
                raise ValueError('Invalid/duplicate input or sensor status')
            if item.get('channel') != (address - 1) * 4 + ch:
                raise ValueError('SIM channel mapping mismatch')
            seen.add(ch)
            channels.append(dict(channel=ch, status=('ok', 'missing', 'crc', 'invalid')[status],
                                 temperature_c=item.get('value'), sim_address=address,
                                 system_channel=item['channel']))
    else:
        channels = [dict(channel=ch, status='missing', sim_address=address,
                         system_channel=(address-1)*4+ch) for ch in range(1, 5)]
    return dict(protocol=PROTOCOL, board='main-rs485', uid=uid, firmware=firmware,
                seq=seq, uptime_ms=elapsed_ms, sim_address=address,
                module_responding=module['responding'], channels=channels,
                sequence_source='host scan counter; not device uptime', raw_scan=data)
