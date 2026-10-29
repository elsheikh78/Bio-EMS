# ADR-026: Main endpoint identity and explicit hardware protection gate

Status: Accepted for the security source candidate, 28 October 2026. Physical production acceptance remains separate.

Main pilot.8 requires HTTPS endpoint-name validation against its provisioned installation certificate. Provisioning checks exact DNS/IP SAN, validity, self-signature, server usage and size before flashing or transferring credentials. Windows issuance includes explicit DNS/IP SANs; existing-site rotation is a controlled maintenance operation with protected backup. Certificate preparation never activates or overwrites an installed identity.

Keep the existing controlled self-signed server-leaf trust model for this correction. Arbitrary CA chains and per-device mTLS require a separate lifecycle design. Certificate renewal requires coordinated replacement of installed trust; DHCP changes do not automatically change trust.

Report actual Secure Boot and Flash Encryption state and offer a build-time startup requirement for both. Do not infer hardware protection from successful pairing or burn eFuses through qualification. Tester reports evidence without granting production acceptance. Signing-key custody, per-device encryption, secure recovery and independent manufacturing verification remain required.
