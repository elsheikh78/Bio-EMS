# BIO-EMS HW-519 RS485 bench interface contract

**Date:** 2026-10-06  
**Status:** controlled bench wiring contract; not field hardware release  
**Applies to:** MAIN-16-2G / SIM-D4 breadboard qualification

## Decision

The RS485 interface used by the current BIO-EMS bench prototype is the **HW-519 automatic-direction TTL-to-RS485 module**.

The HW-519 manages half-duplex transmit/receive direction in hardware. BIO-EMS firmware and wiring therefore **must not use an MCU DE/RE direction-control signal**.

## SIM-D4 / Arduino Nano wiring

| Arduino Nano | HW-519 | Rule |
| --- | --- | --- |
| D1 / TX | RXD | Nano transmit enters the HW-519 receive/input pin |
| D0 / RX | TXD | HW-519 transmit/output enters Nano receive |
| 5 V / verified module supply | VCC | Verify actual purchased module markings before energizing |
| GND | GND | Common logic reference |
| D6 | No connection | Not an RS485 direction pin |
| D7 | Address bit 0 | OPEN/GND according to SIM address |
| D8 | Address bit 1 | OPEN/GND according to SIM address |
| - | A+ | RS485 A/+ |
| - | B- | RS485 B/- |

D7/D8 address mapping remains:

| SIM address | D7 | D8 |
| ---: | --- | --- |
| 1 | OPEN | OPEN |
| 2 | GND | OPEN |
| 3 | OPEN | GND |
| 4 | GND | GND |

The address is sampled at startup. Power-cycle or reset the Nano after changing D7/D8.

## MAIN / ESP32-S3 wiring

| ESP32-S3 | HW-519 | Rule |
| --- | --- | --- |
| GPIO17 / TX | RXD | Controller transmit into HW-519 |
| GPIO18 / RX | TXD | HW-519 output into controller receive |
| verified compatible supply | VCC | Verify the actual module supply and logic level before connection |
| GND | GND | Common logic reference for the bench topology |
| GPIO16 | No connection | Not an RS485 direction pin |
| - | A+ | RS485 A/+ |
| - | B- | RS485 B/- |

## Bus and protocol

- Modbus RTU: 9600 baud, 8 data bits, no parity, 1 stop bit.
- SIM addresses: 1 through 4.
- A+ connects to A+ and B- connects to B- unless physical incoming inspection proves different markings on the purchased module.
- Termination and grounding must be verified on the actual bench build. Do not assume every seller's HW-519 clone has the same fitted termination/jumper state.
- The current local-market HW-519 is a **bench-only qualification component**. Passing bench tests does not release it as the final industrial/protected/isolated field interface.

## Firmware contract

Corrected packages:
- ESP32-S3 controller: `0.1.0-pilot.4`
- SIM-D4 Nano: `0.1.0-bench.2`

The corrected source removes:
- Nano D6 direction switching.
- ESP32 GPIO16 direction switching.
- DE/RE wiring instructions for HW-519.

## Incoming inspection gate

Before first power-on of purchased HW-519 modules:

1. Confirm PCB marking/model and photograph both sides.
2. Confirm pin labels: VCC, GND, RXD, TXD, A+, B- (and any additional ground/termination pads).
3. Confirm acceptable supply voltage from the actual seller/module documentation.
4. Measure the TTL-side output level before connecting it to ESP32 GPIO18.
5. Inspect whether a 120-ohm termination resistor is fitted/enabled and document its state.
6. Record the module supplier, SKU, photos and measurements in the Hardware Lab evidence.

## External references used to resolve the interface

- Makers Electronics, HW-519 TTL to RS485 Converter Module: https://makerselectronics.com/product/hw-519-ttl-to-rs485-converter-module/
- Electra Store, HW-519 TTL to RS485 Converter Module: https://www.electra.store/products/hw-519-ttl-to-rs485-converter-module
- Codey Online, HW-0519 pinout and Arduino wiring reference: https://codey.online/components/hw-0519-auto-flow-rs485-module

These references support automatic direction and the TX/RX pin roles. Physical incoming inspection remains mandatory because low-cost modules sold under the same model name can vary.
