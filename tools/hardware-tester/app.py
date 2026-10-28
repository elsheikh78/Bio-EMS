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
  self.worker_thread=None; self.root=root; root.title('BIO-EMS Hardware Tester | Quality Control '+VERSION); root.geometry('1180x820'); root.minsize(1000,720)
  self.home=Path(os.environ.get('LOCALAPPDATA',str(Path.home())))/'BIO-EMS-Hardware-Tester'
  self.store=Store(self.home/'qc.sqlite'); self.rid=None; self.capture=None; self.stop_event=None; self.messages=queue.Queue(); self.active=False; self.demo=False; self.port=None
  self.fields={}; self.points={}; self.last=None; self.diag_running=False; self.flash_running=False; self.last_flash=None; self.operating_events=[]
  style=ttk.Style(); style.theme_use('clam'); style.configure('TButton',padding=6); style.configure('Heading.TLabel',font=('Segoe UI',19,'bold')); style.configure('Status.TLabel',font=('Segoe UI',11,'bold'))
  shell=ttk.Frame(root,padding=14); shell.pack(fill='both',expand=True)
  ttk.Label(shell,text='BIO-EMS  /  Hardware Quality Control',style='Heading.TLabel').pack(anchor='w')
  ttk.Label(shell,text='Standalone bench testing • Live sensors • Evidence records • Printable PDF',foreground='#326575').pack(anchor='w',pady=(0,10))
  tabs=ttk.Notebook(shell); tabs.pack(fill='both',expand=True)
  setup=ttk.Frame(tabs,padding=10); live=ttk.Frame(tabs,padding=10); manual=ttk.Frame(tabs,padding=10); history=ttk.Frame(tabs,padding=10)
  tabs.add(setup,text='1  Test setup'); tabs.add(live,text='2  Live sensors'); tabs.add(manual,text='3  Inspection / evidence'); tabs.add(history,text='4  Records / PDF')
  self.tabs=tabs
  firmware=ttk.Frame(tabs,padding=10); tabs.add(firmware,text='5  Flash QC firmware')
  ttk.Label(firmware,text='Flash isolated test firmware directly over USB',style='Status.TLabel').pack(anchor='w')
  ttk.Label(firmware,text='No Arduino IDE, Python or platform installation needed in the Windows package.\nThis replaces operating firmware. Restore the governed operating package before integrated use.\nESP32-S3: disconnect SD and other peripherals; test probe uses GPIO4 and 3V3.\nNano: disconnect HW-519 D0/D1 for flashing AND sensor readings. Use USB-only board power.',wraplength=1000).pack(anchor='w',pady=8)
  self.flash_target=tk.StringVar(value='ESP32-S3')
  from flashing import TARGETS
  ttk.Combobox(firmware,textvariable=self.flash_target,values=list(TARGETS),state='readonly',width=45).pack(anchor='w',pady=5)
  ttk.Label(firmware,text='Uses the COM port, assembly serial and operator entered in Test setup. Connect one intended board.').pack(anchor='w')
  actions=ttk.Frame(firmware); actions.pack(anchor='w',pady=8)
  ttk.Button(actions,text='Detect selected board',command=lambda:self.flash_qc(True)).pack(side='left',padx=4)
  ttk.Button(actions,text='Flash QC firmware and verify',command=lambda:self.flash_qc(False)).pack(side='left',padx=4)
  self.flash_state=tk.StringVar(value='Ready. Select board and USB COM port first.')
  ttk.Label(firmware,textvariable=self.flash_state,wraplength=1000).pack(anchor='w',pady=5)
  self.flash_log=tk.Text(firmware,height=18,wrap='word',state='disabled'); self.flash_log.pack(fill='both',expand=True)
  operating=ttk.Frame(tabs,padding=10); tabs.add(operating,text='6  Operating firmware')
  ttk.Label(operating,text='Install operating firmware for Main and Nano integration',style='Status.TLabel').pack(anchor='w')
  ttk.Label(operating,text='Offline bundled pilot.7 / bench.2. No platform login or Arduino installation.\nDisconnect external board power and RS485. Connect ONE board over USB.\nNano: D0/D1 disconnected; set SIM address in Test setup to match D7/D8.\nThis changes firmware and may change partition layout. It does not commission or restore credentials.\nUse a bench board; preserve the installation backup before changing a commissioned device.',wraplength=1000).pack(anchor='w',pady=8)
  import operating as operating_module
  self.operating_target=tk.StringVar(value='Nano bench.2 new bootloader 115200')
  ttk.Combobox(operating,textvariable=self.operating_target,values=list(operating_module.TARGETS),state='readonly',width=50).pack(anchor='w',pady=5)
  ttk.Label(operating,text='Uses unit, operator, COM and SIM address from Test setup. Flash Nano, then Main; reconnect only with power OFF.').pack(anchor='w')
  actions=ttk.Frame(operating); actions.pack(anchor='w',pady=8)
  ttk.Button(actions,text='Detect operating target',command=lambda:self.flash_operating(True)).pack(side='left',padx=4)
  ttk.Button(actions,text='Flash operating firmware and verify',command=lambda:self.flash_operating(False)).pack(side='left',padx=4)
  self.operating_state=tk.StringVar(value='Ready. Operating images are separate from isolated QC images.')
  ttk.Label(operating,textvariable=self.operating_state,wraplength=1000).pack(anchor='w',pady=5)
  self.operating_log=tk.Text(operating,height=18,wrap='word',state='disabled');self.operating_log.pack(fill='both',expand=True)
  defaults=[('unit','Assembly / unit serial',''),('operator','Operator name',''),('procedure','Approved procedure / revision / previous run','QC-HW-001 Rev A'),('profile','Selected scope','ESP32 / 1 sensor'),('sim_address','Integrated SIM address (1-4)','1'),('minimum_c','Minimum accepted temperature (C)','-10'),('maximum_c','Maximum accepted temperature (C)','50'),('duration_s','Minimum acquisition duration (s)','60'),('min_samples','Minimum valid samples / channel','20'),('max_error_pct','Maximum sensor errors (%)','0'),('max_span_c','Maximum temperature span (C)','2'),('stale_s','Maximum fresh-data gap (s)','8'),('reference_c','Stable reference temperature (optional)',''),('tolerance_c','Reference tolerance (C)','0.5'),('instrument','Reference instrument ID / certificate','')]
  for i,(key,label,default) in enumerate(defaults):
   ttk.Label(setup,text=label).grid(row=i,column=0,sticky='w',pady=3)
   var=tk.StringVar(value=default); self.fields[key]=var
   entry=ttk.Combobox(setup,textvariable=var,values=list(PROFILES),state='readonly',width=48) if key=='profile' else ttk.Entry(setup,textvariable=var,width=51)
   entry.grid(row=i,column=1,sticky='ew',padx=12)
   if key=='profile': entry.bind('<<ComboboxSelected>>', self.profile_changed)
  self.fields['port']=tk.StringVar()
  ttk.Label(setup,text='USB serial port').grid(row=15,column=0,sticky='w')
  self.portbox=ttk.Combobox(setup,textvariable=self.fields['port'],state='readonly',width=48); self.portbox.grid(row=15,column=1,padx=12,sticky='ew')
  ttk.Button(setup,text='Refresh ports',command=self.refresh_ports).grid(row=15,column=2)
  buttons=ttk.Frame(setup); buttons.grid(row=16,column=0,columnspan=3,sticky='w',pady=12)
  ttk.Button(buttons,text='Start hardware run',command=lambda:self.start(False)).pack(side='left',padx=4)
  ttk.Button(buttons,text='DEMO (simulated)',command=lambda:self.start(True)).pack(side='left',padx=4)
  ttk.Button(buttons,text='Firmware / wiring instructions',command=self.instructions).pack(side='left',padx=4)
  ttk.Label(setup,text='Review and approve limits BEFORE starting. Settings are frozen for each run.\nGPIO4 is for the isolated ESP32 sensor test only: disconnect SD and other peripherals.\nUse tab 5 to flash bundled QC firmware; restore operational firmware afterwards.',wraplength=900).grid(row=17,column=0,columnspan=3,sticky='w')
  self.status=tk.StringVar(value='Ready - no run started')
  ttk.Label(live,textvariable=self.status,style='Status.TLabel',wraplength=1050).pack(anchor='w')
  self.tree=ttk.Treeview(live,columns=('ch','rom','temp','state'),show='headings',height=5)
  for k,label,w in [('ch','Channel',90),('rom','Sensor ROM',300),('temp','Temperature C',160),('state','Latest status',230)]:
   self.tree.heading(k,text='Sensor ROM / SIM input' if k=='rom' else label); self.tree.column(k,width=w)
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
  messagebox.showinfo('QC firmware and wiring','Read README.md and OPERATOR_GUIDE_AR.txt in the delivered package.\nIntegrated Main + Nano: select integrated scope, SIM address, Main COM; use operational pilot.7 / bench.2, not QC firmware. Disconnect Nano USB. Approved assembly power is required.\nESP32 sensor: DQ=GPIO4; VDD=3V3; GND=GND; 4.7k DQ-to-3V3. Disconnect SD.\nNano: independent D2-D5; 5V sensor supply; one 4.7k per data line. Disconnect HW-519 from D0/D1 for USB.\nVerify supplier probe wire functions. Power OFF before rewiring.\nUse tab 5 Flash QC firmware. Select board and COM, Detect, then Flash and verify. This replaces current firmware.\nUSB UART port; serial 115200. No commissioning or platform login needed.')
 def refresh_ports(self):
  try:
   from serial.tools import list_ports
   ports=[p.device for p in list_ports.comports()]; self.portbox['values']=ports
   if ports and self.fields['port'].get() not in ports: self.fields['port'].set(ports[0])
  except ImportError: self.portbox['values']=[]
 def profile_changed(self,event=None):
  if self.fields['profile'].get()=='Main + Nano / 4 sensors via RS485': self.fields['stale_s'].set('20')
 def config(self):
  c={k:v.get().strip() for k,v in self.fields.items() if k!='port'}
  for k in ('minimum_c','maximum_c','duration_s','min_samples','max_error_pct','max_span_c','stale_s','tolerance_c'): c[k]=float(c[k])
  c['sim_address']=int(c['sim_address'])
  c['reference_c']=float(c['reference_c']) if c['reference_c'] else None
  return c
 def start(self,demo):
  if self.flash_running: return messagebox.showwarning('Firmware operation active','Wait for firmware detection or flashing to finish.')
  if self.active: return messagebox.showwarning('Run active','Finalize the current run first.')
  try:
   c=self.config(); self.demo=demo
   from core import validate_config
   validate_config(c)
   manual=PROFILES[c['profile']][1]==0
   if not demo and not manual:
    import serial
    if not self.fields['port'].get(): raise ValueError('Select a USB serial port')
    if PROFILES[c['profile']][0]=='main-rs485' and not messagebox.askokcancel('Integrated operational test','Connect Main USB-UART only to the PC. Both boards require operating firmware, not QC sketches. Confirm approved power/RS485 wiring. Nano USB must be disconnected. Opening COM may reset Main. This test polls Main simscan; it does not flash or commission.'): return
    self.port=serial.Serial(self.fields['port'].get(),115200,timeout=.3)
    self.port.reset_input_buffer()
   self.rid=self.store.start(c,'DEMO' if demo else 'HARDWARE'); self.capture=Capture(self.store,self.rid,time.monotonic)
   if not demo and self.last_flash and self.last_flash['success'] and self.last_flash['operation']=='flash' and self.last_flash['unit']==c['unit'] and self.last_flash['port']==self.fields['port'].get() and self.last_flash.get('runtime',{}).get('board')==PROFILES[c['profile']][0]:
    self.store.append(self.rid,'note',{'qc_firmware_flash':self.last_flash,'evidence_boundary':'Host upload record; streamed version is not cryptographic binary attestation. Verify same physical board.'})
   if not demo and PROFILES[c['profile']][0]=='main-rs485':
    for event in self.operating_events:
     if event.get('success') and event['unit']==c['unit'] and (event['target']!='esp32s3' or event['port']==self.fields['port'].get()):
      self.store.append(self.rid,'note',{'operating_firmware_flash':event,'evidence_boundary':'Session upload evidence only. Operator must verify same physical boards and wiring.'})
   self.active=True; self.points={}; self.last=time.monotonic(); self.tree.delete(*self.tree.get_children()); self.canvas.delete('all')
   for ch in range(1,PROFILES[c['profile']][1]+1): self.tree.insert('','end',iid=str(ch),values=(ch,'-','-','WAITING'))
   self.stop_event=threading.Event()
   if not manual:
    self.worker_thread=threading.Thread(target=self.worker,args=(self.stop_event,demo,c,self.port,self.rid),daemon=True); self.worker_thread.start()
   self.status.set(('DEMO - SIMULATED | ' if demo else 'HARDWARE | ')+self.rid+' | collecting evidence')
   self.tabs.select(2 if manual else 1); self.refresh_history()
  except Exception as e:
   if self.port: self.port.close(); self.port=None
   messagebox.showerror('Cannot start',str(e))
 def worker(self,stop,demo,c,port,rid):
  seq=0; started=time.monotonic()
  if not demo and PROFILES[c['profile']][0]=='main-rs485':
   self.integrated_worker(stop,c,port,rid); return
  try:
   while not stop.is_set():
    if demo:
     seq+=1; board,count=PROFILES[c['profile']]
     f={'protocol':'bioems-qc/1','board':board,'uid':'SIMULATED','firmware':'qc-demo-'+VERSION,'seq':seq,'uptime_ms':int((time.monotonic()-started)*1000),'channels':[{'channel':ch,'rom':f'28000000000000{ch:02x}','status':'ok','temperature_c':24+ch/10+random.uniform(-.08,.08)} for ch in range(1,count+1)]}
     if board=='main-rs485':
      f.update(protocol='bioems-main-scan/1',sim_address=c['sim_address'],sequence_source='simulated host scan counter')
      for item in f['channels']:
       item.pop('rom',None); item.update(sim_address=c['sim_address'],system_channel=(c['sim_address']-1)*4+item['channel'])
     self.messages.put((rid,'line',json.dumps(f))); stop.wait(2)
    else:
     raw=port.read_until(b'\n',size=4097)
     if raw:
      if len(raw)>4096 or not raw.endswith(b'\n'): self.messages.put((rid,'fault','Truncated/oversized serial frame'))
      else: self.messages.put((rid,'line',raw.decode('utf-8',errors='replace').strip()))
  except Exception as e: self.messages.put((rid,'fault','Serial acquisition stopped: '+str(e)))
 def integrated_worker(self,stop,c,port,rid):
  from integrated import exchange, identify, frame
  try:
   if stop.wait(2): return
   uid,firmware=identify(exchange(port,'status',stop))
   seq=0; started=time.monotonic()
   while not stop.is_set():
    raw=exchange(port,'simscan',stop)
    seq+=1
    f=frame(raw,uid,firmware,c['sim_address'],seq,int((time.monotonic()-started)*1000))
    if not f['module_responding']: self.messages.put((rid,'fault','Selected SIM did not respond to Main RS485 request'))
    self.messages.put((rid,'line',json.dumps(f)))
    if stop.wait(3): return
  except Exception as exc:
   if not stop.is_set(): self.messages.put((rid,'fault','Integrated acquisition stopped: '+str(exc)))
 def logline(self,s):
  self.log.configure(state='normal'); self.log.insert('end',s+'\n'); self.log.see('end')
  if int(self.log.index('end-1c').split('.')[0])>200: self.log.delete('1.0','50.0')
  self.log.configure(state='disabled')
 def drain(self):
  while True:
   try: rid,kind,value=self.messages.get_nowait()
   except queue.Empty: break
   if kind=='operating_log':
    self.operating_log.configure(state='normal');self.operating_log.insert('end',value+'\n');self.operating_log.see('end');self.operating_log.configure(state='disabled');continue
   if kind=='operating_done':
    self.flash_running=False;record,path=value
    self.operating_state.set(('SUCCESS' if record['success'] else 'FAILED')+' | Evidence: '+str(path))
    if record['success'] and record['operation']=='flash':
     self.operating_events.append(record)
     self.fields['profile'].set('Main + Nano / 4 sensors via RS485');self.profile_changed()
     messagebox.showinfo('Operating firmware ready','Upload and operating runtime verified. This is not hardware acceptance.\nFinish both boards, power OFF, reconnect RS485, disconnect Nano USB and select Main COM before starting the integrated run. No platform commissioning was performed.')
    elif not record['success']:messagebox.showerror('Operating firmware failed',record.get('error','See retained log'))
    continue
   if kind=='flash_log':
    self.flash_log.configure(state='normal'); self.flash_log.insert('end',value+'\n'); self.flash_log.see('end'); self.flash_log.configure(state='disabled'); continue
   if kind=='flash_done':
    self.flash_running=False; record,path=value
    if record['operation']=='flash': self.last_flash=record
    self.flash_state.set(('SUCCESS' if record['success'] else 'FAILED')+' | Evidence: '+str(path))
    if record['success'] and record['operation']=='flash':
     self.fields['profile'].set('ESP32 / 1 sensor' if record['target']=='esp32s3' else 'Nano / 4 sensors')
     messagebox.showinfo('QC firmware ready','Upload verified and matching QC stream received. Start hardware run in Test setup. Firmware restoration remains a separate step.')
    elif not record['success']: messagebox.showerror('Firmware operation failed',record.get('error','See retained log'))
    continue
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
    key=str(ch['channel']); vals=(key,ch.get('rom', 'SIM '+str(ch['sim_address'])+' / input '+str(ch['channel']) if 'sim_address' in ch else '-'),ch.get('temperature_c','-'),ch['status'])
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
 def flash_qc(self,detect):
  if self.active or self.diag_running or self.flash_running:
   return messagebox.showwarning('Serial port busy','Finalize the active run and wait for other operations before flashing.')
  from flashing import TARGETS, package_root, command, perform
  target=TARGETS[self.flash_target.get()]; port=self.fields['port'].get()
  unit=self.fields['unit'].get().strip(); operator=self.fields['operator'].get().strip()
  try:
   if not unit or not operator: raise ValueError('Enter assembly serial and operator in Test setup')
   command(package_root(),target,port,detect)
  except Exception as exc: return messagebox.showerror('Package or selection invalid',str(exc))
  text=('Detection opens COM and may reset the board.' if detect else 'This replaces the current operating firmware with isolated sensor test firmware. It does not restore operating firmware.')
  text+='\nSelected: '+self.flash_target.get()+' on '+port+'\nUnit: '+unit+'\nConfirm the intended physical board, USB-only power, disconnected peripherals and wiring. Close other serial applications.'
  if target=='esp32s3': text+='\nUse the USB-UART connector. If auto-reset fails, use BOOT/RESET according to the board documentation.'
  else: text+='\nDisconnect HW-519 D0/D1. Confirm the selected bootloader baud.'
  if not messagebox.askokcancel('Confirm board and isolated wiring',text): return
  if not detect: self.operating_events=[]
  self.flash_running=True; self.flash_state.set('Working. Do not disconnect the board or close the program.')
  def work():
   try:
    record,path=perform(package_root(),target,port,unit,operator,self.home/'firmware-events',lambda line:self.messages.put((None,'flash_log',line)),detect)
   except Exception as exc:
    record={'success':False,'operation':'detect' if detect else 'flash','error':str(exc)}; path=self.home/'firmware-events'
   self.messages.put((None,'flash_done',(record,path)))
  threading.Thread(target=work,daemon=True).start()
 def flash_operating(self,detect):
  if self.active or self.diag_running or self.flash_running:
   return messagebox.showwarning('Serial port busy','Finalize the active run and wait for other operations.')
  from operating import TARGETS,command,perform
  from flashing import package_root
  target=TARGETS[self.operating_target.get()];port=self.fields['port'].get()
  unit=self.fields['unit'].get().strip();operator=self.fields['operator'].get().strip()
  try:
   if not unit or not operator:raise ValueError('Enter assembly serial and operator in Test setup')
   address=int(self.fields['sim_address'].get())
   if address not in range(1,5):raise ValueError('SIM address must be 1 to 4')
   command(package_root(),target,port,detect)
  except Exception as exc:return messagebox.showerror('Operating package or selection invalid',str(exc))
  text=('Detection may reset the board; no write.' if detect else 'This writes OPERATING firmware, replacing QC/current firmware and possibly changing flash layout. It does not provision credentials. Preserve the backup before changing a commissioned device.')
  text+='\nSelected: '+self.operating_target.get()+' on '+port+'\nUnit: '+unit+' / SIM address: '+str(address)+'\nConfirm one intended board, USB-only power, external power isolated, RS485 D0/D1 disconnected, other serial programs closed.'
  if not messagebox.askokcancel('Confirm operating firmware operation',text):return
  if not detect:
   self.last_flash=None
   self.operating_events=[e for e in self.operating_events if e['unit']!=unit or (e['target']=='esp32s3')!=(target=='esp32s3')]
  self.flash_running=True;self.operating_state.set('Working. Do not unplug or close the program.')
  def work():
   try:record,path=perform(package_root(),target,port,unit,operator,self.home/'firmware-events',lambda line:self.messages.put((None,'operating_log',line)),detect,address)
   except Exception as exc:record={'success':False,'operation':'detect' if detect else 'flash','error':str(exc)};path=self.home/'firmware-events'
   self.messages.put((None,'operating_done',(record,path)))
  threading.Thread(target=work,daemon=True).start()
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
  if self.worker_thread: self.worker_thread.join(timeout=1)
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
  if self.flash_running: return messagebox.showinfo('Firmware operation active','Wait for firmware detection or flashing to finish before closing.')
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
