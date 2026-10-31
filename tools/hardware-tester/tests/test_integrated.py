import json
import tempfile
import threading
import unittest
from pathlib import Path
from integrated import exchange, identify, frame
from core import Store, Capture, analyze, record_manual, export_bundle
UID='aabbccddeeff'
def scan():
 return {'hardwareUid':UID,'modules':[{'address':a,'responding':a==1,'inputs':[{'input':i,'channel':i,'status':0,'value':24+i/10} for i in range(1,5)] if a==1 else []} for a in range(1,5)]}
class IntegratedTests(unittest.TestCase):
 def convert(self,data=None,seq=1):return frame(json.dumps(scan() if data is None else data),UID,'0.1.0-pilot.10',1,seq,seq*3000)
 def test_no_invented_rom_and_mapping(self):
  f=self.convert();self.assertEqual([c['system_channel'] for c in f['channels']],[1,2,3,4]);self.assertTrue(all('rom' not in c for c in f['channels']))
 def test_absent_module(self):
  d=scan();d['modules'][0].update(responding=False,inputs=[]);self.assertTrue(all(c['status']=='missing' for c in self.convert(d)['channels']))
 def test_bad_scans(self):
  for mutate in [lambda d:d.update(hardwareUid='other'),lambda d:d['modules'].pop(),lambda d:d['modules'][0]['inputs'].pop(),lambda d:d['modules'][0]['inputs'][0].update(channel=9),lambda d:d['modules'][0]['inputs'][0].update(status=True),lambda d:d['modules'][1].update(address=1)]:
   d=scan();mutate(d)
   with self.assertRaises(ValueError):self.convert(d)
 def test_identity(self):
  self.assertEqual(identify('hardware-uid: '+UID+'\nfirmware: 0.1.0-pilot.10\n'),(UID,'0.1.0-pilot.10'))
  with self.assertRaises(ValueError):identify('hardware-uid: '+UID+'\nfirmware: qc-sensors-0.1.0\n')
 def test_readonly(self):
  class Port:
   def reset_input_buffer(self):pass
   def write(self,b):self.written=b
   def read_until(self,*args,**kwargs):return b'BIOEMS_SIM_SCAN:'+json.dumps(scan()).encode()+b'\n'
  p=Port();self.assertEqual(json.loads(exchange(p,'simscan',threading.Event())),scan());self.assertEqual(p.written,b'simscan\n')
  with self.assertRaises(ValueError):exchange(p,'pair 123',threading.Event())
  stop=threading.Event();stop.set()
  with self.assertRaises(ValueError):exchange(p,'simscan',stop)
 def run_case(self,fault=False):
  tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup);s=Store(Path(tmp.name)/'qc.sqlite');self.addCleanup(s.db.close)
  c=dict(unit='MAIN-SIM-1',operator='QC',procedure='Integrated Rev A',profile='Main + Nano / 4 sensors via RS485',sim_address=1,minimum_c=0,maximum_c=40,duration_s=4,min_samples=2,max_error_pct=0,max_span_c=2,stale_s=20,reference_c=None,tolerance_c=.5,instrument='')
  r=s.start(c);now=[0];cap=Capture(s,r,lambda:now[0])
  for i in range(2):
   d=scan()
   if fault and i==0:d['modules'][0]['inputs'][2]['status']=2
   now[0]=i*4;self.assertIsNotNone(cap.feed(json.dumps(self.convert(d,i+1))))
  for key in s.load(r)['config']['checks']:record_manual(s,r,key,'PASS','Physical evidence recorded',value=5,low=4.8,high=5.2,instrument='DMM-1')
  cap.stop();return s.load(r),tmp.name
 def test_analysis_pdf(self):
  from report import write_pdf
  run,folder=self.run_case();self.assertTrue(analyze(run)['overall'].startswith('PASS'));self.assertEqual(len(analyze(run)['channels']),4)
  path=export_bundle(run,folder);write_pdf(run,path.with_suffix('.pdf'));self.assertIn('sim_address',path.with_suffix('.csv').read_text(encoding='utf-8-sig'))
 def test_fault_persists(self):
  run,_=self.run_case(True);self.assertEqual(analyze(run)['overall'],'FAIL')

class FirmwareCompatibilityTests(unittest.TestCase):
 def test_legacy_operating_firmware_is_readable_without_claiming_strict_tls(self):
  uid,firmware=identify('hardware-uid: aabbccddeeff\nfirmware: 0.1.0-pilot.7\n')
  self.assertEqual(firmware,'0.1.0-pilot.7')
 def test_strict_tls_operating_firmware_is_readable(self):
  self.assertEqual(identify('hardware-uid: aabbccddeeff\nfirmware: 0.1.0-pilot.10\n')[1],'0.1.0-pilot.10')
