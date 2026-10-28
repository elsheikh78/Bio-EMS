import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATABASE = 'bioems-company';
export const DATABASE_ID = '21d37686-0ae1-4e17-b995-388131d29e86';
const BASE_MIGRATIONS = ['0001_company.sql', '0002_viewer.sql'];
const SESSION_MIGRATION = '0003_company_sessions.sql';
const EXPECTED_OBJECTS = ['company_sessions', 'company_sessions_expiry'];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export function d1Rows(output) {
  const results = JSON.parse(output);
  if (!Array.isArray(results) || !results.length || results.some(r => r.success !== true || !Array.isArray(r.results))) {
    throw new Error('D1 did not return a successful structured result');
  }
  return results.flatMap(r => r.results);
}

function execute(args, cwd = root) {
  const result = spawnSync(process.execPath, [join(root, 'node_modules/wrangler/bin/wrangler.js'), ...args], {
    cwd, encoding: 'utf8', timeout: 600_000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, CI: 'true', NO_COLOR: '1', WRANGLER_SEND_METRICS: 'false' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.error || result.status !== 0) throw new Error(`Wrangler ${args.slice(0, 3).join(' ')} failed; no later step was run`);
  return result.stdout;
}

export async function operate({ mode = 'inspect', backupRoot, run = execute, clock = () => new Date(), projectRoot = root } = {}) {
  if (!['inspect', 'migrate', 'deploy'].includes(mode)) throw new Error('Unsupported operation');
  const info = JSON.parse(await run(['d1', 'info', DATABASE, '--json']));
  if (info.uuid !== DATABASE_ID || info.name !== DATABASE) throw new Error('Cloudflare database identity mismatch; refused');
  const query = sql => run(['d1', 'execute', DATABASE, '--remote', '--json', '--command', sql]);
  const applied = d1Rows(await query('SELECT name FROM d1_migrations ORDER BY id')).map(r => r.name);
  if (BASE_MIGRATIONS.some(name => !applied.includes(name)) || applied.some(name => ![...BASE_MIGRATIONS, SESSION_MIGRATION].includes(name))) {
    throw new Error('Unexpected migration history; review this database before continuing');
  }
  const migrations = [...BASE_MIGRATIONS, SESSION_MIGRATION].map(name => ({
    name, sha256: digest(readFileSync(join(projectRoot, 'migrations', name))),
  }));
  if (mode === 'inspect') return { database: DATABASE, databaseId: DATABASE_ID, applied, migrations, remoteChanged: false };
  if (!backupRoot || !existsSync(resolve(backupRoot))) throw new Error('An existing protected backup directory is required');
  const directory = join(resolve(backupRoot), `company-${clock().toISOString().replace(/[:.]/g, '-')}`);
  mkdirSync(directory, { mode: 0o700 });
  const backupPath = join(directory, 'before.sql');
  await run(['d1', 'export', DATABASE, '--remote', '--output', backupPath]);
  if (!existsSync(backupPath) || readFileSync(backupPath).length === 0) throw new Error('A nonempty backup is required before migration');
  const timeTravel = JSON.parse(await run(['d1', 'time-travel', 'info', DATABASE, '--json']));
  if (typeof timeTravel.bookmark !== 'string' || !timeTravel.bookmark.trim()) throw new Error('Time Travel bookmark unavailable; migration refused');
  const receipt = { schema: 1, utc: clock().toISOString(), database: DATABASE, databaseId: DATABASE_ID,
    beforeApplied: applied, migrations, backupSha256: digest(readFileSync(backupPath)),
    timeTravelBookmark: timeTravel.bookmark, migrationVerified: false, workerDeployed: false };
  const receiptPath = join(directory, 'receipt.json');
  const save = () => writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
  save();
  if (!applied.includes(SESSION_MIGRATION)) await run(['d1', 'migrations', 'apply', DATABASE, '--remote']);
  const objects = d1Rows(await query("SELECT name,type FROM sqlite_master WHERE name IN ('company_sessions','company_sessions_expiry')"));
  if (!objects.some(r => r.name === EXPECTED_OBJECTS[0] && r.type === 'table') ||
      !objects.some(r => r.name === EXPECTED_OBJECTS[1] && r.type === 'index')) throw new Error('Session table/index verification failed; Worker deployment refused');
  const columns = d1Rows(await query('PRAGMA table_info(company_sessions)'));
  if (['token_hash', 'admin_key_hash', 'created_at', 'expires_at'].some(name => !columns.some(c => c.name === name))) throw new Error('Session schema does not match this Worker');
  const after = d1Rows(await query('SELECT name FROM d1_migrations ORDER BY id')).map(r => r.name);
  if (!after.includes(SESSION_MIGRATION)) throw new Error('Migration version was not recorded');
  receipt.migrationVerified = true;
  save();
  if (mode === 'deploy') {
    await run(['deploy', '--dry-run']);
    await run(['deploy']);
    receipt.workerDeployed = true;
    save();
  }
  return { database: DATABASE, databaseId: DATABASE_ID, receiptPath, migrationVerified: true,
    workerDeployed: receipt.workerDeployed, acceptance: 'VERIFY_REAL_LOGIN_LOGOUT_AND_COPIED_COOKIE_REJECTION' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  operate({ mode: process.argv[2], backupRoot: process.argv[3] }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(error.message); process.exitCode = 1;
  });
}
