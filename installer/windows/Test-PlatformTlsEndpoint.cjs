const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { X509Certificate } = require('node:crypto');
const [mode, applicationRoot, certificatePath, platformUrl] = process.argv.slice(2);
const publicBytes = fs.readFileSync(certificatePath);
const { validateDeviceTlsCertificate } = require(path.join(applicationRoot, 'backend/dist/src/modules/device-provisioning/device-tls-certificate.js'));
const identity = validateDeviceTlsCertificate(publicBytes, platformUrl);
if (mode === 'probe') {
  const certificate = new X509Certificate(publicBytes);
  const request = https.get(`${identity.platformOrigin}/api/v1/health`, {
    ca: certificate.toString(), rejectUnauthorized: true, timeout: 15000,
  }, response => {
    const peer = response.socket.getPeerCertificate();
    if (response.statusCode !== 200 || !peer.raw || !peer.raw.equals(certificate.raw)) {
      response.resume(); process.exitCode = 1; return;
    }
    let size = 0;
    let body = '';
    response.on('data', chunk => { size += chunk.length; if (size > 4096) response.destroy(new Error('Oversized health response')); else body += chunk; });
    response.on('end', () => { try { if (JSON.parse(body).status !== 'UP') process.exitCode = 1; } catch { process.exitCode = 1; } });
    response.on('error', () => { process.exitCode = 1; });
  });
  request.on('timeout', () => request.destroy(new Error('TLS health timeout')));
  request.on('error', () => { console.error('Pinned endpoint health verification failed'); process.exitCode = 1; });
} else if (mode !== 'validate') { throw new Error('Unsupported TLS check mode'); }
