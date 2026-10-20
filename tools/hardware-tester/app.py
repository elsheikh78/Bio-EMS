"""Windows desktop tester. All acquisition and records are independent of BIO-EMS."""
import hashlib
import json
import os
from pathlib import Path
import queue
import random
import threading
import time
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from core import Store, Capture, CHECKS, PROFILES, VERSION, analyze, export_bundle, record_manual
from report import write_pdf

class App:
 def __init__(self,root):
  self.root=root; root.title('BIO-EMS Hardware Tester | Quality Control '+VERSION); root.geometry('1180x820'); root.minsize(1000,720)
  self.home=Path(os.environ.get('LOCALAPPDATA',str(Path.home())))/'BIO-EMS-Hardware-Tester'
  self.store=Store(self.home/'qc.sqlite'); self.rid=None; self.capture=None; self.stop_event=None; self.messages=queue.Queue(); self.active=False; self.demo=False; self.port=None
  self.fields={}; self.points={}; self.last=None; self.diag_running=False
  style=ttk.Style(); style.theme_use('clam'); style.configure('TButton',padding=6); style.configure('Heading.TLabel',font=('Segoe UI',19,'bold')); style.configure('Status.TLabel',font=('Segoe UI',11,'bold'))
  shell=ttk.Frame(root,padding=14); shell.pack(fill='both',expand=True)
  ttk.Label(shell,text='BIO-EMS  /  Hardware Quality Control',style='Heading.TLabel').pack(anchor='w')
  ttk.Label(shell,text='Standalone bench testing • Live sensors • Evidence records • Printable PDF',foreground='#326575').pack(anchor='w',pady=(0,10))
  tabs=ttk.Notebook(shell); tabs.pack(fill='both',expand=True)
  setup=ttk.Frame(tabs,padding=10); live=ttk.Frame(tabs,padding=10); manual=ttk.Frame(tabs,padding=10); history=ttk.Frame(tabs,padding=10)
  tabs.add(setup,text='1  Test setup'); tabs.add(live,text='2  Live sensors'); tabs.add(manual,text='3  Inspection / evidence'); tabs.add(history,text='4  Records / PDF')
  self.tabs=tabs
  defaults=[('unit','Assembly / unit serial',''),('operator','Operator name',''),('procedure','Approved procedure / revision / previous run','QC-HW-001 Rev A'),('profile','Selected scope','ESP32 / 1 sensor'),('minimum_c','Minimum accepted temperature (C)','-10'),('maximum_c','Maximum accepted temperature (C)','50'),('duration_s','Minimum acquisition duration (s)','60'),('min_samples','Minimum valid samples / channel','20'),('max_error_pct','Maximum sensor errors (%)','0'),('max_span_c','Maximum temperature span (C)','2'),('stale_s','Maximum fresh-data gap (s)','8'),('reference_c','Stable reference temperature (optional)',''),('tolerance_c','Reference tolerance (C)','0.5'),('instrument','Reference instrument ID / certificate','')]
  for i,(key,label,default) in enumerate(defaults):
   ttk.Label(setup,text=label).grid(row=i,column=0,sticky='w',pady=3)
   var=tk.StringVar(value=default); self.fields[key]=var
   entry=ttk.Combobox(setup,textvariable=var,values=list(PROFILES),state='readonly',width=48) if key=='profile' else ttk.Entry(setup,textvariable=var,width=51)
   entry.grid(row=i,column=1,sticky='ew',padx=12)
  self.fields['port']=tk.StringVar()
  ttk.Label(setup,text='USB serial port').grid(row=14,column=0,sticky='w')
  self.portbox=ttk.Combobox(setup,textvariable=self.fields['port'],state='readonly',width=48); self.portbox.grid(row=14,column=1,padx=12,sticky='ew')
  ttk.Button(setup,text='Refresh ports',command=self.refresh_ports).grid(row=14,column=2)
  buttons=ttk.Frame(setup); buttons.grid(row=15,column=0,columnspan=3,sticky='w',pady=12)
  ttk.Button(buttons,text='Start hardware run',command=lambda:self.start(False)).pack(side='left',padx=4)
  ttk.Button(buttons,text='DEMO (simulated)',command=lambda:self.start(True)).pack(side='left',padx=4)
  ttk.Button(buttons,text='Firmware / wiring instructions',command=self.instructions).pack(side='left',padx=4)
  ttk.Label(setup,text='Review and approve limits BEFORE starting. Settings are frozen for each run.\nGPIO4 is for the isolated ESP32 sensor test only: disconnect SD and other peripherals.\nThis build does not flash firmware. Use the included QC sketch; restore operational firmware afterwards.',wraplength=900).grid(row=16,column=0,columnspan=3,sticky='w')
  self.status=tk.StringVar(value='Ready - no run started')
  ttk.Label(live,textvariable=self.status,style='Status.TLabel',wraplength=1050).pack(anchor='w')
  self.tree=ttk.Treeview(live,columns=('ch','rom','temp','state'),show='headings',height=5)
  for k,label,w in [('ch','Channel',90),('rom','Sensor ROM',300),('temp','Temperature C',160),('state','Latest status',230)]:
   self.tree.heading(k,text=label); self.tree.column(k,width=w)
  self.tree.pack(fill='x',pady=10)
  self.canvas=tk.Canvas(live,height=260,bg='#eff5f8',highlightthickness=0); self.canvas.pack(fill='both',expand=True)
  self.log=tk.Text(live,height=6,wrap='word',state='disabled'); self.log.pack(fill='x',pady=8)
  ttk.Button(live,text='STOP AND FINALIZE RUN',command=self.finish).pack(anchor='e')
  ttk.Label(manual,text='Record checks before finalizing. Evidence is manual unless acquired automatically.\nUse English in report fields. Earlier attempts remain in the event ledger.',wraplength=1000).pack(anchor='w')
  self.check=tk.StringVar(value='visual'); self.manual_status=tk.StringVar(value='PASS')
  self.checkbox=ttk.Combobox(manual,textvariable=self.check,values=list(CHECKS),state='readonly'); self.checkbox.pack(fill='x',pady=8); self.checkbox.bind('<<ComboboxSelected>>',self.check_hint)
  self.hint=tk.StringVar(); ttk.Label(manual,textvariable=self.hint,wraplength=1000).pack(anchor='w')
  ttk.Combobox(manual,textvariable=self.manual_status,values=['PASS','FAIL','NOT TESTED'],state='readonly').pack(anchor='w',pady=8)
  self.evidence=tk.Text(manual,height=8,wrap='word'); self.evidence.pack(fill='x')
  self.measure={}; row=ttk.Frame(manual); row.pack(fill='x',pady=12)
  for key,label in [('value','Measured V'),('low','Approved min V'),('high','Approved max V'),('instrument','Meter ID')]:
   ttk.Label(row,text=label).pack(side='left'); v=tk.StringVar(); self.measure[key]=v; ttk.Entry(row,textvariable=v,width=14).pack(side='left',padx=4)
  ttk.Button(manual,text='Save evidence / retest attempt',command=self.manual).pack(anchor='w')
  ttk.Button(manual,text='Capture Main pilot.7 USB diagnostics',command=self.main_diagnostics).pack(anchor='w',pady=8)
  ttk.Label(manual,text='Active manual-scope run only. Captures status / storage / rtc / simscan / gsmdiag. No flashing, commissioning or SMS.\nCaptured output is evidence, not an automatic PASS. Verify RTC cold boot and actual message receipt separately.',wraplength=1000).pack(anchor='w')
  self.check_hint()
  self.history=ttk.Treeview(history,columns=('date','unit','mode','end'),show='headings',height=12)
  for key,label,w in [('date','Started UTC',235),('unit','Unit serial',210),('mode','Evidence mode',110),('end','Run status',160)]: self.history.heading(key,text=label); self.history.column(key,width=w)
  self.history.pack(fill='both',expand=True)
  bar=ttk.Frame(history); bar.pack(fill='x',pady=10)
  ttk.Button(bar,text='Refresh records',command=self.refresh_history).pack(side='left')
  ttk.Button(bar,text='Analyze selected run',command=self.inspect).pack(side='left',padx=8)
  ttk.Button(bar,text='Export PDF + JSON + CSV',command=self.export).pack(side='left')
  ttk.Label(history,text='Reports are in English. PDF includes criteria, analysis, manual evidence, faults and reviewer signature fields.\nPASS applies only to the selected scope. Demo reports can never certify hardware.',wraplength=1000).pack(anchor='w')
  ttk.Label(shell,text='Records: '+str(self.home),foreground='#526677').pack(anchor='w',pady=(8,0))
  root.protocol('WM_DELETE_WINDOW',self.close); root.after(150,self.pump); self.refresh_ports(); self.refresh_history()
 def check_hint(self,event=None): self.hint.set(CHECKS[self.check.get()][1])
 def instructions(self):
  messagebox.showinfo('QC firmware and wiring','Read README.md and OPERATOR_GUIDE_AR.txt in the delivered package.\nESP32 sensor: DQ=GPIO4; VDD=3V3; GND=GND; 4.7k DQ-to-3V3. Disconnect SD.\nNano: independent D2-D5; 5V sensor supply; one 4.7k per data line. Disconnect HW-519 from D0/D1 for USB.\nVerify supplier probe wire functions. Power OFF before rewiring.\nUpload QC_Sensors.ino with Arduino IDE. This replaces the current firmware.\nUSB UART port; serial 115200. No commissioning or platform login needed.')
 def refresh_ports(self):
  try:
   from serial.tools import list_ports
   ports=[p.device for p in list_ports.comports()]; self.portbox['values']=ports
   if ports and self.fields['port'].get() not in ports: self.fields['port'].set(ports[0])
  except ImportError: self.portbox['values']=[]
 def config(self):
  c={k:v.get().strip() for k,v in self.fields.items() if k!='port'}
  for k in ('minimum_c','maximum_c','duration_s','min_samples','max_error_pct','max_span_c','stale_s','tolerance_c'): c[k]=float(c[k])
  c['reference_c']=float(c['reference_c']) if c['reference_c'] else None
  return c
 def start(self,demo):
  if self.active: return messagebox.showwarning('Run active','Finalize the current run first.')
  try:
   c=self.config(); self.demo=demo
   from core import validate_config
   validate_config(c)
   manual=PROFILES[c['profile']][1]==0
   if not demo and not manual:
    import serial
    if not self.fields['port'].get(): raise ValueError('Select a USB serial port')
    self.port=serial.Serial(self.fields['port'].get(),115200,timeout=.3)
    self.port.reset_input_buffer()
   self.rid=self.store.start(c,'DEMO' if demo else 'HARDWARE'); self.capture=Capture(self.store,self.rid,time.monotonic)
   self.active=True; self.points={}; self.last=time.monotonic(); self.tree.delete(*self.tree.get_children()); self.canvas.delete('all')
   for ch in range(1,PROFILES[c['profile']][1]+1): self.tree.insert('','end',iid=str(ch),values=(ch,'-','-','WAITING'))
   self.stop_event=threading.Event()
   if not manual: threading.Thread(target=self.worker,args=(self.stop_event,demo,c,self.port,self.rid),daemon=True).start()
   self.status.set(('DEMO - SIMULATED | ' if demo else 'HARDWARE | ')+self.rid+' | collecting evidence')
   self.tabs.select(2 if manual else 1); self.refresh_history()
  except Exception as e:
   if self.port: self.port.close(); self.port=None
   messagebox.showerror('Cannot start',str(e))
 def worker(self,stop,demo,c,port,rid):
  seq=0; started=time.monotonic()
  try:
   while not stop.is_set():
    if demo:
     seq+=1; board,count=PROFILES[c['profile']]
     f={'protocol':'bioems-qc/1','board':board,'uid':'SIMULATED','firmware':'qc-demo-'+VERSION,'seq':seq,'uptime_ms':int((time.monotonic()-started)*1000),'channels':[{'channel':ch,'rom':f'28000000000000{ch:02x}','status':'ok','temperature_c':24+ch/10+random.uniform(-.08,.08)} for ch in range(1,count+1)]}
     self.messages.put((rid,'line',json.dumps(f))); stop.wait(2)
    else:
     raw=port.read_until(b'\n',size=4097)
     if raw:
      if len(raw)>4096 or not raw.endswith(b'\n'): self.messages.put((rid,'fault','Truncated/oversized serial frame'))
      else: self.messages.put((rid,'line',raw.decode('utf-8',errors='replace').strip()))
  except Exception as e: self.messages.put((rid,'fault','Serial acquisition stopped: '+str(e)))
 def logline(self,s):
  self.log.configure(state='normal'); self.log.insert('end',s+'\n'); self.log.see('end')
  if int(self.log.index('end-1c').split('.')[0])>200: self.log.delete('1.0','50.0')
  self.log.configure(state='disabled')
 def drain(self):
  while True:
   try: rid,kind,value=self.messages.get_nowait()
   except queue.Empty: break
   if not self.active or rid!=self.rid: continue
   if kind=='diagnostics':
    self.diag_running=False
    self.store.append(self.rid,'note',{'main_bench_diagnostics':value})
    win=tk.Toplevel(self.root); win.title('Main diagnostic evidence - review manually'); win.geometry('950x650')
    view=tk.Text(win,wrap='word'); view.pack(fill='both',expand=True); view.insert('end',json.dumps(value,indent=2)); view.configure(state='disabled')
    continue
   if kind=='line' and self.capture.identity is None and time.monotonic()-self.capture.started<5 and not value.startswith('{'):
    self.store.append(self.rid,'note',{'startup_serial':value[:2048]}); self.logline('Startup: '+value[:150]); continue
   if kind=='fault': self.store.append(self.rid,'transport',{'error':value}); self.logline(value); continue
   f=self.capture.feed(value)
   if not f: self.logline('Rejected: '+value[:150]); continue
   self.last=time.monotonic()
   received={str(ch['channel']) for ch in f['channels']}
   for key in self.tree.get_children():
    if key not in received: self.tree.item(key,values=(key,'-','-','MISSING IN FRAME'))
   for ch in f['channels']:
    key=str(ch['channel']); vals=(key,ch.get('rom','-'),ch.get('temperature_c','-'),ch['status'])
    if self.tree.exists(key): self.tree.item(key,values=vals)
    else: self.tree.insert('','end',iid=key,values=vals)
    if ch['status']=='ok': self.points.setdefault(key,[]).append((time.monotonic()-self.capture.started,ch['temperature_c'])); self.points[key]=self.points[key][-300:]
   self.draw(); self.status.set(('DEMO - SIMULATED | ' if self.demo else 'HARDWARE | ')+f"{f['uid']} | {f['firmware']} | sample {f['seq']}")
 def pump(self):
  self.drain()
  if self.active and self.capture:
   self.capture.tick()
   if self.capture.stale:
    self.status.set('STALE / NO FRESH DATA - readings are not current')
    for key in self.tree.get_children():
     values=list(self.tree.item(key,'values')); values[3]='STALE'; self.tree.item(key,values=values)
  self.root.after(150,self.pump)
 def draw(self):
  self.canvas.delete('all'); w=max(600,self.canvas.winfo_width()); h=max(180,self.canvas.winfo_height()); colors=['#008a8e','#d26b28','#6b55a2','#2471b5']
  shown={k:v[-300:] for k,v in self.points.items() if v}; allp=[p for v in shown.values() for p in v]
  if not allp: return
  xmin=min(x for x,y in allp); xmax=max(x for x,y in allp); ymin=min(y for x,y in allp)-.2; ymax=max(y for x,y in allp)+.2
  self.canvas.create_text(10,12,text=f'{ymax:.2f} C',anchor='nw'); self.canvas.create_text(10,h-32,text=f'{ymin:.2f} C',anchor='nw')
  for i,(key,points) in enumerate(shown.items()):
   coords=[]
   for x,y in points: coords.extend([70+(x-xmin)/max(1,xmax-xmin)*(w-95),20+(ymax-y)/(ymax-ymin)*(h-65)])
   if len(coords)>2: self.canvas.create_line(*coords,fill=colors[i%4],width=2)
   self.canvas.create_text(95+i*120,h-15,text='CH'+key,fill=colors[i%4])
 def main_diagnostics(self):
  if not self.active or self.demo or PROFILES[self.capture.config['profile']][1]!=0:
   return messagebox.showwarning('Manual hardware run required','Start Main + 1 SIM / Rev B (or Assembly manual scope) in HARDWARE mode first.')
  if self.diag_running: return
  name=self.fields['port'].get()
  if not name: return messagebox.showwarning('Select port','Refresh and select the Main USB-UART COM port in Test setup.')
  if not messagebox.askokcancel('Connect operational Main','Use operational pilot.7 firmware, not the isolated QC sketch. Confirm measured supply rails and the approved USB power path. Opening COM may reset the board. Capture does not send SMS or change commissioning.'): return
  self.diag_running=True; rid=self.rid
  def work():
   try:
    import serial
    from diagnostics import collect
    with serial.Serial(name,115200,timeout=.25) as port:
     time.sleep(2)
     result=collect(port)
   except Exception as exc: result={'error':str(exc),'automatic_disposition':False}
   self.messages.put((rid,'diagnostics',result))
  threading.Thread(target=work,daemon=True).start()
 def manual(self):
  if not self.active: return messagebox.showwarning('No active run','Start a run first. Finalized records cannot be edited.')
  try:
   m={k:(float(v.get()) if v.get().strip() else None) for k,v in self.measure.items() if k!='instrument'}
   record_manual(self.store,self.rid,self.check.get(),self.manual_status.get(),self.evidence.get('1.0','end'),instrument=self.measure['instrument'].get(),**m)
   messagebox.showinfo('Recorded','Evidence appended. Earlier attempts remain recorded.')
  except Exception as e: messagebox.showerror('Evidence not saved',str(e))
 def finish(self):
  if self.diag_running: return messagebox.showinfo('Diagnostics active','Wait for the bounded diagnostic capture to finish before finalizing.')
  if not self.active: return
  if self.stop_event: self.stop_event.set()
  # Capture any already queued samples before sealing; late data is excluded.
  self.drain()
  if self.port: self.port.close(); self.port=None
  self.capture.stop(); self.active=False
  a=analyze(self.store.load(self.rid)); self.status.set(a['overall']); self.refresh_history(); messagebox.showinfo('Run finalized',a['overall']+'\nCreate a new run for additional testing.')
 def refresh_history(self):
  self.history.delete(*self.history.get_children())
  for rid,date,mode,c,ended in self.store.list_runs(): self.history.insert('','end',iid=rid,values=(date,json.loads(c)['unit'],mode,'FINALIZED' if ended else 'OPEN / INTERRUPTED'))
 def selected(self):
  selection=self.history.selection()
  if not selection: raise ValueError('Select a record in Records / PDF')
  return self.store.load(selection[0])
 def inspect(self):
  try:
   a=analyze(self.selected()); messagebox.showinfo('Analysis',self.selected()['id']+'\n'+json.dumps(a,indent=2))
  except Exception as e: messagebox.showerror('Analysis',str(e))
 def export(self):
  try:
   run=self.selected(); folder=filedialog.askdirectory(title='Select report output folder')
   if not folder:return
   path=export_bundle(run,folder); pdf=path.with_suffix('.pdf'); write_pdf(run,pdf)
   files=[path,path.with_suffix('.csv'),pdf]
   path.with_suffix('.sha256').write_text('\n'.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name for p in files)+'\n')
   messagebox.showinfo('Report exported','PDF, JSON, CSV and SHA-256 manifest saved.\n'+str(pdf))
   if os.name=='nt': os.startfile(str(pdf))
  except Exception as e: messagebox.showerror('Export failed',str(e))
 def close(self):
  if self.diag_running: return messagebox.showinfo('Diagnostics active','Wait for diagnostic capture before closing.')
  if self.active:
   if not messagebox.askyesno('Active test','Stop and finalize this test before exiting?'):return
   self.finish()
  self.store.db.close(); self.root.destroy()

if __name__=='__main__':
 import sys
 if '--self-test' in sys.argv:
  from smoke import sample
  sample(sys.argv[sys.argv.index('--self-test')+1])
 else:
  root=tk.Tk(); App(root); root.mainloop()
