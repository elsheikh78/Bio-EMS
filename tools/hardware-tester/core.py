"""Independent bench evidence and conservative acceptance analysis. No platform access."""
import csv
import hashlib
import json
import math
import sqlite3
import statistics
import uuid
from datetime import datetime, timezone
from pathlib import Path

VERSION = '0.5.0'
PROTOCOL = 'bioems-qc/1'
PROFILES = {'ESP32 / 1 sensor': ('esp32s3', 1), 'Nano / 4 sensors': ('nano', 4),
            'Main + Nano / 4 sensors via RS485': ('main-rs485', 4),
            'Assembly / manual evidence': ('manual', 0),
            'Main + 1 SIM / Rev B': ('manual', 0)}
CHECKS = {
 'visual': ('Assembly and wiring inspection', 'Correct components, secure contacts, no exposed shorts; power OFF'),
 'continuity': ('Continuity / short inspection', 'Power OFF: verify intended continuity and absence of supply shorts using a meter'),
 'power': ('Supply voltage', 'Measure rail with a suitable meter; record value, approved limits and instrument ID'),
 'response': ('Probe response', 'Warm each metal probe by hand; confirm rise and subsequent recovery'),
 'recovery': ('Disconnect / recovery', 'Stop acquisition, power OFF to rewire, verify fault and recovery in separate recorded attempts'),
 'rs485': ('MAIN to SIM RS485', 'Verify module identity, addresses, all fitted channels and fault/recovery; attach raw evidence'),
 'network': ('Wi-Fi / Ethernet', 'Record selected interface, link loss/recovery and actual delivery evidence'),
 'sd': ('SD storage and replay', 'Record storage, power restart and replay without lost/duplicate records'),
 'gsm': ('2G / explicit bench SMS', 'pilot.7: gsmdiag registration plus explicit gsmtest to an authorized recipient; record receipt/time. No automatic fallback is implemented'),
 'rtc': ('DS3231 UTC and battery restore', 'pilot.7 GPIO8/9: commission UTC, record rtc flags, cold boot and compare retained UTC against a trusted clock'),
 'battery': ('Central backup endurance', 'Measure Main + fitted SIM load, interruption duration and minimum rails'),
 'soak': ('Integrated endurance', 'Record duration, population, missing samples, resets and communications faults'),
}

def utc():
 return datetime.now(timezone.utc).isoformat(timespec='milliseconds')

def number(value):
 if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
  raise ValueError('Expected a finite number')
 return float(value)

def validate_config(c):
 if c['profile'] not in PROFILES: raise ValueError('Unknown profile')
 if PROFILES[c['profile']][0] == 'main-rs485':
  if type(c.get('sim_address')) is not int or c['sim_address'] not in range(1,5): raise ValueError('SIM address must be 1 to 4')
  if c['stale_s'] < 20: raise ValueError('Integrated polling requires freshness gap >= 20 s')
 for k in ('unit', 'operator', 'procedure'):
  if not str(c.get(k, '')).strip(): raise ValueError('Required: ' + k)
 for k in ('minimum_c','maximum_c','duration_s','min_samples','max_error_pct','max_span_c','stale_s'):
  number(c[k])
 if not -55 <= c['minimum_c'] < c['maximum_c'] <= 125: raise ValueError('Temperature limits must be ordered within -55..125 C')
 if c['duration_s'] < 2 or c['min_samples'] < 2 or int(c['min_samples']) != c['min_samples']: raise ValueError('Duration and sample count must be at least 2')
 if not 0 <= c['max_error_pct'] <= 100 or c['max_span_c'] < 0 or c['stale_s'] < 3: raise ValueError('Invalid acceptance limits')
 if c.get('reference_c') is not None:
  number(c['reference_c']); number(c['tolerance_c'])
  if c['tolerance_c'] < 0 or not c.get('instrument', '').strip(): raise ValueError('Reference requires instrument identity and nonnegative tolerance')
 return c

class Store:
 def __init__(self, path):
  self.path = Path(path); self.path.parent.mkdir(parents=True, exist_ok=True)
  self.db = sqlite3.connect(self.path)
  self.db.execute('PRAGMA journal_mode=WAL')
  self.db.executescript('''CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, started TEXT, ended TEXT, config TEXT, mode TEXT);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, run_id TEXT, timestamp TEXT, kind TEXT, payload TEXT, previous_hash TEXT, hash TEXT);
CREATE TABLE IF NOT EXISTS seals(run_id TEXT PRIMARY KEY, event_count INTEGER, last_hash TEXT);''')
  self.db.commit()
 def start(self, config, mode='HARDWARE'):
  config=dict(config)
  validate_config(config)
  count=PROFILES[config['profile']][1]
  config['checks']=(['visual','continuity','power','response','recovery'] if count else
    [k for k in CHECKS if k!='battery'] if config['profile']=='Main + 1 SIM / Rev B' else list(CHECKS))
  if PROFILES[config['profile']][0] == 'main-rs485': config['checks'].append('rs485')
  rid = str(uuid.uuid4())
  self.db.execute('INSERT INTO runs VALUES(?,?,?,?,?)', (rid,utc(),None,json.dumps(config,sort_keys=True),mode)); self.db.commit()
  self.append(rid,'run_header',{'config':config,'mode':mode,'id':rid})
  return rid
 def append(self, rid, kind, payload):
  run = self.db.execute('SELECT ended FROM runs WHERE id=?',(rid,)).fetchone()
  if run is None or run[0]: raise ValueError('Run is absent or finalized')
  previous = self.db.execute('SELECT hash FROM events WHERE run_id=? ORDER BY id DESC LIMIT 1',(rid,)).fetchone()
  previous = previous[0] if previous else ''
  stamp = utc(); body = json.dumps(payload,sort_keys=True,allow_nan=False)
  digest = hashlib.sha256((previous+'|'+stamp+'|'+kind+'|'+body).encode()).hexdigest()
  self.db.execute('INSERT INTO events(run_id,timestamp,kind,payload,previous_hash,hash) VALUES(?,?,?,?,?,?)',(rid,stamp,kind,body,previous,digest)); self.db.commit()
 def finish(self, rid):
  run = self.db.execute('SELECT ended FROM runs WHERE id=?',(rid,)).fetchone()
  if run is None or run[0]: raise ValueError('Run absent or already finalized')
  self.db.execute('UPDATE runs SET ended=? WHERE id=?',(utc(),rid))
  count,last = self.db.execute('SELECT count(*),coalesce((SELECT hash FROM events WHERE run_id=? ORDER BY id DESC LIMIT 1), "") FROM events WHERE run_id=?',(rid,rid)).fetchone()
  self.db.execute('INSERT INTO seals VALUES(?,?,?)',(rid,count,last)); self.db.commit()
 def list_runs(self):
  return self.db.execute('SELECT id, started, mode, config, ended FROM runs ORDER BY started DESC').fetchall()
 def load(self, rid):
  row = self.db.execute('SELECT * FROM runs WHERE id=?',(rid,)).fetchone()
  if row is None: raise ValueError('Unknown run')
  events=[]; previous=''; intact=True
  for _,_,stamp,kind,body,prior,digest in self.db.execute('SELECT * FROM events WHERE run_id=? ORDER BY id',(rid,)):
   expected=hashlib.sha256((previous+'|'+stamp+'|'+kind+'|'+body).encode()).hexdigest()
   intact &= prior == previous and digest == expected
   previous=digest
   events.append({'timestamp':stamp,'kind':kind,'payload':json.loads(body),'hash':digest})
  seal=self.db.execute('SELECT event_count,last_hash FROM seals WHERE run_id=?',(rid,)).fetchone()
  if row[2]: intact &= seal is not None and seal == (len(events), previous)
  headers=[e['payload'] for e in events if e['kind']=='run_header']
  intact &= len(headers)==1 and headers[0]=={'config':json.loads(row[3]),'mode':row[4],'id':row[0]}
  return {'id':row[0], 'started':row[1], 'ended':row[2], 'config':json.loads(row[3]), 'mode':row[4], 'events':events, 'integrity':bool(intact), 'last_hash':previous}

def parse_frame(line, expected_board):
 frame=json.loads(line)
 if not isinstance(frame,dict) or frame.get('protocol') != ('bioems-main-scan/1' if expected_board=='main-rs485' else PROTOCOL) or frame.get('board') != expected_board: raise ValueError('Wrong protocol / board: use supplied QC firmware')
 if not isinstance(frame.get('uid'),str) or not frame['uid'] or len(frame['uid']) > 64: raise ValueError('Missing board identity')
 if not isinstance(frame.get('firmware'),str) or not frame['firmware']: raise ValueError('Missing firmware identity')
 for k in ('seq','uptime_ms'):
  if isinstance(frame.get(k),bool) or not isinstance(frame.get(k),int) or frame[k]<0: raise ValueError('Invalid sequence/time')
 if not isinstance(frame.get('channels'),list) or len(frame['channels'])>4: raise ValueError('Invalid channels')
 seen=set()
 for c in frame['channels']:
  if not isinstance(c,dict) or type(c.get('channel')) is not int or c['channel'] not in range(1,5) or c['channel'] in seen: raise ValueError('Invalid/duplicate channel')
  seen.add(c['channel'])
  if c.get('status') not in ('ok','missing','crc','invalid','multiple','parasite'): raise ValueError('Unknown channel status')
  if c['status']=='ok':
   if expected_board != 'main-rs485' and (not isinstance(c.get('rom'),str) or len(c['rom'])!=16 or not c['rom'].lower().startswith('28')): raise ValueError('Invalid DS18B20 ROM')
   if expected_board != 'main-rs485': int(c['rom'],16)
   if not -55 <= number(c.get('temperature_c')) <= 125: raise ValueError('Invalid temperature')
 return frame

class Capture:
 def __init__(self, store, rid, clock):
  self.store=store; self.rid=rid; self.config=store.load(rid)['config']; self.clock=clock
  self.started=clock(); self.last=self.started; self.identity=None; self.seq=None; self.uptime=None; self.stale=False
 def feed(self,line):
  board, channels=PROFILES[self.config['profile']]
  try:
   f=parse_frame(line,board)
   identity=(f['board'],f['uid'],f['firmware'])
   if board=='main-rs485' and f.get('sim_address')!=self.config['sim_address']: raise ValueError('Wrong SIM address')
   if self.identity and self.identity!=identity: raise ValueError('Device/firmware identity changed: start a separate run')
   if self.seq is not None and (f['seq']<=self.seq or f['uptime_ms']<=self.uptime): raise ValueError('Duplicate/out-of-order sample or board reset')
   if self.seq is not None and f['seq']>self.seq+1:
    self.store.append(self.rid,'transport',{'error':'Sequence gap','lost_frames':f['seq']-self.seq-1})
   self.identity=identity; self.seq=f['seq']; self.uptime=f['uptime_ms']
   now=self.clock()
   if now-self.last > self.config['stale_s'] and not self.stale:
    self.store.append(self.rid,'transport',{'error':'Stale telemetry gap'})
   self.last=now; self.stale=False
   self.store.append(self.rid,'frame',{'elapsed_s':now-self.started,'data':f})
   return f
  except (ValueError,TypeError,KeyError) as e:
   self.store.append(self.rid,'transport',{'error':str(e),'raw':line[:2048]})
   return None
 def tick(self):
  if PROFILES[self.config['profile']][1] == 0: return
  if self.clock()-self.last > self.config['stale_s'] and not self.stale:
   self.store.append(self.rid,'transport',{'error':'No fresh valid telemetry before timeout'})
   self.stale=True
 def stop(self):
  self.tick()
  self.store.append(self.rid,'capture_end',{'elapsed_s':self.clock()-self.started})
  self.store.finish(self.rid)

def analyze(run):
 c=run['config']; count=PROFILES[c['profile']][1]
 frames=[e['payload'] for e in run['events'] if e['kind']=='frame']
 transports=[e for e in run['events'] if e['kind']=='transport']
 ends=[e['payload']['elapsed_s'] for e in run['events'] if e['kind']=='capture_end']
 duration=max(ends or [0]); results=[]
 for ch in range(1,count+1):
  values=[]; bad=0; roms=set(); refs=[]
  for e in frames:
   matches=[x for x in e['data']['channels'] if x['channel']==ch]
   if not matches or matches[0]['status']!='ok': bad+=1; continue
   r=matches[0]; v=r['temperature_c']; values.append(v); roms.add(r['rom']) if r.get('rom') else None
   if c.get('reference_c') is not None: refs.append(abs(v-c['reference_c']))
  rate=100*bad/len(frames) if frames else None
  reasons=[]
  if bad and rate>c['max_error_pct']: reasons.append('Sensor error rate above limit')
  if any(v<c['minimum_c'] or v>c['maximum_c'] for v in values): reasons.append('Reading outside accepted temperature range')
  if len(roms)>1: reasons.append('Sensor identity changed in this attempt')
  if values and max(values)-min(values)>c['max_span_c']: reasons.append('Temperature span above limit')
  if refs and max(refs)>c['tolerance_c']: reasons.append('Reference deviation above tolerance')
  # 85 C is ambiguous, not automatically a power-on failure at every setpoint.
  ambiguous=bool(values) and all(v==85 for v in values)
  complete=len(values)>=c['min_samples'] and duration>=c['duration_s'] and bool(run['ended'])
  status='FAIL' if reasons else ('PASS' if complete and not ambiguous else 'INCOMPLETE')
  if not complete: reasons.append('Insufficient valid samples/duration or run not finalized')
  if ambiguous: reasons.append('Constant 85 C requires independent verification')
  results.append({'channel':ch,'status':status,'valid':len(values),'errors':bad,'error_pct':rate,'minimum':min(values) if values else None,'maximum':max(values) if values else None,'mean':statistics.mean(values) if values else None,'span':max(values)-min(values) if values else None,'roms':sorted(roms),'max_reference_error':max(refs) if refs else None,'reasons':reasons})
 manual=[]
 # Legacy records retain their original scope; never add new requirements retroactively.
 required=c.get('checks', ['visual','continuity','power','response','recovery'] if count else [k for k in CHECKS if k!='rtc'])
 for key in required:
  attempts=[e for e in run['events'] if e['kind']=='manual' and e['payload'].get('check')==key]
  last=attempts[-1]['payload'] if attempts else None
  manual.append({'check':key,'title':CHECKS[key][0],'status':last['status'] if last else 'NOT TESTED','evidence':last['evidence'] if last else '', 'attempts':len(attempts)})
 states=[x['status'] for x in results+manual]
 if not run['integrity']: overall='INVALID EVIDENCE'
 elif run['mode']!='HARDWARE': overall='DEMO - NOT HARDWARE EVIDENCE'
 elif transports or 'FAIL' in states: overall='FAIL'
 elif not run['ended'] or not states or any(s!='PASS' for s in states): overall='INCOMPLETE'
 else: overall='PASS - SELECTED SCOPE ONLY'
 return {'overall':overall,'duration_s':duration,'channels':results,'manual':manual,'transport_errors':len(transports),'frames':len(frames)}

def record_manual(store,rid,key,status,evidence,value=None,low=None,high=None,instrument=''):
 if key not in CHECKS or status not in ('PASS','FAIL','NOT TESTED'): raise ValueError('Invalid check/status')
 if status!='NOT TESTED' and not evidence.strip(): raise ValueError('Measured observations/evidence are required')
 payload={'check':key,'status':status,'evidence':evidence.strip()}
 if key=='power' and status=='PASS':
  for x in (value,low,high): number(x)
  if low>=high or not instrument.strip(): raise ValueError('Supply check requires approved limits and instrument ID')
  if not low<=value<=high: payload['status']='FAIL'
  payload.update(value=value,low=low,high=high,instrument=instrument)
 store.append(rid,'manual',payload)

def export_bundle(run, folder):
 folder=Path(folder); folder.mkdir(parents=True,exist_ok=True)
 stem='QC-'+run['id']; data=dict(run); data['analysis']=analyze(run)
 path=folder/(stem+'.json'); path.write_text(json.dumps(data,indent=2,allow_nan=False),encoding='utf-8')
 with (folder/(stem+'.csv')).open('w',newline='',encoding='utf-8-sig') as f:
  w=csv.writer(f); w.writerow(['run_id','host_utc','elapsed_s','seq','board','uid','firmware','channel','rom','status','temperature_c','sim_address','system_channel','sequence_source'])
  for e in run['events']:
   if e['kind']=='frame':
    p=e['payload']; d=p['data']
    for ch in d['channels']: w.writerow([run['id'],e['timestamp'],p['elapsed_s'],d['seq'],d['board'],d['uid'],d['firmware'],ch['channel'],ch.get('rom',''),ch['status'],ch.get('temperature_c',''),ch.get('sim_address',''),ch.get('system_channel',''),d.get('sequence_source','device')])
 return path
