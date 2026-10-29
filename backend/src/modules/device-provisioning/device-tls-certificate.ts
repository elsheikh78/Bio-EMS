import { X509Certificate } from "node:crypto";
import { isIP } from "node:net";

export function validateDeviceTlsCertificate(bytes: Buffer, platformUrl: string, now = new Date()) {
  if (bytes.length < 100 || bytes.length > 2500)
    throw new Error("Installed device TLS certificate exceeds the controller buffer limits");
  const url = new URL(platformUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("Device TLS requires an HTTPS origin without credentials or a path");
  let certificate: X509Certificate;
  try {
    certificate = new X509Certificate(bytes);
  } catch {
    throw new Error("Installed device TLS certificate is not valid X509");
  }
  if (bytes[0] === 0x30 && !bytes.equals(certificate.raw))
    throw new Error("Device TLS certificate has trailing DER data");
  const time = now.getTime();
  if (
    !Number.isFinite(time) ||
    time < Date.parse(certificate.validFrom) ||
    time >= Date.parse(certificate.validTo)
  )
    throw new Error(
      "Installed device TLS certificate is expired or not yet valid; check the Windows clock"
    );
  if (
    certificate.ca ||
    certificate.issuer !== certificate.subject ||
    !certificate.verify(certificate.publicKey)
  )
    throw new Error("Device TLS requires the controlled self-signed server certificate");
  if (!certificate.keyUsage?.includes("1.3.6.1.5.5.7.3.1"))
    throw new Error(
      "Installed device TLS certificate is not authorized for TLS server authentication"
    );
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const matches = isIP(host)
    ? certificate.checkIP(host)
    : certificate.checkHost(host, { subject: "never", wildcards: false });
  if (!matches)
    throw new Error(
      "Platform URL does not match the installed TLS certificate SAN; prepare a matching certificate or use its verified DNS name before flashing"
    );
  return {
    platformOrigin: url.origin,
    hostname: host,
    fingerprint256: certificate.fingerprint256,
    validTo: certificate.validTo,
  };
}
