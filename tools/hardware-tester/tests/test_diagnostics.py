import unittest
from diagnostics import collect, COMMANDS
from core import Store, analyze, CHECKS
from pathlib import Path
import tempfile

class FakePort:
 def __init__(self): self.sent=[];self.parts=[]
 def reset_input_buffer(self): self.parts=[]
 def write(self,b): self.sent.append(b);self.parts=[b'output\r\n',b'bioems> ']
 def read_until(self,*args,**kwargs): return self.parts.pop(0) if self.parts else b''

class DiagnosticTests(unittest.TestCase):
 def test_bounded_readonly_commands(self):
  p=FakePort();r=collect(p)
  self.assertEqual(p.sent,[ (c+'\n').encode() for c,t in COMMANDS])
  self.assertTrue(all(c['complete'] for c in r['commands']))
  self.assertFalse(r['automatic_disposition'])
  self.assertNotIn(b'gsmtest',b''.join(p.sent))
  self.assertNotIn(b'settime',b''.join(p.sent))
 def test_output_limit(self):
  p=FakePort();p.read_until=lambda *a,**k:b'x'*4097
  with self.assertRaises(ValueError):collect(p)
 def test_timeout_not_pass(self):
  p=FakePort();p.read_until=lambda *a,**k:b''
  now=[0]
  def clock():now[0]+=1;return now[0]
  r=collect(p,clock=clock)
  self.assertTrue(all(not c['complete'] for c in r['commands']))
 def test_frozen_rev_b_checks(self):
  with tempfile.TemporaryDirectory() as t:
   s=Store(Path(t)/'q.sqlite')
   c=dict(unit='MAIN1',operator='QC',procedure='RevB',profile='Main + 1 SIM / Rev B',minimum_c=0,maximum_c=40,duration_s=4,min_samples=2,max_error_pct=0,max_span_c=2,stale_s=8,reference_c=None,tolerance_c=.5,instrument='')
   r=s.start(c);run=s.load(r)
   self.assertIn('rtc',run['config']['checks']);self.assertNotIn('battery',run['config']['checks'])
   self.assertEqual(analyze(run)['overall'],'INCOMPLETE');s.db.close()
if __name__=='__main__':unittest.main()
