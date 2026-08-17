# BIO EGYPT Pilot — Installation and Wiring Requirements

## Pre-installation survey

Record and approve for each Site:

- marked-up floor plan and controlled area names;
- proposed controller location and access/maintenance clearance;
- mains supply, protective device, earthing, and backup-power availability;
- Ethernet/Wi-Fi availability, signal evidence, firewall/DNS/NTP constraints, and
  4G/SIM coverage assumptions;
- every Sensor route, measured cable length, containment, penetration, and fire/IP
  sealing requirement;
- environmental conditions at controller, junction, and Sensor locations;
- customer restrictions on drilling, shutdown, hygiene, and work permits.

## Controller-placement baseline

The planning assumption is one BIO-EMS Site Controller v1 per Site. This is not a
confirmed mounting design. The survey must verify channel capacity, electrical load,
cable limitations, network coverage, serviceability, environmental rating, and route
feasibility. If one controller cannot meet the verified constraints, raise a scope
change before installation.

The controller must be accessible to authorized maintenance personnel, protected
from condensation and unauthorized operation, and outside controlled cold space
unless its approved enclosure and hardware specification explicitly permit otherwise.

## Sensor and cable installation

- Use the approved industrial DS18B20 assembly and its released hardware datasheet.
- Do not approve conductor size, topology, maximum length, termination, shielding, or
  power arrangement from this document; record them from the released controller and
  Sensor electrical design before work starts.
- Segregate extra-low-voltage Sensor wiring from mains and interference sources in
  accordance with the approved electrical design and local rules.
- Use suitable containment, glands, strain relief, drip loops, and sealed penetrations
  for the environment.
- Avoid inaccessible concealed joints. Any permitted joint must be documented,
  protected, and serviceable.
- Label both cable ends and the Sensor using the exact Map ID.
- Record as-built route and measured length; do not copy planned values as installed
  evidence.
- Do not place probes where stock, cleaning, doors, airflow, or maintenance can damage
  them or create a known unrepresentative reading.

## Network and time

- Primary communication is Internet over the approved Ethernet/Wi-Fi path.
- MQTT endpoint, TLS/security settings, DNS, outbound firewall rules, and credentials
  are deployment-controlled values and must not be committed to the repository.
- Confirm authoritative time synchronization before timestamp acceptance testing.
- 4G/SMS is emergency failover only under the S15-05 contract; SIM/provider selection,
  recipients, credit, signal level, and regulatory ownership are commissioning gates.

## Installation evidence

The installer must return:

- approved survey and floor-plan revision;
- controller/panel label, serial, supply, protection, and location photographs;
- Sensor/channel/serial schedule;
- cable route and measured-length schedule;
- termination and continuity results required by the released hardware procedure;
- penetration/fire/IP sealing photographs;
- deviations, rework, and final as-built drawing;
- installer and customer witness names, signatures, and dates.
