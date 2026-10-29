const fs = require('node:fs');
const { X509Certificate } = require('node:crypto');
const MAX_CONTROLLER_CERTIFICATE_BYTES = 2500;
const certificate = new X509Certificate(fs.readFileSync(process.env.BIOEMS_TEST_TLS_CERT));
if (!certificate.checkHost('ems.example.test', { subject: 'never', wildcards: false })
    || !certificate.checkIP('192.0.2.20')
    || !certificate.checkIP('::1')
    || certificate.checkIP('192.0.2.21')
    || !certificate.verify(certificate.publicKey)
    || certificate.ca
    || !certificate.keyUsage?.includes('1.3.6.1.5.5.7.3.1')
    || certificate.raw.length > MAX_CONTROLLER_CERTIFICATE_BYTES) {
  throw new Error('Generated Windows certificate failed DNS/IP/server-usage validation');
}
