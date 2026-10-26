import hashlib,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch,MagicMock
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import flashing
class FlashTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  def entry(path):
   p=self.root/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b'test bytes')
   return {'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
  self.m={'schema':1,'purpose':'isolated-sensor-qc','firmware':'qc-sensors-0.1.0','source_commit':'a'*40,'tools':{k:entry('runtime/'+k) for k in ('avrdude','avrdude_conf','esptool')},'targets':{}}
  self.m['targets']['esp32s3']={'board':'esp32s3','images':[dict(entry('firmware/'+str(i)+'.bin'),offset=o) for i,o in enumerate(['0x0','0x8000','0xe000','0x10000'])]}
  for key,baud in [('nano-old',57600),('nano-new',115200)]:self.m['targets'][key]={'board':'nano','baud':baud,'images':[entry('firmware/'+key+'.hex')]}
  self.save()
 def save(self):(self.root/'firmware/qc-manifest.json').write_text(json.dumps(self.m))
 def test_esp_layout_and_no_erase(self):
  cmd,_,_=flashing.command(self.root,'esp32s3','COM3');self.assertEqual(cmd[1:3],['--chip','esp32s3']);self.assertIn('write_flash',cmd);self.assertNotIn('erase_flash',cmd);self.assertNotIn('--force',cmd)
  for offset in ['0x0','0x8000','0xe000','0x10000']:self.assertIn(offset,cmd)
 def test_nano_bootloaders_signature_and_verify(self):
  for target,baud in [('nano-old','57600'),('nano-new','115200')]:
   cmd,_,_=flashing.command(self.root,target,'COM4');self.assertEqual(cmd[cmd.index('-p')+1],'atmega328p');self.assertEqual(cmd[cmd.index('-b')+1],baud);self.assertNotIn('-V',cmd);self.assertNotIn('-F',cmd);self.assertIn('-U',cmd)
 def test_detection_has_no_flash_write(self):
  for target in flashing.TARGETS.values():
   cmd,_,_=flashing.command(self.root,target,'COM3',True);self.assertNotIn('write_flash',cmd);self.assertNotIn('-U',cmd)
 def test_corrupt_image_rejected(self):
  (self.root/'firmware/nano-old.hex').write_bytes(b'wrong')
  with self.assertRaisesRegex(ValueError,'checksum'):flashing.command(self.root,'nano-old','COM1')
 def test_wrong_layout_rejected(self):
  self.m['targets']['esp32s3']['images'][0]['offset']='0x1000';self.save()
  with self.assertRaisesRegex(ValueError,'layout'):flashing.command(self.root,'esp32s3','COM1')
 def test_traversal_rejected(self):
  self.m['targets']['nano-old']['images'][0]['path']='../escape.hex';self.save()
  with self.assertRaisesRegex(ValueError,'invalid'):flashing.command(self.root,'nano-old','COM1')
 def test_tool_damage_rejected(self):
  (self.root/'runtime/avrdude').write_bytes(b'wrong')
  with self.assertRaisesRegex(ValueError,'checksum'):flashing.command(self.root,'nano-old','COM1')
 def test_missing_runtime_never_success_and_retains_log(self):
  with patch('flashing.run_command',side_effect=lambda cmd,emit:emit('tool verified')),patch('flashing.verify_stream',side_effect=RuntimeError('no stream')):record,path=flashing.perform(self.root,'nano-old','COM1','unit','operator',self.root/'events',lambda s:None)
  self.assertFalse(record['success']);self.assertIn('no stream',record['error']);self.assertIn('tool verified',record['log']);self.assertEqual(json.loads(path.read_text()),record)
 def test_success_requires_runtime_and_preserves_hashes(self):
  with patch('flashing.run_command'),patch('flashing.verify_stream',return_value={'board':'nano','firmware':'qc-sensors-0.1.0'}):record,path=flashing.perform(self.root,'nano-new','COM1','unit','op',self.root/'events',lambda s:None)
  self.assertTrue(record['success']);self.assertEqual(record['images'],self.m['targets']['nano-new']['images'])
 def test_detect_does_not_claim_runtime_test(self):
  with patch('flashing.run_command'),patch('flashing.verify_stream') as verify:record,_=flashing.perform(self.root,'nano-old','COM1','unit','op',self.root/'events',lambda s:None,True)
  verify.assert_not_called();self.assertEqual(record['operation'],'detect');self.assertNotIn('runtime',record)
 def test_wrong_runtime_identity_fails(self):
  stream=MagicMock();stream.read_until.return_value=b'{"protocol":"bioems-qc/1","board":"esp32s3","firmware":"qc-sensors-0.1.0"}\n';serial=MagicMock();serial.Serial.return_value.__enter__.return_value=stream
  with patch.dict(sys.modules,{'serial':serial}):
   with self.assertRaisesRegex(ValueError,'identity'):flashing.verify_stream('COM1','nano','qc-sensors-0.1.0')
 def test_failed_package_never_starts_tool(self):
  (self.root/'firmware/nano-old.hex').unlink()
  with patch('flashing.run_command') as run:record,path=flashing.perform(self.root,'nano-old','COM1','unit','op',self.root/'events',lambda s:None)
  run.assert_not_called();self.assertFalse(record['success']);self.assertTrue(path.exists())

class PackageTests(unittest.TestCase):
 def test_staged_windows_package_validates_all_targets(self):
  from build_flash_package import build
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp); data=root/'arduino-data'
   paths=[data/'packages/arduino/tools/avrdude/6.3.0-arduino17/bin/avrdude.exe',data/'packages/arduino/tools/avrdude/6.3.0-arduino17/etc/avrdude.conf',data/'packages/esp32/hardware/esp32/3.3.2/tools/partitions/boot_app0.bin',root/'dist/BIOEMS-QC-Flash-Tool.exe']
   paths += [root/'firmware/build/esp32'/n for n in ['QC_Sensors.ino.bootloader.bin','QC_Sensors.ino.partitions.bin','QC_Sensors.ino.bin']]
   paths += [root/'firmware/build'/n/'QC_Sensors.ino.hex' for n in ['nano','nano-new']]
   for path in paths:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(b'fixture only - never flash')
   build(data,'b'*40,root)
   for target in flashing.TARGETS.values():flashing.load_target(root,target)
 def test_child_failure_is_not_success(self):
  with self.assertRaisesRegex(RuntimeError,'exit 7'):flashing.run_command([sys.executable,'-c','print("write failed");raise SystemExit(7)'],lambda s:None)
