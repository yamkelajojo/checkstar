#!/usr/bin/env node
/**
 * First-run setup for a fresh clone (Windows or POSIX).
 *
 *   npm run setup
 *
 * Installs the two Node apps, and when PHP is available prepares the Laravel
 * backend (.env, key, migrated + seeded sqlite). Everything it cannot do it
 * prints as a concrete next step instead of failing silently.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WIN = process.platform === 'win32';

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;

function run(command, args, cwd) {
  const res = spawnSync(command, args, {
    cwd: path.join(ROOT, cwd),
    shell: IS_WIN,
    stdio: 'inherit',
  });
  return res.status === 0;
}

function check(command, args) {
  const res = spawnSync(command, args, { shell: IS_WIN, stdio: 'ignore' });
  return res.status === 0;
}

console.log('Checkstar setup\n---------------');

// 1. Node apps -------------------------------------------------------------
for (const app of ['frontend', 'mobile']) {
  if (existsSync(path.join(ROOT, app, 'node_modules'))) {
    console.log(green(`• ${app}: node_modules already present, skipping install`));
    continue;
  }
  console.log(`• ${app}: npm ci ...`);
  if (!run('npm', ['ci', '--no-audit', '--no-fund'], app)) {
    console.error(red(`  failed to install ${app} dependencies`));
    process.exitCode = 1;
  }
}

// 2. Backend ---------------------------------------------------------------
const hasPhp = check('php', ['-v']);
if (!hasPhp) {
  console.log(yellow('• backend: PHP not found on PATH.'));
  console.log(yellow('  Install PHP 8.2+ (https://windows.php.net/download or Laravel Herd),'));
  console.log(yellow('  then re-run: npm run setup'));
} else {
  const envFile = path.join(ROOT, 'backend', '.env');
  if (!existsSync(envFile)) {
    copyFileSync(path.join(ROOT, 'backend', '.env.example'), envFile);
    console.log(green('• backend: created .env from .env.example'));
    run('php', ['artisan', 'key:generate', '--force'], 'backend');
  } else {
    console.log('• backend: .env already present');
  }

  if (!existsSync(path.join(ROOT, 'backend', 'vendor'))) {
    console.log(yellow('• backend: vendor/ missing — run: cd backend && composer install'));
    process.exitCode = 1;
  } else {
    const db = path.join(ROOT, 'backend', 'database', 'database.sqlite');
    if (!existsSync(db)) {
      console.log('• backend: migrating + seeding sqlite ...');
      run('php', ['artisan', 'migrate', '--seed', '--force'], 'backend');
    } else {
      console.log(green('• backend: database.sqlite already present'));
    }
  }
}

console.log('\nDone. Start everything with: ' + green('npm run dev'));
console.log('Or just web+api:             ' + green('npm run dev:web'));
