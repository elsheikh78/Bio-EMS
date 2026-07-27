# Security Roadmap

Version: 1.0

---

## BIO-EMS v1.0

Device Authentication

- Device ID
- Serial Number
- Activation Code (Hashed)
- QR Code Registration
- Manual Approval

---

## BIO-EMS v2.0

Advanced Device Authentication

- Device Certificates
- Mutual TLS
- Secure MQTT
- Certificate Rotation
- Device Trust Management

---

## Design Principle

The v1.0 architecture shall be designed so that future certificate-based authentication can be added without redesigning the database or APIs.