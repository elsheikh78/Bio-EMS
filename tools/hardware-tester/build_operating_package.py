"""Stage binaries from this checkout, sharing checksum-verified offline tools."""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

def build(main_package,source_commit,root=Path('.')):
    root=Path(root).resolve();source=Path(main_package).resolve()
    if not re.fullmatch('[0-9a-f]{40}',source_commit):raise ValueError('Invalid source commit')
    main=json.loads((source/'manifest.json').read_text())
    if main.get('target')!='esp32s3' or main.get('firmwareVersion')!='0.1.0-pilot.8' or main.get('sourceCommit')!=source_commit:
        raise ValueError('Main package must be pilot.8 from this exact source commit')
    def entry(path):return {'path':path.relative_to(root).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    images=[]
    for segment in main['segments']:
        path=(source/segment['file']).resolve()
        if not path.is_relative_to(source) or not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=segment['sha256']:
            raise ValueError('Invalid Main package segment')
        dst=root/'firmware/operating/main'/path.name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,dst)
        images.append(dict(entry(dst),offset=segment['offset']))
    targets={'esp32s3':{'board':'esp32s3','firmware':'0.1.0-pilot.8','images':images,'flash':main['flash']}}
    for target,folder,baud in [('nano-old','nano-old',57600),('nano-new','nano-new',115200)]:
        path=root/'firmware/operating'/folder/'SIM_D4.ino.hex'
        targets[target]={'board':'nano','firmware':'0.1.0-bench.2','baud':baud,'images':[entry(path)]}
    qc=json.loads((root/'firmware/qc-manifest.json').read_text())
    m={'schema':1,'purpose':'integrated-operating-firmware','source_commit':source_commit,'targets':targets,'tools':qc['tools'],'tool_files':qc.get('tool_files',[])}
    (root/'firmware/operating-manifest.json').write_text(json.dumps(m,indent=2),encoding='utf-8')
    from operating import load_target
    for target in targets:load_target(root,target)
    return m
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--main-package',required=True);p.add_argument('--source-commit',required=True)
    a=p.parse_args();build(a.main_package,a.source_commit)
