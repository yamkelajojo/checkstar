#!/usr/bin/env node
/**
 * One-command dev runner for the whole Checkstar stack.
 *
 *   node scripts/dev.mjs            # api + web + mobile
 *   node scripts/dev.mjs api web    # only the listed targets
 *
 * Dependency-free on purpose: a fresh `git pull` on Windows should be able to
 * run this with nothing but Node installed (PHP/Composer/Expo are reported as
 * missing rather than crashing the run). Each child is spawned through the
 * shell on Windows so `.cmd`/`.bat` shims (npm, npx, php) resolve.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WIN = process.platform === 'win32';

const COLORS = { api: '\x1b[36m', web: '\x1b[35m', mobile: '\x1b[33m' };
const RESET = '\x1b[0m';

const TARGETS = {
  api: {
    label: 'api',
    cwd: 'backend',
    command: 'php',
    args: ['artisan', 'serve', '--host=0.0.0.0', '--port=8000'],
    // The dev API must not share a file/DB cache with the test suite.
    env: { CACHE_STORE: 'array' },
    hardRequires: true,
    requires: [
      ['backend/.env', 'run: cd backend && cp .env.example .env && php artisan key:generate'],
      ['backend/vendor', 'run: cd backend && composer install'],
      ['backend/database/database.sqlite', 'run: cd backend && php artisan migrate --seed --force'],
    ],
  },
  web: {
    label: 'web',
    cwd: 'frontend',
    command: 'npm',
    args: ['run', 'dev'],
    requires: [['frontend/node_modules', 'run: cd frontend && npm ci']],
  },
  mobile: {
    label: 'mobile',
    cwd: 'mobile',
    command: 'npx',
    args: ['expo', 'start'],
    requires: [['mobile/node_modules', 'run: cd mobile && npm ci']],
  },
};

const wanted = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const names = wanted.length ? wanted : Object.keys(TARGETS);

for (const name of names) {
  if (!TARGETS[name]) {
    console.error(`Unknown target "${name}". Use: ${Object.keys(TARGETS).join(', ')}`);
    process.exit(2);
  }
}

function prefix(child, label) {
  const color = COLORS[label] ?? '';
  const tag = `${color}[${label}]${RESET} `;
  const write = (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line.trim() !== '') process.stdout.write(tag + line + '\n');
    }
  };
  child.stdout?.on('data', write);
  child.stderr?.on('data', write);
}

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill(IS_WIN ? undefined : 'SIGTERM');
  }
  setTimeout(() => process.exit(code), 250);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('Checkstar dev stack — targets:', names.join(', '));
console.log('  api    http://localhost:8000   web  http://localhost:3000');
console.log('  mobile scan the QR code printed below (Expo Go 57.0.0)\n');

for (const name of names) {
  const target = TARGETS[name];

  // Hard requirements stop the run with instructions; soft ones only warn
  // (npm then reports the real error itself).
  const missing = (target.requires ?? []).filter(([rel]) => !existsSync(path.join(ROOT, rel)));
  for (const [rel, hint] of missing) {
    console.error(`\x1b[31m[${target.label}] missing ${rel} — ${hint}\x1b[0m`);
  }
  if (missing.length && target.hardRequires) {
    shutdown(1);
    continue;
  }

  const child = spawn(target.command, target.args, {
    cwd: path.join(ROOT, target.cwd),
    shell: IS_WIN,
    env: { ...process.env, ...(target.env ?? {}) },
  });

  child.on('error', (err) => {
    console.error(`\x1b[31m[${target.label}] could not start "${target.command}": ${err.message}\x1b[0m`);
    if (target.command === 'php') {
      console.error('\x1b[31m[api] PHP is not on PATH. Install PHP 8.2+ (or Laravel Herd) and retry.\x1b[0m');
    }
    shutdown(1);
  });

  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.log(`\x1b[31m[${target.label}] exited with code ${code}\x1b[0m`);
      shutdown(code ?? 1);
    }
  });

  prefix(child, target.label);
  children.push(child);
}
