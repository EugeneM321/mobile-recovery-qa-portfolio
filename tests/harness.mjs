import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createInterface } from 'node:readline'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

export async function until(read, label) {
  const deadline = Date.now() + 3_000
  do {
    const result = read()
    if (result) return result
    await delay(5)
  } while (Date.now() < deadline)
  assert.fail(`Timed out waiting for ${label}`)
}

export async function startHarness(t) {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../api/server.mjs', import.meta.url))], {
    env: { ...process.env, DEMO_FEED_HOST: '127.0.0.1', DEMO_FEED_PORT: '0', DEMO_CONTROL_PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const closed = once(child, 'close')
  closed.catch(() => {})
  t.after(async () => {
    child.kill()
    await closed
  })
  const messages = []
  const events = []
  createInterface({ input: child.stdout }).on('line', line => {
    messages.push(line)
    if (line.startsWith('{')) events.push(JSON.parse(line))
  })
  child.stderr.on('data', chunk => messages.push(String(chunk)))
  const listen = prefix => until(() => messages.find(line => line.startsWith(prefix)), prefix)
  const [feedLine, controlLine] = await Promise.all([listen('Synthetic feed listening on '), listen('Test-only controls listening on ')])
  const feedUrl = `http://${feedLine.split(' ').at(-1)}/feed`
  const controlUrl = `http://${controlLine.split(' ').at(-1)}/control`

  async function post(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3_000),
    })
    assert.equal(response.status, 200)
    return response.json()
  }

  return {
    feedUrl,
    plan: (mode, revision, options) => post(controlUrl, { mode, revision, ...options }),
    release: requestId => post(`${controlUrl}/release`, { requestId }),
    event: (event, requestId) => until(
      () => events.find(row => row.event === event && (!requestId || row.requestId === requestId)),
      `${event} ${requestId ?? ''}`,
    ),
  }
}
