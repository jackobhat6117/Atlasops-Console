// Fails when the production build grows past its size budget.
// Run after `npm run build`. Sizes are gzip, which is what users download.
//
//   initial JS      scripts and modulepreloads referenced by dist/index.html: the cost of the first paint
//   initial CSS     stylesheets referenced by dist/index.html
//   largest route   the biggest lazily loaded chunk (page code or shared dependencies) (the mock API chunk is excluded, see below)
//   mock API        MSW + handlers + seed data. It exists only because this demo has no backend,
//                   so it is budgeted on its own and would disappear with a real API.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const KB = 1024
const BUDGETS = {
  'initial JS': 200 * KB,
  'initial CSS': 12 * KB,
  'largest lazy chunk': 16 * KB,
  'mock API chunk': 180 * KB,
}

const dist = new URL('../dist/', import.meta.url).pathname
const html = readFileSync(join(dist, 'index.html'), 'utf8')

const gzipSize = (file) => gzipSync(readFileSync(join(dist, file))).length
const referenced = (pattern) => [...html.matchAll(pattern)].map((match) => match[1].replace(/^\//, ''))

const initialJs = new Set([
  ...referenced(/<script[^>]+src="([^"]+\.js)"/g),
  ...referenced(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+\.js)"/g),
])
const initialCss = new Set(referenced(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g))

const lazyJs = readdirSync(join(dist, 'assets'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => `assets/${file}`)
  .filter((file) => !initialJs.has(file))
const isMockChunk = (file) => readFileSync(join(dist, file), 'utf8').includes('mockServiceWorker.js')
const mockChunks = lazyJs.filter(isMockChunk)
const routeChunks = lazyJs.filter((file) => !isMockChunk(file))

const sum = (files) => [...files].reduce((total, file) => total + gzipSize(file), 0)
const largest = (files) => Math.max(0, ...files.map(gzipSize))

const measured = {
  'initial JS': sum(initialJs),
  'initial CSS': sum(initialCss),
  'largest lazy chunk': largest(routeChunks),
  'mock API chunk': sum(mockChunks),
}

let failed = false
console.log('Bundle size (gzip)')
for (const [name, budget] of Object.entries(BUDGETS)) {
  const size = measured[name]
  const ok = size <= budget
  failed ||= !ok
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(20)} ${(size / KB).toFixed(1).padStart(6)} kB / ${(budget / KB).toFixed(0)} kB`,
  )
}

if (failed) {
  console.error('\nA bundle exceeds its budget. Find the cause (e.g. `npx vite-bundle-visualizer`) or raise the budget deliberately.')
  process.exit(1)
}
