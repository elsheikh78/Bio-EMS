import hashlib
import unittest
from usb_update import stage
class Stream:
    def __init__(self, wrong_offset=False, reject=False, prompt=False):
        self.commands=[]; self.reply=b''; self.wrong_offset=wrong_offset; self.reject=reject; self.prompt=prompt
    def write(self, data):
        line=data.decode().strip(); self.commands.append(line)
        if line.startswith('updatebegin '): self.reply=b'UPDATE_READY 0\n'
        elif line.startswith('updatechunk '):
            import base64
            _,offset,encoded=line.split()
            end=int(offset)+len(base64.b64decode(encoded))+(1 if self.wrong_offset else 0)
            self.reply=b'UPDATE_REJECTED chunk\n' if self.reject else f'UPDATE_ACK {end}\n'.encode()
        elif line=='updateend': self.reply=b'UPDATE_STAGED rebooting\n'
    def flush(self): pass
    def readline(self):
        result=self.reply; self.reply=b''
        return (b'bioems> bioems> '+result) if self.prompt and result else result
class UpdateTests(unittest.TestCase):
    def test_hash_failure_sends_nothing(self):
        stream=Stream()
        with self.assertRaises(ValueError): stage(stream,b'image','0'*64)
        self.assertEqual(stream.commands,[])
    def test_bounded_chunks_and_explicit_unaccepted_result(self):
        image=b'x'*300; stream=Stream(); r=stage(stream,image,hashlib.sha256(image).hexdigest())
        self.assertEqual(r['state'],'STAGED_NOT_ACCEPTED')
        self.assertEqual(len([c for c in stream.commands if c.startswith('updatechunk ')]),3)
        self.assertEqual(stream.commands[-1],'updateend')
        self.assertNotIn('updateconfirm',stream.commands)
    def test_console_prompt_does_not_hide_acknowledgements(self):
        stream=Stream(prompt=True); image=b'valid-transfer-test'
        self.assertEqual(stage(stream,image,hashlib.sha256(image).hexdigest())['state'],'STAGED_NOT_ACCEPTED')
    def test_wrong_ack_or_rejection_aborts_without_selecting_image(self):
        for stream in [Stream(wrong_offset=True),Stream(reject=True)]:
            with self.assertRaises(RuntimeError): stage(stream,b'image',hashlib.sha256(b'image').hexdigest())
            self.assertEqual(stream.commands[-1],'updateabort')
            self.assertNotIn('updateend',stream.commands)
if __name__=='__main__': unittest.main()
