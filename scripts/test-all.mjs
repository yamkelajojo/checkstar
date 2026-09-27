#!/usr/bin/env node
/**
 * Run every test suite in the repo and print one summary.
 *
 *   npm test              # backend + frontend + mobile
 *   npm run typecheck     # tsc --noEmit for frontend + mobile
 *
 * Suites that cannot run in the current environment (e.g. no PHP) are reported
 * as SKIPPED with the exact command to run them, never silently passed.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WIN = process.platform === 'win32';
const TYPECHECK = process.argv.includes('--typecheck');

function run(label, command, args, cwd) {
  process.stdout.write(`\n\x1b[1m== ${label} ==\x1b[0m\n`);
  const res = spawnSync(command, args, {
    cwd: path.join(ROOT, cwd),
    shell: IS_WIN,
    stdio: 'inherit',
  });
  if (res.error) return { label, status: 'error', detail: res.error.message };
  return { label, status: res.status === 0 ? 'pass' : 'fail', code: res.status };
}

function phpAvailable() {
  return spawnSync('php', ['-v'], { shell: IS_WIN, stdio: 'ignore' }).status === 0;
}

const results = [];

if (TYPECHECK) {
  results.push(run('frontend typecheck', 'npx', ['tsc', '--noEmit'], 'frontend'));
  results.push(run('mobile typecheck', 'npx', ['tsc', '--noEmit'], 'mobile'));
} else {
  if (phpAvailable()) {
    results.push(run('backend (php artisan test)', 'php', ['artisan', 'test'], 'backend'));
  } else {
    results.push({
      label: 'backend (php artisan test)',
      status: 'skip',
      detail: 'PHP not on PATH — run: cd backend && php artisan test',
    });
  }
  results.push(run('frontend (vitest)', 'npm', ['test'], 'frontend'));
  results.push(run('mobile (jest)', 'npm', ['test'], 'mobile'));
}

const ICON = { pass: '\x1b[32mPASS\x1b[0m', fail: '\x1b[31mFAIL\x1b[0m', skip: '\x1b[33mSKIP\x1b[0m', error: '\x1b[31mERR \x1b[0m' };
console.log('\n---------------- summary ----------------');
for (const r of results) {
  const extra = r.detail ? `  (${r.detail})` : r.code ? `  (exit ${r.code})` : '';
  console.log(`${ICON[r.status]}  ${r.label}${extra}`);
}
const failed = results.filter((r) => r.status === 'fail' || r.status === 'error');
process.exit(failed.length ? 1 : 0);
