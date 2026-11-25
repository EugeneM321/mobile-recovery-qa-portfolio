import assert from 'node:assert/strict'
import test from 'node:test'
import { startHarness } from './harness.mjs'

async function readFeed(harness, requestId, signal = AbortSignal.timeout(3_000)) {
  const response = await fetch(harness.feedUrl, {
    headers: { 'X-Request-ID': requestId },
    signal,
  })
  assert.match(response.headers.get('content-type'), /^application\/json\b/)
  return { status: response.status, body: await response.json() }
}

function assertFeed({ status, body }, requestId, revision) {
  assert.equal(status, 200)
  assert.deepEqual(Object.keys(body).sort(), ['items', 'requestId', 'revision', 'serverTimestamp'])
  assert.equal(body.requestId, requestId)
  assert.equal(body.revision, revision)
  assert.deepEqual(body.items, [`Workshop starts at ${revision === 'v1' ? 10 : 11}`, 'Tool swap on Friday'])
  assert.equal(new Date(body.serverTimestamp).toISOString(), body.serverTimestamp)
}

test('A01 baseline feed', async t => {
  const harness = await startHarness(t)
  const id = 'mobile-a01-1'
  assertFeed(await readFeed(harness, id), id, 'v1')
})

test('A02 HTTP 503 then recovery', async t => {
  const harness = await startHarness(t)
  assert.deepEqual(await harness.plan('503', 'v1'), { mode: '503', revision: 'v1' })
  assert.deepEqual(await readFeed(harness, 'mobile-a02-1'), {
    status: 503, body: { requestId: 'mobile-a02-1', error: 'Simulated unavailable' },
  })
  assert.equal((await harness.event('request.end', 'mobile-a02-1')).status, 503)
  await harness.plan('normal', 'v1')
  assertFeed(await readFeed(harness, 'mobile-a02-2'), 'mobile-a02-2', 'v1')
  assert.equal((await harness.event('request.end', 'mobile-a02-2')).status, 200)
})

test('A03 interrupted delayed request then fresh read', async t => {
  const harness = await startHarness(t)
  const id = 'mobile-a03-1'
  const plan = { mode: 'delay', revision: 'v1', delayMs: 55_000 }
  assert.deepEqual(await harness.plan('delay', 'v1', { delayMs: plan.delayMs }), plan)
  const controller = new AbortController()
  const interrupted = assert.rejects(readFeed(harness, id, controller.signal), { name: 'AbortError' })
  assert.equal((await harness.event('request.start', id)).mode, 'delay')
  controller.abort()
  await interrupted
  assert.equal((await harness.event('request.closed', id)).requestedRevision, 'v1')
  await harness.plan('normal', 'v1')
  assertFeed(await readFeed(harness, 'mobile-a03-2'), 'mobile-a03-2', 'v1')
})

test('A04 v2 arrives before held v1', async t => {
  const harness = await startHarness(t)
  const a = 'mobile-a04-1'
  const b = 'mobile-a04-2'
  const arrivals = []
  await harness.plan('hold', 'v1')
  const older = readFeed(harness, a).then(result => {
    arrivals.push(result.body.requestId)
    return result
  })
  older.catch(() => {})
  assert.equal((await harness.event('request.start', a)).requestedRevision, 'v1')
  await harness.plan('normal', 'v2')
  const newer = await readFeed(harness, b)
  arrivals.push(newer.body.requestId)
  assertFeed(newer, b, 'v2')
  assert.deepEqual(arrivals, [b])
  assert.deepEqual(await harness.release(a), { released: a })
  assertFeed(await older, a, 'v1')
  assert.deepEqual(arrivals, [b, a])
  t.diagnostic(`requested: ${a}=v1, ${b}=v2; arrived: ${b}=v2 → ${a}=v1`)
})
