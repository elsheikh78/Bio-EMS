"""Demonstration evidence only; optionally exercise real desktop widgets."""
import json,tempfile
from pathlib import Path
from core import Store,Capture,analyze,export_bundle,record_manual
from report import write_pdf

def sample(out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory() as temp:
  store=Store(Path(temp)/'demo.sqlite')
  c=dict(unit='DEMO-UNIT-001',operator='Simulated inspector',procedure='QC-HW-001 Rev A / DEMONSTRATION',profile='ESP32 / 1 sensor',minimum_c=0,maximum_c=40,duration_s=60,min_samples=20,max_error_pct=0,max_span_c=2,stale_s=8,reference_c=24,tolerance_c=.5,instrument='DEMO-REFERENCE')
  rid=store.start(c,'DEMO');clock=[0];capture=Capture(store,rid,lambda:clock[0])
  for i in range(31):
   clock[0]=i*2
   capture.feed(json.dumps(dict(protocol='bioems-qc/1',board='esp32s3',uid='SIMULATED-ESP32',firmware='qc-sensors-0.1.0',seq=i+1,uptime_ms=(i+1)*2000,channels=[dict(channel=1,rom='2800000000000001',status='ok',temperature_c=24+(i%5)*.02)])))
  for key in ['visual','continuity','power','response','recovery']:record_manual(store,rid,key,'PASS','SIMULATED observation only. No physical hardware tested.',value=3.3,low=3.1,high=3.5,instrument='DEMO-DMM')
  capture.stop();run=store.load(rid);write_pdf(run,out/'DEMO_QC_Report.pdf');export_bundle(run,out)
  assert analyze(run)['overall']=='DEMO - NOT HARDWARE EVIDENCE'
  store.db.close()
if __name__=='__main__':
 import sys
 sample(sys.argv[1] if len(sys.argv)>1 else 'sample-output')
 if '--gui' in sys.argv:
  import tkinter as tk
  from app import App
  root=tk.Tk();app=App(root)
  app.fields['unit'].set('DEMO-UNIT-001');app.fields['operator'].set('Demo inspector');app.start(True)
  root.after(2500,root.quit);root.mainloop()
  assert app.tree.get_children() and app.points,'GUI did not display/plot samples'
  app.stop_event.set();app.drain();app.capture.stop();app.active=False;app.refresh_history();app.store.db.close();root.destroy()
