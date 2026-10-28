const { generateKeyPairSync, createHash, sign, verify, constants } = require('node:crypto');
const { writeFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const [directory, owner] = process.argv.slice(2);
if (!directory || !owner?.trim() || !existsSync(directory)) throw new Error('An existing protected new directory and key owner are required');
for (const name of ['main-signing-private.pem','main-signing-public.pem','custody.json']) {
  if (existsSync(path.join(directory,name))) throw new Error('Key preparation never overwrites an existing file');
}
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 3072, publicExponent: 0x10001 });
const proof = Buffer.from('BIOEMS signing-key self-test; not a firmware signature');
const signature = sign('sha256', proof, { key: privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 });
if (!verify('sha256', proof, { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, signature)) throw new Error('Key self-test failed');
const publicDer = publicKey.export({ type: 'spki', format: 'der' });
const inventoryId = createHash('sha256').update(publicDer).digest('hex');
writeFileSync(path.join(directory, 'main-signing-private.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
writeFileSync(path.join(directory, 'main-signing-public.pem'), publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o600, flag: 'wx' });
writeFileSync(path.join(directory, 'custody.json'), JSON.stringify({ schema: 1, utc: new Date().toISOString(), owner,
  purpose: 'ESP32-S3 Secure Boot v2 signing; use ESP-IDF/espsecure for image signing and eFuse digest generation',
  algorithm: 'RSA-3072', inventoryId, inventoryIdIsEfuseDigest: false, privateKeyEncrypted: false,
  storageRequirement: 'Restricted ACL plus owner-controlled encrypted offline backup; never Git or client installer',
  backupVerified: false, recoveryQualified: false, hardwareActivated: false }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ inventoryId, directory, hardwareActivated: false, backupVerified: false }));
