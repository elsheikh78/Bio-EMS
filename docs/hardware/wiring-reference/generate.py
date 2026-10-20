"""Deterministic named-terminal drawings. Python stdlib; no image model."""
from pathlib import Path
from html import escape
OUT=Path(__file__).resolve().parent
INK='#172a3a'; BLUE='#075f9b'; RED='#b92032'
def txt(x,y,s,size=20,color=INK):
    return f'<text x="{x}" y="{y}" font-family="DejaVu Sans,sans-serif" font-size="{size}" fill="{color}">{escape(s)}</text>'
def rect(x,y,w,h,fill='#f1f6fa'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{fill}" stroke="#93a9b8"/>'
def page(name,title,subtitle,rows,notes):
    h=max(920,210+len(rows)*48+len(notes)*30)
    a=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="{h}" viewBox="0 0 1400 {h}">','<rect width="1400" height="100%" fill="white"/>',txt(40,48,'BIO-EMS | '+title,30),txt(40,83,subtitle,17),txt(40,117,'REV B / pilot.7 • BENCH DESIGN • Verify actual terminals before connecting',17,RED)]
    for i,(wire,left,right) in enumerate(rows):
        y=155+i*48
        a += [rect(40,y,520,37),rect(840,y,520,37),txt(54,y+26,left,18),txt(854,y+26,right,18),f'<path d="M560 {y+19} H840" stroke="{BLUE}" stroke-width="3"/>',txt(650,y+12,wire,15,BLUE)]
    y=175+len(rows)*48
    for n in notes: a.append(txt(40,y,n,17));y+=30
    a.append('</svg>');(OUT/name).write_text('\n'.join(a))
page('01-main-power.svg','MAIN / DC power','Terminal schedule: every row is a connection; branch dots mean an intentional common node.',[
('P01','PS1 protected +24V branch','U1 LM2596 IN+'),('P02','PS1 -V / 0V','U1 IN-'),('P03','PS1 protected +24V branch','U2 XL4015 IN+'),('P04','PS1 -V / 0V','U2 IN-'),('P05','U1 OUT+ = 5.00V','MC1 expansion base 5V'),('P06','U1 OUT- / common 0V','MC1 GND / DC GND distribution'),('P07/08','5V / common GND (separate wires)','SD1 VCC / GND'),('P09/10','5V / common GND (separate wires)','RS1 VCC / TTL-side GND'),('P11/12','U2 OUT+ = 4.00V / OUT-','GSM1 VCC / GND (short secure leads)'),('P13/14','GSM1 VCC / GND','C1 1000uF 10V: + / negative stripe'),('P21/22','GSM1 VCC / GND','C2 100nF: either end / other end'),('P15/16','PS1 protected +24V / 0V','J1.1 / J1.2 -> SIM cable'),('FAN','Protected +24V / 0V branch','Optional 24V fan + / -')],[
'PS1 = existing S-72-24 (24V, 3A). U1/U2 share common signal ground.',
'AC inlet / fuse / switch / PE / protective covers: electrician design, outside this DC drawing.',
'No 24V to MC1, Nano, GSM, SD, RTC or converter logic terminals. Never power modem from ESP 3V3.',
'USB disconnected during external-5V operation until the exact board power path is verified.',
'Check regulator outputs unloaded first. Check GSM VCC 3.4–4.4V during 2A bursts at the module.',
'Branch fuses, cable sizes and connector ratings require actual lengths/loads. This is not AC approval.'
])
page('02-main-signals.svg','MAIN / signal terminals','MC1 = ESP32-S3 N16R8 in 44-pin passive terminal base. Names, never photo positions.',[
('R01','MC1 3V3','LS1 LV'),('R02/03','5V / common GND','LS1 HV / both GND terminals'),('R04/05','MC1 GPIO17 TX -> LS1 LV1','LS1 HV1 -> RS1 RXD'),('R06/07','RS1 TXD -> LS1 HV2','LS1 LV2 -> MC1 GPIO18 RX'),('S01','MC1 GPIO4','SD1 MOSI'),('S02','SD1 MISO','MC1 GPIO5'),('S03','MC1 GPIO6','SD1 SCK'),('S04','MC1 GPIO7','SD1 CS'),('T01/02','MC1 3V3 / GND','RTC1 VCC / GND'),('T03','MC1 GPIO8','RTC1 SDA'),('T04','MC1 GPIO9','RTC1 SCL'),('E01','MC1 GPIO11','W5500 MOSI'),('E02','W5500 MISO','MC1 GPIO13'),('E03','MC1 GPIO12','W5500 SCK'),('E04','MC1 GPIO10','W5500 CS'),('E05','MC1 GND','W5500 GND'),('BUS A','RS1 A+','J1.3 -> J2.3 -> RS2 A+'),('BUS B','RS1 B-','J1.4 -> J2.4 -> RS2 B-')],[
'LS1 is the symmetric 4-channel LV/HV MOSFET board; channels 3/4 unused. UART1 9600 8N1.',
'Confirm HW519 RXD/TXD direction and voltage on the real boards before attaching MC1.',
'SD1 HW125 VCC=5V; verify MISO remains 3.3V logic. Keep SPI short; no MOSFET UART adapter on SPI.',
'W5500 POWER ON HOLD until exact breakout is identified. INT unused; confirm onboard hardware reset.',
'RTC pullups to 3.3V only. Add 4.7k each SDA/SCL only if absent. SQW and 32K unconnected.',
'A/B twisted pair. Confirm onboard termination before adding resistors. HW519 earth terminal unassigned.'
])
page('03-sim-d4.svg','SIM-D4 / Nano + four probes','ONE incoming cable: J2.1=24V, J2.2=0V, J2.3=A, J2.4=B. No mains in this box.',[
('P17','J2.1 +24V','U3 LM2596 IN+'),('P18','J2.2 0V','U3 IN-'),('P19','U3 OUT+ = 5.00V','Nano 5V + RS2 VCC + sensor 5V bus'),('P20','U3 OUT- / common GND','Nano GND + RS2 GND + sensor GND bus'),('N01','Nano D1/TX','RS2 RXD'),('N02','RS2 TXD','Nano D0/RX'),('A/B','J2.3 / J2.4','RS2 A+ / B-'),('C01','Nano D2','CH1 DATA + R1 end 1'),('C02','Nano D3','CH2 DATA + R2 end 1'),('C03','Nano D4','CH3 DATA + R3 end 1'),('C04','Nano D5','CH4 DATA + R4 end 1'),('C14','R1 end 2 (4.7k)','5V bus'),('C16','R2 end 2 (4.7k)','5V bus'),('C18','R3 end 2 (4.7k)','5V bus'),('C20','R4 end 2 (4.7k)','5V bus'),('C05-08','5V bus: FOUR separate branches','CH1 / CH2 / CH3 / CH4 VDD'),('C09-12','GND bus: FOUR separate branches','CH1 / CH2 / CH3 / CH4 GND')],[
'Four independent 3-wire probes. Verify actual cable mapping; colours alone do not establish pin function.',
'Address 1: D7/D8 floating per Nano firmware; D6 unused. No external 5V to VIN.',
'Disconnect Nano D0/D1 from RS2 during USB flashing; disconnect external 5V until power path verified.',
'Use screw terminal adapter and secured pullup carrier; loose wires pushed into bare PCB holes are invalid.',
'HW519 automatic direction: no DE/RE control wire. Confirm direction and end termination physically.'
])
page('04-gsm-interface.svg','MAIN / SIM800L 2G UART','Q1 inverter is REQUIRED with RX inversion enabled in pilot.7. LS1 is NOT used here.',[
('G01','MC1 GPIO14 TX','R5 1k 1% end 1'),('G02','R5 end 2: NODE RX_MODEM','GSM1 RXD + R6 end 1'),('G03','R6 5.6k 1% end 2','Common GND'),('G04','GSM1 TXD','R7 4.7k end 1'),('G05','R7 end 2: NODE BASE','Q1 BASE + R8 end 1'),('G06','R8 4.7k end 2','Common GND'),('G07','Q1 EMITTER','Common GND'),('G08','Q1 COLLECTOR: NODE RX_ESP','MC1 GPIO21 RX + R9 end 2'),('G09','R9 4.7k end 1','MC1 3V3'),('SUPPLY','U2 OUT+ 4.00V / OUT-','GSM1 VCC / GND'),('BULK','GSM1 VCC / GND','1000uF 10V Low ESR + 100nF in parallel'),('RF','GSM1 verified RF connector','Matching 50-ohm cable -> EXTERNAL antenna')],[
'Q1=2N2222A. E/B/C names are electrical nodes, NOT a footprint. Verify exact maker pinout before fitting.',
'TX divider ~2.80V nominal; Q1 receiver pulls ESP RX to 3.3V. UART2 9600 8N1, RX inversion ON.',
'No UART wire to an unpowered modem. Wire with power OFF; commissioning logic only after rails stable.',
'External GSM antenna only through verified RF path; do not also fit the spring antenna blindly.',
'RST/DTR/RING/audio left unconnected for awake bench profile. Verify actual breakout power-on circuit.',
'Commands: gsmdiag; gsmtest +international-number. One REAL SMS; acceptance is not delivery.',
'No automatic SMS alarms or GPRS fallback implemented. Do not treat this as a commissioned alarm system.'
])
# Layout is deliberately separate from electrical connections.
a=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000">','<rect width="1400" height="1000" fill="white"/>',txt(40,50,'BIO-EMS | Installation layout / not to scale',30),txt(40,90,'Use electrical sheets 01–04 for connections. Positions are an arrangement, not a drilling template.',18)]
a += [rect(40,130,820,720),rect(890,130,470,720),txt(65,170,'MAIN',26),txt(915,170,'SIM-D4',26)]
for x,y,w,h,label in [(65,200,260,270,'PS1 / MAINS COMPARTMENT'),(380,200,210,100,'U1 24V -> 5V'),(620,200,210,100,'U2 24V -> 4V'),(380,350,280,150,'MC1 + terminal base'),(685,350,145,150,'GSM1 + Q1'),(380,550,130,90,'RS1 + LS1'),(540,550,125,90,'SD1'),(690,550,140,90,'RTC1'),(915,200,200,100,'U3 24V -> 5V'),(1140,200,195,100,'RS2 HW519'),(960,360,330,160,'Nano + terminal base'),(935,600,385,100,'CH1 | CH2 | CH3 | CH4 exits')]:
    a += [rect(x,y,w,h,'#fff2e9' if x==65 else '#e4f1f4'),txt(x+10,y+45,label,15)]
a += [f'<path d="M350 190 V815" stroke="{RED}" stroke-width="6"/>',txt(65,515,'FIXED INSULATED BARRIER',16,RED),txt(65,555,'Covered AC terminals',16),txt(65,590,'Electrician: inlet, fuse,',16),txt(65,620,'switch, PE, clearances',16),txt(65,710,'24V fan / guarded vent',16),txt(380,735,'DC cable duct / strain relief',17),txt(685,315,'RF -> outside wall',16),txt(930,750,'Incoming: 24V / 0V / A / B',18),txt(40,900,'Use insulated plates and standoffs matched to actual holes; secure carriers for modules without holes.',18),txt(40,935,'Keep ESP antenna clear. Box sizes, thermal airflow and AC separation require real measurements.',18),'</svg>']
(OUT/'05-installation.svg').write_text('\n'.join(a))
print('Generated 5 SVG sheets')
