"""Printable English QC report; manual reviewer approval remains separate."""
from html import escape
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.graphics.shapes import Drawing, Line, String, PolyLine
from core import VERSION, analyze

def write_pdf(run,path):
 a=analyze(run); styles=getSampleStyleSheet();
 regular=Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts/arial.ttf'
 bold=Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts/arialbd.ttf'
 if not regular.exists():
  regular=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'); bold=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
 if regular.exists() and bold.exists():
  pdfmetrics.registerFont(TTFont('QC-Regular',str(regular))); pdfmetrics.registerFont(TTFont('QC-Bold',str(bold)))
  for name in ('Normal','BodyText'): styles[name].fontName='QC-Regular'
  for name in ('Title','Heading1','Heading2','Heading3'): styles[name].fontName='QC-Bold'
 styles.add(styles['BodyText'].clone('TableHead',textColor=colors.white))
 styles['BodyText'].fontSize=9; styles['BodyText'].leading=13
 story=[]
 def p(s,style='BodyText'): return Paragraph(escape(str(s)).replace('\n','<br/>'),styles[style])
 def add(s,style='BodyText'): story.append(p(s,style))
 def table(rows,widths):
  t=Table([[p(v,'TableHead' if i==0 else 'BodyText') for v in row] for i,row in enumerate(rows)],colWidths=widths,repeatRows=1,hAlign='LEFT')
  t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#16354b')),('TEXTCOLOR',(0,0),(-1,0),colors.white),('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),.3,colors.HexColor('#d4dfe5')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f0f5f8')])]))
  story.append(t); story.append(Spacer(1,5*mm))
 add('BIO-EMS | HARDWARE QUALITY CONTROL','Title')
 add('Assembly inspection and bench test record | QC-HW-001 / Rev A','Heading2')
 add(a['overall'],'Heading1')
 if run['mode']!='HARDWARE': add('SIMULATED DATA - NOT A HARDWARE ACCEPTANCE RECORD','Heading2')
 add('Software-calculated disposition. Valid only for the selected test scope and recorded acceptance criteria. It is not commissioning, calibration certification or final product release.')
 c=run['config']
 table([['Record','Value'],['Report / run ID',run['id']],['Unit / assembly serial',c['unit']],['Operator',c['operator']],['Procedure / revision',c['procedure']],['Profile',c['profile']],['Host UTC start / end',run['started']+' / '+str(run['ended'] or 'OPEN / NOT FINALIZED')],['Application / data integrity',VERSION+' / '+('Verified hash chain and seal' if run['integrity'] else 'INVALID')],['Duration / frames / transport faults',f"{a['duration_s']:.1f} s / {a['frames']} / {a['transport_errors']}"],['Reference instrument',c.get('instrument') or 'No reference instrument recorded']], [53*mm,121*mm])
 add('Acceptance criteria frozen at run creation','Heading2')
 add(f"Range {c['minimum_c']} to {c['maximum_c']} C; duration >= {c['duration_s']} s; valid samples/channel >= {c['min_samples']}; errors <= {c['max_error_pct']}%; span <= {c['max_span_c']} C; stale timeout {c['stale_s']} s.")
 add('Reference: '+(f"{c['reference_c']} C; maximum absolute deviation {c['tolerance_c']} C" if c.get('reference_c') is not None else 'Not used; accuracy/calibration is NOT established.'))
 add('Limits are operator-approved bench criteria, not manufacturer accuracy specifications. All transport faults block PASS. Missing required checks block PASS. Sensor errors are assessed against the frozen error-rate limit.')
 if c.get('qualification_plan'):
  add('Staged qualification procedure','Heading2')
  add('MANUAL checklist disposition. Linked sensor/RS485 acquisitions and physical evidence require reviewer verification. No simultaneous sixteen-channel acquisition or automatic GSM fallback is claimed.')
  add(c.get('qualification_revision',''))
  for step in c['qualification_plan']:
   add(step['title'],'Heading3');add(step['instructions'])
 if c['profile']=='Main + Nano / 4 sensors via RS485':
  add('Integrated path: Main USB -> RS485 -> Nano -> four probes. Main hardware UID is observed; sensor ROM and Nano unique identity/sample age are not available in this protocol. Sequence/time are host scan counters, not device uptime. Perform and record individual probe response/recovery; a fresh scan alone does not prove a new sensor conversion. Network, SD, GSM, RTC and UPS are outside this selected scope.')
 if a['channels']: story.append(PageBreak())
 for r in a['channels']:
  add(f"Channel {r['channel']} | {r['status']}",'Heading2')
  def f(v): return '-' if v is None else f'{v:.3f}'
  table([['ROM / metric','Result'],['Sensor ROM',', '.join(r['roms']) or ('Not available via Modbus; SIM '+str(c['sim_address'])+' / input '+str(r['channel']) if c['profile']=='Main + Nano / 4 sensors via RS485' else 'Not detected')],['Valid / faulty samples',f"{r['valid']} / {r['errors']}"],['Minimum / maximum / mean (C)',f"{f(r['minimum'])} / {f(r['maximum'])} / {f(r['mean'])}"],['Span / error rate / max reference error',f"{f(r['span'])} C / {f(r['error_pct'])}% / {f(r['max_reference_error'])} C"],['Analysis','; '.join(r['reasons']) or 'All selected automated criteria met']], [65*mm,109*mm])
  points=[]
  for e in run['events']:
   if e['kind']=='frame':
    for ch in e['payload']['data']['channels']:
     if ch['channel']==r['channel'] and ch['status']=='ok': points.append((e['payload']['elapsed_s'],ch['temperature_c']))
  if len(points)>1:
   d=Drawing(490,145); x0,y0,w,h=48,25,425,95
   xs=[x for x,y in points]; ys=[y for x,y in points]; lo=min(ys)-.1; hi=max(ys)+.1
   d.add(Line(x0,y0,x0+w,y0,strokeColor=colors.grey)); d.add(Line(x0,y0,x0,y0+h,strokeColor=colors.grey))
   d.add(String(1,y0+h-3,f'{hi:.2f} C',fontSize=8)); d.add(String(1,y0,f'{lo:.2f} C',fontSize=8))
   d.add(String(x0,8,f'{min(xs):.1f} s',fontSize=8)); d.add(String(x0+w-55,8,f'{max(xs):.1f} s',fontSize=8))
   coords=[]
   for x,y in points: coords.extend([x0+(x-min(xs))/max(.01,max(xs)-min(xs))*w,y0+(y-lo)/(hi-lo)*h])
   d.add(PolyLine(coords,strokeColor=colors.HexColor('#008a8e'),strokeWidth=1.3)); story.append(d)
 add('Required inspections and functional evidence','Heading2')
 for r in a['manual']:
  add(f"{r['title']} | {r['status']} | recorded attempts: {r['attempts']}",'Heading3')
  add(r['evidence'] or 'Not tested / no evidence recorded.')
 story.append(PageBreak())
 add('Event and retest ledger','Heading2')
 add('Manual retests retain prior attempts in this ledger. A failed automated run is never overwritten: create a new run and record its predecessor in the procedure/notes. Raw sample data accompanies this report in JSON/CSV.')
 for e in run['events']:
  if e['kind'] in ('manual','transport','note'):
   add(e['timestamp']+' | '+e['kind']+' | '+str(e['payload']))
 add('Review and authorization','Heading2')
 add('Reviewer name: ____________________   Signature: ____________________')
 add('Review date: _____________________   Disposition: ____________________')
 add('Approval is handwritten or performed under a separate controlled process. This software does not apply electronic signatures.')
 add('Evidence chain SHA-256: '+(run['last_hash'] or 'No events'))
 add('Hash chains and exported checksums detect accidental changes; local files are not a tamper-proof regulated audit system. Preserve the original database and report bundle under your document-control process.')
 def footer(canvas,doc):
  canvas.setFont('QC-Regular' if regular.exists() else 'Helvetica',8); canvas.setFillColor(colors.HexColor('#526677'))
  canvas.drawString(18*mm,12*mm,'BIO-EMS QC-HW-001 | '+run['id'][:8]+' | '+run['mode'])
  canvas.drawRightString(192*mm,12*mm,'Page '+str(doc.page))
 Path(path).parent.mkdir(parents=True,exist_ok=True)
 SimpleDocTemplate(str(path),pagesize=(210*mm,297*mm),leftMargin=18*mm,rightMargin=18*mm,topMargin=16*mm,bottomMargin=22*mm,title='BIO-EMS hardware quality control',author='BIO-EMS Hardware Tester').build(story,onFirstPage=footer,onLaterPages=footer)
 return Path(path)
