#!/usr/bin/env node
/**
 * Parallel development agents for Checkstar.
 *
 * Runs three dedicated agents CONCURRENTLY (not sequentially) and reports a
 * combined summary:
 *
 *   [ui]      UI/UX agent   — TypeScript strict compile + Next.js lint
 *   [backend] Backend agent — API contract probes (via the site proxy) +
 *                             static scan of backend/ (PHP runtime tests run in CI)
 *   [test]    Testing agent — full unit suite (vitest) + E2E suite (Playwright)
 *
 * Usage:  npm run agents
 * Exit:   non-zero if any agent fails.
 */
import { spawn } from 'node:child_process'

const frontendDir = new URL('..', import.meta.url).pathname

const AGENTS = [
  { id: 'ui', title: 'UI/UX agent — types + lint', command: 'npx tsc --noEmit && npx next lint' },
  { id: 'backend', title: 'Backend agent — API contract + static scan', command: 'node scripts/backend-agent.mjs' },
  { id: 'test', title: 'Testing agent — unit + e2e', command: 'npx vitest run --reporter=dot && npx playwright test --reporter=list' },
]

function run(agent) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const child = spawn('bash', ['-lc', agent.command], {
      cwd: frontendDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const pipe = (chunk) => {
      // Tag every line with the agent id so interleaved output stays readable.
      for (const line of String(chunk).split('\n')) {
        if (line.length) process.stdout.write(`[${agent.id}] ${line}\n`)
      }
    }
    child.stdout.on('data', pipe)
    child.stderr.on('data', pipe)
    child.on('close', (code) => resolve({ ...agent, code, ms: Date.now() - startedAt }))
  })
}

const started = Date.now()
console.log(`Launching ${AGENTS.length} agents in parallel…\n`)

const results = await Promise.all(AGENTS.map(run))
const wall = ((Date.now() - started) / 1000).toFixed(1)

console.log('\n────────────── agent summary ──────────────')
for (const r of results) {
  const status = r.code === 0 ? 'PASS' : `FAIL (exit ${r.code})`
  console.log(`${status.padEnd(12)} ${String((r.ms / 1000).toFixed(1) + 's').padStart(7)}  ${r.id.padEnd(8)} ${r.title}`)
}
console.log('───────────────────────────────────────────')
console.log(`total wall time: ${wall}s (agents ran concurrently)`)

process.exitCode = results.some((r) => r.code !== 0) ? 1 : 0
