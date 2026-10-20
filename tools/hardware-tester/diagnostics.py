"""Bounded capture of pilot.7 bench commands. Never flashes, pairs or sends SMS."""
import re
import time

COMMANDS = (('status', 5), ('storage', 3), ('rtc', 3), ('simscan', 12), ('gsmdiag', 18))

def collect(port, clock=time.monotonic):
 records=[]; total=0
 for command, timeout in COMMANDS:
  port.reset_input_buffer()
  port.write((command+'\n').encode('ascii'))
  deadline=clock()+timeout; chunks=[]; complete=False
  while clock()<deadline:
   raw=port.read_until(b'\n',size=4097)
   if not raw: continue
   total+=len(raw)
   if len(raw)>4096 or total>32768: raise ValueError('Diagnostic output exceeded the capture limit')
   text=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', raw.decode('utf-8',errors='replace'))
   text=''.join(c for c in text if c in '\n\r\t' or ord(c)>=32)
   chunks.append(text)
   if 'bioems> ' in text:
    complete=True
    break
  records.append({'command':command,'complete':complete,'output':''.join(chunks)})
 return {'expected_firmware':'0.1.0-pilot.7','source':'USB operational console',
         'commands':records,'automatic_disposition':False}
