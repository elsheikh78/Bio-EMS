const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { createPrivateKey, createPublicKey } = require('node:crypto');
const { tmpdir } = require('node:os');
const path = require('node:path');
test('owner key is RSA3072, matches its public key, refuses overwrite and grants no hardware acceptance', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'bioems-key-test-'));
  try {
    const script = path.join(__dirname, 'generate-signing-key.cjs');
    const result = spawnSync(process.execPath, [script, directory, 'SYNTHETIC TEST OWNER'], { encoding: 'utf8' });
    assert.equal(result.status, 0);
    const before = readFileSync(path.join(directory, 'main-signing-private.pem'));
    const key = createPrivateKey(before);
    const publicKey = createPublicKey(readFileSync(path.join(directory, 'main-signing-public.pem')));
    assert.equal(key.asymmetricKeyDetails.modulusLength, 3072);
    assert.ok(createPublicKey(key).export({ type: 'spki', format: 'der' }).equals(publicKey.export({ type: 'spki', format: 'der' })));
    const receipt = JSON.parse(readFileSync(path.join(directory, 'custody.json')));
    assert.equal(receipt.hardwareActivated, false); assert.equal(receipt.backupVerified, false); assert.equal(receipt.inventoryIdIsEfuseDigest, false);
    assert.equal(spawnSync(process.execPath, [script, directory, 'OTHER']).status, 1);
    assert.ok(before.equals(readFileSync(path.join(directory, 'main-signing-private.pem'))));
    assert.ok(!result.stdout.includes('PRIVATE KEY'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
