import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { operate, DATABASE_ID, d1Rows } from '../scripts/security-deployment.mjs';
const rows = results => JSON.stringify([{ success: true, results }]);
function fixture(options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'bioems-d1-'));
  const calls = [];
  let migrated = false;
  const run = async args => {
    calls.push(args);
    if (args[1] === 'info' && args[0] === 'd1') return JSON.stringify({ uuid: options.wrongId ? 'other' : DATABASE_ID, name: 'bioems-company' });
    if (args[1] === 'export') { if (!options.missingBackup) writeFileSync(args.at(-1), '-- synthetic test export\n'); return ''; }
    if (args[1] === 'time-travel') return JSON.stringify({ bookmark: options.missingBookmark ? '' : 'test-bookmark' });
    if (args[1] === 'migrations') { migrated = true; return ''; }
    if (args[0] === 'deploy') return '';
    const sql = args.at(-1);
    if (sql.includes('d1_migrations')) return rows((options.wrongHistory ? ['unknown.sql'] : ['0001_company.sql','0002_viewer.sql',...(migrated ? ['0003_company_sessions.sql'] : [])]).map(name => ({ name })));
    if (sql.includes('sqlite_master')) return rows(options.missingIndex ? [{ name: 'company_sessions', type: 'table' }] : [{ name: 'company_sessions', type: 'table' }, { name: 'company_sessions_expiry', type: 'index' }]);
    if (sql.includes('index_info')) return rows([{ name: 'expires_at' }]);
    return rows(['token_hash','admin_key_hash','created_at','expires_at'].map(name => ({ name })));
  };
  return { root, run, calls, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
test('inspect never exports, migrates or deploys', async () => {
  const f = fixture(); try { const r = await operate({ run: f.run }); assert.equal(r.remoteChanged, false); assert.equal(f.calls.length, 2); } finally { f.cleanup(); }
});
for (const flag of ['wrongId','wrongHistory','missingBackup','missingBookmark']) {
  test(`${flag} refuses migration and deployment`, async () => {
    const f = fixture({ [flag]: true }); try {
      await assert.rejects(operate({ mode: 'deploy', backupRoot: f.root, run: f.run }));
      assert.equal(f.calls.some(a => a[1] === 'migrations' || a[0] === 'deploy'), false);
    } finally { f.cleanup(); }
  });
}
test('backup and bookmark precede migration; schema verification precedes deploy', async () => {
  const f = fixture(); try {
    const r = await operate({ mode: 'deploy', backupRoot: f.root, run: f.run });
    assert.equal(r.workerDeployed, true);
    assert.ok(f.calls.findIndex(a => a[1] === 'export') < f.calls.findIndex(a => a[1] === 'migrations'));
    assert.ok(f.calls.findIndex(a => a.at(-1).includes('PRAGMA')) < f.calls.findIndex(a => a[0] === 'deploy'));
    const receipt = JSON.parse(readFileSync(r.receiptPath));
    assert.equal(receipt.migrationVerified, true); assert.equal(receipt.workerDeployed, true);
    assert.equal(receipt.backupSha256.length, 64); assert.ok(!JSON.stringify(receipt).includes('synthetic test export'));
  } finally { f.cleanup(); }
});
test('missing index prevents deployment after migration', async () => {
  const f = fixture({ missingIndex: true }); try {
    await assert.rejects(operate({ mode: 'deploy', backupRoot: f.root, run: f.run }), /verification failed/);
    assert.equal(f.calls.some(a => a[0] === 'deploy'), false);
  } finally { f.cleanup(); }
});
test('structured D1 errors fail closed', () => {
  for (const data of ['{}','[]','[{"success":false,"results":[]}]']) assert.throws(() => d1Rows(data));
});
