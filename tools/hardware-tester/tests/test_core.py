import json,tempfile,unittest
from pathlib import Path
from core import Store,Capture,analyze,record_manual,parse_frame,export_bundle
class QC(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.s=Store(Path(self.tmp.name)/'qc.sqlite');self.t=0
  self.c=dict(unit='UNIT-001',operator='Inspector',procedure='QC-HW-001 Rev A',profile='ESP32 / 1 sensor',minimum_c=0,maximum_c=40,duration_s=4,min_samples=2,max_error_pct=0,max_span_c=2,stale_s=8,reference_c=None,tolerance_c=.5,instrument='')
  self.r=self.s.start(self.c);self.cap=Capture(self.s,self.r,lambda:self.t)
 def tearDown(self):self.s.db.close();self.tmp.cleanup()
 def frame(self,seq=1,temp=24,status='ok',rom='2800000000000001'):
  return json.dumps(dict(protocol='bioems-qc/1',board='esp32s3',uid='ESP123',firmware='qc-sensors-0.1.0',seq=seq,uptime_ms=seq*2000,channels=[dict(channel=1,status=status,rom=rom,temperature_c=temp)]))
 def manual(self):
  for key in ['visual','continuity','power','response','recovery']:record_manual(self.s,self.r,key,'PASS','Procedure evidence QC-1',value=3.3,low=3.1,high=3.5,instrument='DMM-1')
 def complete(self):
  self.cap.feed(self.frame());self.t=2;self.cap.feed(self.frame(2));self.t=4;self.manual();self.cap.stop()
 def result(self):return analyze(self.s.load(self.r))['overall']
 def test_pass(self):self.complete();self.assertTrue(self.result().startswith('PASS'))
 def test_insufficient_samples(self):self.cap.feed(self.frame());self.manual();self.cap.stop();self.assertEqual(self.result(),'INCOMPLETE')
 def test_missing_manual(self):self.cap.feed(self.frame());self.t=4;self.cap.feed(self.frame(2));self.cap.stop();self.assertEqual(self.result(),'INCOMPLETE')
 def test_missing_sensor(self):self.cap.feed(self.frame(status='missing'));self.t=4;self.cap.feed(self.frame(2));self.manual();self.cap.stop();self.assertEqual(self.result(),'FAIL')
 def test_stale(self):self.cap.feed(self.frame());self.t=10;self.cap.tick();self.cap.stop();self.assertEqual(self.result(),'FAIL')
 def test_gap_without_tick(self):self.cap.feed(self.frame());self.t=10;self.cap.feed(self.frame(2));self.cap.stop();self.assertEqual(self.result(),'FAIL')
 def test_duplicate(self):self.cap.feed(self.frame());self.cap.feed(self.frame());self.complete();self.assertEqual(self.result(),'FAIL')
 def test_sequence_loss(self):self.cap.feed(self.frame());self.t=4;self.cap.feed(self.frame(3));self.cap.stop();self.assertEqual(analyze(self.s.load(self.r))['transport_errors'],1)
 def test_sensor_replacement(self):self.cap.feed(self.frame());self.t=4;self.cap.feed(self.frame(2,rom='2800000000000002'));self.manual();self.cap.stop();self.assertEqual(self.result(),'FAIL')
 def test_malformed(self):
  for line in ['hello','[]',self.frame(temp=float('nan')),self.frame(temp=True)]:self.assertIsNone(self.cap.feed(line))
  self.assertEqual(analyze(self.s.load(self.r))['frames'],0)
 def test_demo(self):
  self.r=self.s.start(self.c,'DEMO');self.cap=Capture(self.s,self.r,lambda:self.t);self.complete();self.assertIn('DEMO',self.result())
 def test_immutable(self):
  self.complete()
  with self.assertRaises(ValueError):record_manual(self.s,self.r,'visual','PASS','overwrite')
 def test_tamper(self):
  self.complete();self.s.db.execute("UPDATE events SET payload='{}' WHERE kind='manual'");self.s.db.commit();self.assertFalse(self.s.load(self.r)['integrity'])
 def test_tail_deletion(self):
  self.complete();self.s.db.execute('DELETE FROM events WHERE id=(SELECT max(id) FROM events)');self.s.db.commit();self.assertFalse(self.s.load(self.r)['integrity'])
 def test_power_limit(self):
  record_manual(self.s,self.r,'power','PASS','Measured',value=5,low=3,high=3.5,instrument='DMM-1');self.assertEqual(analyze(self.s.load(self.r))['manual'][2]['status'],'FAIL')
 def test_retests(self):
  record_manual(self.s,self.r,'visual','FAIL','Loose wire');record_manual(self.s,self.r,'visual','PASS','Corrected; retested');a=analyze(self.s.load(self.r));self.assertEqual(a['manual'][0]['attempts'],2);self.assertEqual(a['manual'][0]['status'],'PASS')
 def test_reference(self):
  self.r=self.s.start(dict(self.c,reference_c=20,instrument='REF-1'));self.cap=Capture(self.s,self.r,lambda:self.t);self.complete();self.assertEqual(self.result(),'FAIL')
 def test_wrong_board(self):
  with self.assertRaises(ValueError):parse_frame(self.frame(),'nano')
 def test_export(self):
  from report import write_pdf
  self.complete();run=self.s.load(self.r);p=export_bundle(run,self.tmp.name);pdf=write_pdf(run,p.with_suffix('.pdf'));self.assertTrue(pdf.read_bytes().startswith(b'%PDF'));self.assertIn('analysis',json.loads(p.read_text()))
 def test_header_tamper(self):
  self.complete();self.s.db.execute("UPDATE runs SET mode='DEMO' WHERE id=?",(self.r,));self.s.db.commit();self.assertEqual(self.result(),'INVALID EVIDENCE')
 def test_open_never_passes(self):
  self.cap.feed(self.frame());self.t=4;self.cap.feed(self.frame(2));self.manual();self.assertEqual(self.result(),'INCOMPLETE')
 def test_voltage_needs_meter(self):
  with self.assertRaises(ValueError):record_manual(self.s,self.r,'power','PASS','Measured',value=3.3,low=3.1,high=3.5)
 def test_range_fault_persists(self):
  self.cap.feed(self.frame(temp=45));self.t=2;self.cap.feed(self.frame(2));self.t=4;self.cap.feed(self.frame(3));self.manual();self.cap.stop();self.assertEqual(self.result(),'FAIL')
 def test_nano_missing_channels(self):
  self.r=self.s.start(dict(self.c,profile='Nano / 4 sensors'));self.cap=Capture(self.s,self.r,lambda:self.t)
  for i in range(3):
   f=json.loads(self.frame(i+1));f['board']='nano';self.t=i*2;self.cap.feed(json.dumps(f))
  self.manual();self.cap.stop();self.assertEqual(self.result(),'FAIL')
 def test_manual_only_no_stale(self):
  self.r=self.s.start(dict(self.c,profile='Assembly / manual evidence'));self.cap=Capture(self.s,self.r,lambda:self.t);self.t=60;self.cap.tick();self.cap.stop();self.assertEqual(analyze(self.s.load(self.r))['transport_errors'],0)
if __name__=='__main__':unittest.main()
