"""CI: stage compiled QC images and Arduino-core AVRDUDE for offline operators."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

def build(arduino_data, source_commit, root=Path('.')):
    root=Path(root); data=Path(arduino_data)
    def entry(path):
        return {'path':path.relative_to(root).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    def copy(src,dst):
        dst=root/dst; dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst); return entry(dst)
    def one(pattern):
        matches=list(data.glob(pattern))
        if len(matches)!=1: raise ValueError('Expected exactly one match: '+pattern)
        return matches[0]
    # Version pinned by the installed arduino:avr 1.8.6 core dependency.
    avr=one('packages/arduino/tools/avrdude/*/bin/avrdude.exe')
    avrc=one('packages/arduino/tools/avrdude/*/etc/avrdude.conf')
    tools={'esptool':copy(root/'dist/BIOEMS-QC-Flash-Tool.exe','runtime/esptool/BIOEMS-QC-Flash-Tool.exe'),
           'avrdude':copy(avr,'runtime/avrdude/avrdude.exe'),
           'avrdude_conf':copy(avrc,'runtime/avrdude/avrdude.conf')}
    avrroot=avr.parent.parent
    # Preserve licenses, configuration, DLLs and other distributed companions.
    for src in avrroot.rglob('*'):
        if src.is_file():
            dst=root/'runtime/avrdude'/src.relative_to(avrroot)
            dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)
    # Retain root exe for the command and all dependencies shipped beside it.
    for src in avr.parent.glob('*.dll'): copy(src,'runtime/avrdude/'+src.name)
    boot=one('packages/esp32/hardware/esp32/3.3.2/tools/partitions/boot_app0.bin')
    esp=root/'firmware/build/esp32'
    images=[]
    for name,offset in [('QC_Sensors.ino.bootloader.bin','0x0'),('QC_Sensors.ino.partitions.bin','0x8000')]:
        images.append(dict(entry(esp/name),offset=offset))
    images.append(dict(copy(boot,'firmware/build/esp32/boot_app0.bin'),offset='0xe000'))
    images.append(dict(entry(esp/'QC_Sensors.ino.bin'),offset='0x10000'))
    targets={'esp32s3':{'board':'esp32s3','images':images}}
    for key,folder,baud in [('nano-old','nano',57600),('nano-new','nano-new',115200)]:
        targets[key]={'board':'nano','baud':baud,'images':[entry(root/f'firmware/build/{folder}/QC_Sensors.ino.hex')]}
    manifest={'schema':1,'purpose':'isolated-sensor-qc','source_commit':source_commit,
              'firmware':'qc-sensors-0.1.0','tools':tools,'targets':targets,
              'tool_files':[entry(p) for p in sorted((root/'runtime').rglob('*')) if p.is_file()]}
    (root/'firmware/qc-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    return manifest
if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--arduino-data',required=True); p.add_argument('--source-commit',required=True)
    a=p.parse_args(); build(a.arduino_data,a.source_commit)
