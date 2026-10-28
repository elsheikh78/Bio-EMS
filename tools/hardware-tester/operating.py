"""Offline operating firmware upload for integration; never provisions identity."""
import json
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from flashing import checked_file, run_command

TARGETS = {'Main ESP32-S3 pilot.8':'esp32s3', 'Nano bench.2 classic bootloader 57600':'nano-old',
           'Nano bench.2 new bootloader 115200':'nano-new'}

def load_target(root, target):
    root=Path(root).resolve()
    m=json.loads((root/'firmware/operating-manifest.json').read_text(encoding='utf-8'))
    if m.get('schema')!=1 or m.get('purpose')!='integrated-operating-firmware':
        raise ValueError('Unsupported operating firmware package')
    if target not in TARGETS.values() or not re.fullmatch('[0-9a-f]{40}',m.get('source_commit','')):
        raise ValueError('Invalid target or source commit')
    t=m['targets'][target];board='esp32s3' if target=='esp32s3' else 'nano'
    if t.get('board')!=board or t.get('firmware')!=('0.1.0-pilot.8' if board=='esp32s3' else '0.1.0-bench.2'):
        raise ValueError('Wrong operating board or firmware version')
    images=[(entry,checked_file(root,entry)) for entry in t['images']]
    if board=='esp32s3':
        if [e.get('offset') for e,_ in images]!=['0x0','0x8000','0x10000']:
            raise ValueError('Unsupported operating flash layout; NVS writes are forbidden')
        for (_,path),limit in zip(images,(0x8000,0x1000,0x3f0000)):
            if not 0<path.stat().st_size<=limit:raise ValueError('Image overlaps protected region or exceeds flash')
        f=t['flash']
        if f.get('mode') not in ('dio','qio','dout','qout') or f.get('frequency') not in ('40m','80m') or f.get('size')!='4MB':
            raise ValueError('Unsupported Main flash settings')
    elif len(images)!=1 or t.get('baud')!={'nano-old':57600,'nano-new':115200}[target]:
        raise ValueError('Wrong Nano bootloader baud or image count')
    tools={k:checked_file(root,v) for k,v in m['tools'].items()}
    for entry in m.get('tool_files',[]):checked_file(root,entry)
    return m,t,images,tools

def command(root,target,port,detect=False):
    if not re.fullmatch(r'COM[1-9][0-9]*',port or '',re.I):raise ValueError('Select a Windows COM port')
    m,t,images,tools=load_target(root,target)
    if target=='esp32s3':
        cmd=[str(tools['esptool']),'--chip','esp32s3','--port',port,'--baud','115200']
        if detect:cmd+=['chip_id']
        else:
            f=t['flash'];cmd+=['write_flash','--flash_mode',f['mode'],'--flash_freq',f['frequency'],'--flash_size',f['size']]
            for entry,path in images:cmd += [entry['offset'],str(path)]
    else:
        cmd=[str(tools['avrdude']),'-C',str(tools['avrdude_conf']),'-p','atmega328p','-c','arduino','-P',port,'-b',str(t['baud'])]
        cmd+=['-n'] if detect else ['-D','-U','flash:w:'+str(images[0][1])+':i']
    return cmd,m,t

def crc16(data):
    crc=0xffff
    for byte in data:
        crc^=byte
        for _ in range(8):crc=(crc>>1)^0xa001 if crc&1 else crc>>1
    return crc

def verify_nano_reply(data,address):
    if len(data)!=13 or data[:3]!=bytes([address,3,8]) or crc16(data[:-2])!=int.from_bytes(data[-2:],'little'):
        raise ValueError('Invalid Nano Modbus reply or CRC')
    registers=[int.from_bytes(data[i:i+2],'big') for i in range(3,11,2)]
    if registers!=[0x0100,1,address,4]:raise ValueError('Nano operating register identity mismatch')
    return {'board':'nano','sim_address':address,'registers':registers,
            'verification':'readback and operating Modbus; registers do not uniquely attest bench.2 or physical Nano'}

def verify_runtime(port,target,address):
    import serial
    if target=='esp32s3':
        from integrated import exchange,identify
        import threading
        with serial.Serial(port,115200,timeout=.3) as stream:
            time.sleep(2);uid,firmware=identify(exchange(stream,'status',threading.Event()))
        return {'board':'esp32s3','uid':uid,'firmware':firmware,'verification':'Main console identity; no commissioning performed'}
    with serial.Serial(port,9600,timeout=.4) as stream:
        time.sleep(2)
        request=bytes([address,3,0,0,0,4]);request+=crc16(request).to_bytes(2,'little')
        for _ in range(3):
            stream.reset_input_buffer();stream.write(request);stream.flush()
            data=bytearray();deadline=time.monotonic()+2
            while len(data)<13 and time.monotonic()<deadline:data.extend(stream.read(13-len(data)))
            try:return verify_nano_reply(bytes(data),address)
            except ValueError:pass
    raise RuntimeError('Upload verified but Nano runtime NOT VERIFIED. Check address, reset and disconnected RS485 D0/D1.')

def perform(root,target,port,unit,operator,evidence_dir,emit,detect=False,address=1):
    if not unit.strip() or not operator.strip():raise ValueError('Enter unit serial and operator')
    if type(address) is not int or address not in range(1,5):raise ValueError('SIM address must be 1 to 4')
    record={'id':str(uuid.uuid4()),'utc':datetime.now(timezone.utc).isoformat(), 'purpose':'integrated-operating-firmware',
            'target':target,'port':port,'unit':unit,'operator':operator,'operation':'detect' if detect else 'flash','success':False,'log':[]}
    destination=Path(evidence_dir);destination.mkdir(parents=True,exist_ok=True);path=destination/(record['id']+'.json')
    def log(line):record['log'].append(line);emit(line)
    try:
        cmd,m,t=command(root,target,port,detect)
        record.update(source_commit=m['source_commit'],firmware=t['firmware'],images=t['images'],sim_address=address)
        log('Detecting operating target.' if detect else 'Writing operating firmware. Do not unplug. No credentials or binding are created.')
        run_command(cmd,log)
        if not detect:record['runtime']=verify_runtime(port,target,address)
        record['success']=True
        log('DETECTION OK; no write performed.' if detect else 'OPERATING UPLOAD AND RUNTIME VERIFIED. Hardware acceptance is a separate run.')
    except Exception as exc:record['error']=str(exc);log('FAILED: '+str(exc))
    finally:path.write_text(json.dumps(record,indent=2),encoding='utf-8')
    return record,path
