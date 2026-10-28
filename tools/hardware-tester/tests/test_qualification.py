import tempfile,unittest
from pathlib import Path
from core import Store,record_manual,analyze,BASE_CHECK_KEYS
from qualification import PROFILE,CHECKS,REVISION

class QualificationTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.store=Store(Path(self.tmp.name)/'qc.sqlite');self.addCleanup(self.store.db.close)
  self.config=dict(unit='unit',operator='operator',procedure=REVISION,profile=PROFILE,minimum_c=-10,maximum_c=50,duration_s=60,min_samples=20,max_error_pct=0,max_span_c=2,stale_s=8,reference_c=None,tolerance_c=.5,instrument='')
 def test_frozen_plan_and_incomplete_missing_steps(self):
  rid=self.store.start(self.config);self.store.finish(rid);run=self.store.load(rid)
  self.assertEqual(len(run['config']['qualification_plan']),18)
  self.assertEqual(run['config']['checks'],list(CHECKS));self.assertEqual(analyze(run)['overall'],'INCOMPLETE')
 def test_sequence_and_out_of_scope(self):
  rid=self.store.start(self.config)
  with self.assertRaisesRegex(ValueError,'Previous'):record_manual(self.store,rid,'short_rs485','PASS','observation')
  with self.assertRaisesRegex(ValueError,'outside'):record_manual(self.store,rid,'visual','PASS','observation')
  record_manual(self.store,rid,'bench_setup','PASS','label and wiring evidence')
  with self.assertRaises(ValueError):record_manual(self.store,rid,'power','PASS','no meter')
 def test_full_manual_scope_is_explicit_and_preserves_events(self):
  rid=self.store.start(self.config)
  for key in CHECKS:
   record_manual(self.store,rid,key,'PASS','operator observation with linked run IDs',value=5,low=4.75,high=5.25,instrument='meter')
  self.store.finish(rid);run=self.store.load(rid);self.assertEqual(analyze(run)['overall'],'PASS - SELECTED SCOPE ONLY')
  from report import write_pdf
  path=Path(self.tmp.name)/'qualification.pdf';write_pdf(run,path);self.assertGreater(path.stat().st_size,1000)
 def test_existing_assembly_scope_does_not_gain_new_required_checks(self):
  c=dict(self.config,profile='Assembly / manual evidence');rid=self.store.start(c)
  self.assertEqual(self.store.load(rid)['config']['checks'],list(BASE_CHECK_KEYS))
  self.assertNotIn('qualification_plan',self.store.load(rid)['config'])
 def test_fault_code_retained_and_unknown_rejected(self):
  rid=self.store.start(self.config)
  record_manual(self.store,rid,'bench_setup','FAIL','inspection issue',fault_code='SIM_COMM_LOSS')
  self.assertEqual(self.store.load(rid)['events'][-1]['payload']['fault_code'],'SIM_COMM_LOSS')
  with self.assertRaisesRegex(ValueError,'fault code'):record_manual(self.store,rid,'bench_setup','FAIL','issue',fault_code='invented')
