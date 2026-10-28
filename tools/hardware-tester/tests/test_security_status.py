import unittest
from security_status import summarize
class SecurityStatusTests(unittest.TestCase):
 def test_pilot_without_protection_is_not_accepted(self):
  r=summarize('hardware-uid: aabbccddeeff\nfirmware: 0.1.0-pilot.8\ntls-identity-validation: REQUIRED\nsecure-boot-enabled: false\nflash-encryption-enabled: false\n')
  self.assertFalse(r['secure_boot']);self.assertFalse(r['production_accepted'])
 def test_missing_or_ambiguous_data_never_passes(self):
  for text in ('', 'secure-boot-enabled: true\nsecure-boot-enabled: false\n'):
   r=summarize(text);self.assertIsNone(r['secure_boot']);self.assertEqual(r['hardware_controls'],'NOT_ENABLED_OR_UNKNOWN')
 def test_enabled_flags_are_reported_not_attestation(self):
  r=summarize('hardware-uid: aabbccddeeff\nfirmware: 0.1.0-pilot.8\ntls-identity-validation: REQUIRED\nsecure-boot-enabled: true\nflash-encryption-enabled: true\n')
  self.assertEqual(r['hardware_controls'],'REPORTED_ENABLED_NOT_ATTESTED');self.assertFalse(r['production_accepted'])
