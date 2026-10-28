# BIO EGYPT Customer Evidence Register - 31 August 2026

## Control boundary

This register records the five customer-supplied scans reviewed on 31 August 2026. Signed source
records remain in the controlled customer file store; the repository retains identity, digest,
decision, and Pilot impact. A scan is not commissioning evidence unless its own scope says so.

| Evidence ID | Source file | SHA-256 | Recorded decision | Pilot effect |
| --- | --- | --- | --- | --- |
| `BE001-EV-001` | `Bio EMS.pdf` (2 pages) | `c5d6408103cb8d99ae70dd7c51ce4d0971ef2a7fb2aa9c83004c2fd1ed997543` | Approved and signed by Dr. Mayada Samir on 23 Aug 2026 | Confirms Site information/access only; BE-001 remains closed |
| `BE005-EV-001` | `Bio EMS 3.pdf` | `1b7282a9cf6b37cf558e6d09a05240bb49791bd2c217a56d1b0a4cfd4ae156b3` | Approved and signed on 24 Aug 2026 | Closes logical Site/Controller/channel/Sensor mapping; physical identities remain commissioning fields |
| `BE006-EV-001` | `Bio EMS 2.pdf` | `6338757e5c5c0fa07a1f957ebd2ed4c168c61317816f0397cc018d9aceab063a` | Approved with changes and signed on 24 Aug 2026 | Approves the Cold Room concept conditionally; final configured thresholds require the signed comment to be resolved against Sensor calibration error/uncertainty |
| `BE002-EV-DRAFT-01` | `CamScanner 08-26-2026 12.28.pdf` | `34d057c289cd5a982dee17fcaad081aead91c59c64a6cf00973c4e46f816d2da` | Hand-marked drawing; no controlled approval block visible | Survey input only; does not close BE-002 |
| `BE002-REF-IC2Q-01` | `المركز الدولي للجودة.pdf` | `9c26880ff8e9ad7a6a7c355419cdbbf26642e49c08962e409998815d28d51b9f` | IC2Q warehouse qualification layout, report `IC2Q-VAL-BIO EGYPT-SEP08-04`, page 15/38 | Positioning reference only; its 17 temperature/RH loggers are not the approved 13-Sensor BIO-EMS CPC map |

## BE-005 approved logical mapping

The signed form approves `MNL-CTRL-01` channels CH01-CH07 for seven El Manial Sensors and
`OCT-CTRL-01` channels CH01-CH13 for thirteen CPC / 6th of October Sensors. The approved total is
20 logical Sensors across two 16-channel Site Controllers. Probe serial numbers, DS18B20 ROM IDs,
calibration certificate references, final physical positions, and measured cable lengths remain
TBD until controlled commissioning evidence is recorded.

## BE-006 controlled interpretation

The form records a 2-8 C Cold Room operating range, proposed warning limits below 2 C and above
8 C, proposed critical limits at or below 1 C and at or above 9 C, a five-minute Warning delay,
and a ten-minute Critical delay. The customer selected `APPROVED WITH CHANGES`. The handwritten
comment is treated conservatively as requiring final warning/threshold values to account for each
Sensor's calibration error/uncertainty. No software configuration shall be released from the
printed values alone until Quality records the effective values or an approved calculation rule.
Dry Storage and Antechamber limits remain TBD.

## BE-002 drawing interpretation

The CamScanner drawing and IC2Q page provide useful field context, but neither is a complete signed
BIO-EMS two-Site position schedule. The IC2Q document relates to a prior temperature/relative-
humidity qualification layout with 17 logger positions and must not be silently converted into
the BIO-EMS temperature-only logical map. BE-002 remains blocking pending controlled marked-up
plans and Quality approval for all 20 BIO-EMS Map IDs.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.
