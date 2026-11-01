import hashlib,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch,MagicMock
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import operating

class OperatingTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  def entry(path,data=b'fixture'):
   p=self.root/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
   return {'path':path,'sha256':hashlib.sha256(data).hexdigest()}
  self.entry=entry
  self.m={'schema':1,'purpose':'integrated-operating-firmware','source_commit':'a'*40,'targets':{},
          'tools':{k:entry('runtime/'+k) for k in ['esptool','avrdude','avrdude_conf']}}
  self.m['targets']['esp32s3']={'board':'esp32s3','firmware':'0.1.0-pilot.11','flash':{'mode':'dio','frequency':'80m','size':'4MB'},
    'images':[dict(entry('firmware/main'+str(i)),offset=o) for i,o in enumerate(['0x0','0x8000','0x10000'])]}
  for key,baud in [('nano-old',57600),('nano-new',115200)]:
   self.m['targets'][key]={'board':'nano','firmware':'0.1.0-bench.2','baud':baud,'images':[entry('firmware/'+key)]}
  self.save()
 def save(self):(self.root/'firmware/operating-manifest.json').write_text(json.dumps(self.m))
 def test_write_targets_never_erase_nvs_or_disable_verification(self):
  for target in operating.TARGETS.values():
   cmd,_,_=operating.command(self.root,target,'COM7')
   for unsafe in ['erase_flash','--force','-F','-V','0x9000','0xe000']:self.assertNotIn(unsafe,cmd)
   self.assertIn('write_flash' if target=='esp32s3' else '-U',cmd)
 def test_both_bootloaders(self):
  for target,baud in [('nano-old','57600'),('nano-new','115200')]:
   cmd,_,_=operating.command(self.root,target,'COM8');self.assertEqual(cmd[cmd.index('-b')+1],baud)
 def test_detect_never_writes(self):
  for target in operating.TARGETS.values():
   cmd,_,_=operating.command(self.root,target,'COM1',True);self.assertNotIn('write_flash',cmd);self.assertNotIn('-U',cmd)
 def test_bad_package_blocks_process_and_retains_failure(self):
  (self.root/'firmware/nano-new').write_bytes(b'corrupt')
  with patch('operating.run_command') as run:
   r,p=operating.perform(self.root,'nano-new','COM1','unit','op',self.root/'events',lambda s:None)
  run.assert_not_called();self.assertFalse(r['success']);self.assertEqual(json.loads(p.read_text()),r)
 def test_missing_runtime_is_failure(self):
  with patch('operating.run_command'),patch('operating.verify_runtime',side_effect=RuntimeError('no runtime')):
   r,_=operating.perform(self.root,'nano-old','COM1','u','o',self.root/'events',lambda s:None)
  self.assertFalse(r['success']);self.assertIn('no runtime',r['error'])
 def test_success_keeps_hashes_and_identity(self):
  with patch('operating.run_command'),patch('operating.verify_runtime',return_value={'board':'nano','sim_address':1}):
   r,_=operating.perform(self.root,'nano-new','COM1','u','o',self.root/'events',lambda s:None)
  self.assertTrue(r['success']);self.assertEqual(r['firmware'],'0.1.0-bench.2');self.assertEqual(r['source_commit'],'a'*40);self.assertIn('sha256',r['images'][0])
 def test_detect_does_not_claim_runtime(self):
  with patch('operating.run_command'),patch('operating.verify_runtime') as verify:
   r,_=operating.perform(self.root,'esp32s3','COM1','u','o',self.root/'events',lambda s:None,True)
  verify.assert_not_called();self.assertNotIn('runtime',r);self.assertTrue(r['success'])
 def test_reject_layout_nvs_wrong_version_and_baud(self):
  self.m['targets']['esp32s3']['images'][1]['offset']='0x9000';self.save()
  with self.assertRaisesRegex(ValueError,'layout'):operating.load_target(self.root,'esp32s3')
  self.m['targets']['nano-new']['baud']=57600;self.save()
  with self.assertRaisesRegex(ValueError,'baud'):operating.load_target(self.root,'nano-new')
  self.m['targets']['nano-old']['firmware']='qc-sensors-0.1.0';self.save()
  with self.assertRaisesRegex(ValueError,'version'):operating.load_target(self.root,'nano-old')
 def test_reject_traversal_and_bad_port(self):
  self.m['targets']['nano-old']['images'][0]['path']='../escape';self.save()
  with self.assertRaises(ValueError):operating.command(self.root,'nano-old','COM1')
  with self.assertRaisesRegex(ValueError,'COM'):operating.command(self.root,'nano-new','--erase')
 def test_tool_corruption(self):
  (self.root/'runtime/avrdude').write_bytes(b'bad')
  with self.assertRaisesRegex(ValueError,'checksum'):operating.command(self.root,'nano-new','COM1')
 def test_reject_oversize_partition_image(self):
  self.m['targets']['esp32s3']['images'][1]=dict(self.entry('firmware/huge',b'x'*4097),offset='0x8000');self.save()
  with self.assertRaisesRegex(ValueError,'protected'):operating.load_target(self.root,'esp32s3')
 def reply(self,address=1,version=0x100):
  data=bytes([address,3,8])+b''.join(v.to_bytes(2,'big') for v in [version,1,address,4])
  return data+operating.crc16(data).to_bytes(2,'little')
 def test_nano_crc_address_and_registers(self):
  self.assertEqual(operating.verify_nano_reply(self.reply(),1)['sim_address'],1)
  for data,address in [(self.reply()[:-1]+b'\0',1),(self.reply(2),1),(self.reply(version=2),1)]:
   with self.assertRaises(ValueError):operating.verify_nano_reply(data,address)
 def test_usb_runtime_uses_operating_baud_and_address(self):
  stream=MagicMock();stream.read.return_value=self.reply(2);serial=MagicMock();serial.Serial.return_value.__enter__.return_value=stream
  with patch.dict(sys.modules,{'serial':serial}),patch('operating.time.sleep'):
   r=operating.verify_runtime('COM7','nano-new',2)
  self.assertEqual(r['sim_address'],2);serial.Serial.assert_called_once_with('COM7',9600,timeout=.4)
 def test_main_runtime_uses_status_not_provisioning(self):
  serial=MagicMock()
  with patch.dict(sys.modules,{'serial':serial}),patch('operating.time.sleep'),patch('integrated.exchange',return_value='status') as exchange,patch('integrated.identify',return_value=('a'*12,'0.1.0-pilot.11')):
   r=operating.verify_runtime('COM3','esp32s3',1)
  self.assertEqual(r['firmware'],'0.1.0-pilot.11');self.assertEqual(exchange.call_args.args[1],'status')

class OperatingPackageTests(unittest.TestCase):
 setUp=OperatingTests.setUp
 save=OperatingTests.save
 def package_fixture(self):
  source=self.root/'governed-main';source.mkdir()
  segments=[]
  for i,offset in enumerate(['0x0','0x8000','0x10000']):
   p=source/('image'+str(i)+'.bin');p.write_bytes(b'main fixture')
   segments.append({'offset':offset,'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
  manifest={'target':'esp32s3','firmwareVersion':'0.1.0-pilot.11','sourceCommit':'a'*40,
            'segments':segments,'flash':{'mode':'dio','frequency':'80m','size':'4MB'}}
  (source/'manifest.json').write_text(json.dumps(manifest))
  (self.root/'firmware/qc-manifest.json').write_text(json.dumps({'tools':self.m['tools'],'tool_files':[]}))
  for folder in ['nano-old','nano-new']:self.entry('firmware/operating/'+folder+'/SIM_D4.ino.hex',b':fixture')
  return source
 def test_package_requires_same_source_and_includes_both_bootloaders(self):
  from build_operating_package import build
  source=self.package_fixture();m=build(source,'a'*40,self.root)
  for t in operating.TARGETS.values():operating.command(self.root,t,'COM9')
  self.assertEqual(m['targets']['nano-new']['baud'],115200)
  with self.assertRaisesRegex(ValueError,'exact source'):build(source,'b'*40,self.root)
 def test_package_rejects_main_corruption(self):
  from build_operating_package import build
  source=self.package_fixture();(source/'image0.bin').write_bytes(b'bad')
  with self.assertRaisesRegex(ValueError,'segment'):build(source,'a'*40,self.root)
