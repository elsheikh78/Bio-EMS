"""Offline QC-only flashing. Never invokes Arduino IDE/CLI on operator PCs."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone

TARGETS = {'ESP32-S3': 'esp32s3', 'Nano classic bootloader 57600': 'nano-old',
           'Nano new bootloader 115200': 'nano-new'}

def package_root():
    return Path(sys.executable).resolve().parent if getattr(sys, 'frozen', False) else Path(__file__).resolve().parent

def checked_file(root, entry):
    path = (root / entry['path']).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError('Missing or invalid package file: ' + entry['path'])
    if not re.fullmatch('[0-9a-f]{64}', entry['sha256']):
        raise ValueError('Invalid checksum in firmware manifest')
    if hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
        raise ValueError('Package checksum mismatch: ' + entry['path'])
    return path

def load_target(root, target):
    root = Path(root).resolve()
    m = json.loads((root / 'firmware/qc-manifest.json').read_text(encoding='utf-8'))
    if m['schema'] != 1 or m['purpose'] != 'isolated-sensor-qc' or m['firmware'] != 'qc-sensors-0.1.0':
        raise ValueError('Unsupported QC package')
    if not re.fullmatch('[0-9a-f]{40}', m['source_commit']):
        raise ValueError('Missing source commit')
    t = m['targets'][target]
    expected = 'esp32s3' if target == 'esp32s3' else 'nano'
    if t['board'] != expected: raise ValueError('Wrong target board')
    images = [(item, checked_file(root, item)) for item in t['images']]
    if target == 'esp32s3':
        if [item['offset'] for item, _ in images] != ['0x0','0x8000','0xe000','0x10000']:
            raise ValueError('Unexpected ESP32-S3 flash layout')
    elif len(images) != 1 or t['baud'] != {'nano-old':57600,'nano-new':115200}[target]:
        raise ValueError('Unsupported Nano image or bootloader baud')
    tools = {key: checked_file(root, val) for key, val in m['tools'].items()}
    for entry in m.get('tool_files', []): checked_file(root, entry)
    return m, t, images, tools

def command(root, target, port, detect=False):
    if not port or port.startswith('-'): raise ValueError('Select a serial port')
    m,t,images,tools = load_target(root,target)
    if target == 'esp32s3':
        cmd = [str(tools['esptool'])] + ['--chip','esp32s3','--port',port,'--baud','115200']
        if detect: cmd += ['chip_id']
        else:
            cmd += ['write_flash','--flash_mode','dio','--flash_freq','80m','--flash_size','keep']
            for item,path in images: cmd += [item['offset'], str(path)]
    else:
        cmd = [str(tools['avrdude']),'-C',str(tools['avrdude_conf']),'-p','atmega328p','-c','arduino','-P',port,'-b',str(t['baud'])]
        if detect: cmd += ['-n']
        else: cmd += ['-D','-U','flash:w:'+str(images[0][1])+':i']
    return cmd, m, t

def run_command(cmd, emit, timeout=180):
    """Bounded child process, no shell, full retained log. GUI stays responsive."""
    import threading
    output=[]
    flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
    with subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                          stdin=subprocess.DEVNULL, creationflags=flags) as child:
        def read():
            for raw in iter(child.stdout.readline, b''):
                line=raw.decode('utf-8',errors='replace').rstrip()
                output.append(line); emit(line)
        reader=threading.Thread(target=read,daemon=True); reader.start()
        try: code=child.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            child.kill(); child.wait(); reader.join(timeout=5)
            raise RuntimeError('Flash tool timed out; board state is unknown. Do not start a QC run.')
        reader.join(timeout=5)
    if code: raise RuntimeError('Flash tool failed (exit %s). Inspect retained log.' % code)
    return output

def verify_stream(port, board, firmware, timeout=20):
    import serial
    deadline=time.monotonic()+timeout
    with serial.Serial(port,115200,timeout=.4) as stream:
        while time.monotonic()<deadline:
            raw=stream.read_until(b'\n',size=4097)
            if not raw.endswith(b'\n') or len(raw)>4096: continue
            try: frame=json.loads(raw)
            except (ValueError,UnicodeError): continue
            if frame.get('protocol')=='bioems-qc/1':
                if frame.get('board')!=board or frame.get('firmware')!=firmware:
                    raise ValueError('QC runtime identity does not match flashed target')
                return {k:frame.get(k) for k in ('protocol','board','firmware','uid')}
    raise RuntimeError('Upload completed but no matching QC stream was received. Check USB-UART port/reset. Runtime NOT VERIFIED.')

def perform(root, target, port, unit, operator, evidence_dir, emit, detect=False):
    if not unit.strip() or not operator.strip(): raise ValueError('Enter assembly serial and operator name first')
    record={'id':str(uuid.uuid4()),'utc':datetime.now(timezone.utc).isoformat(),
            'target':target,'port':port,'unit':unit,'operator':operator,'operation':'detect' if detect else 'flash',
            'success':False,'log':[]}
    def log(line): record['log'].append(line); emit(line)
    destination=Path(evidence_dir); destination.mkdir(parents=True,exist_ok=True)
    path=destination/(record['id']+'.json')
    try:
        cmd,m,t=command(root,target,port,detect)
        record.update(source_commit=m['source_commit'],firmware=m['firmware'],images=t['images'])
        log('Detecting selected board; this may reset it.' if detect else 'Writing QC firmware. Do not unplug or close the application.')
        run_command(cmd,log)
        if not detect: record['runtime']=verify_stream(port,t['board'],m['firmware'])
        record['success']=True
        log('DETECTION OK (not a sensor test).' if detect else 'FLASH VERIFIED AND QC STREAM RECEIVED. Start a separate hardware QC run.')
    except Exception as exc:
        record['error']=str(exc); log('FAILED: '+str(exc))
    finally:
        path.write_text(json.dumps(record,indent=2),encoding='utf-8')
    return record, path
