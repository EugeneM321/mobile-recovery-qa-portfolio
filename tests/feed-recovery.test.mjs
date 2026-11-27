import assert from 'node:assert/strict'
import test from 'node:test'
import { until } from './harness.mjs'
import { createFeed } from '../mobile/feed.mjs'

const key = 'harbor-circle:last-good'
const cached = { revision: 'v1', items: ['Workshop starts at 10', 'Tool swap on Friday'], updatedAt: '2026-11-24T12:00:00.000Z' }
const fresh = { revision: 'v2', items: ['Workshop starts at 11', 'Tool swap on Friday'] }

function fixture(t, { saved = JSON.stringify(cached), storage = {}, respond } = {}) {
  const events = []
  const views = []
  const writes = []
  const requests = []
  const feed = createFeed({
    url: 'http://127.0.0.1/feed',
    storage: {
      getItem: async name => { assert.equal(name, key); return saved },
      setItem: async (name, value) => { writes.push([name, JSON.parse(value)]) },
      ...storage,
    },
    publish: view => views.push(view),
    log: (event, details) => events.push({ event, ...details }),
  })
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const requestId = options.headers['X-Request-ID']
    requests.push(requestId)
    return respond
      ? respond({ requestId, signal: options.signal, count: requests.length })
      : Response.json({ ...fresh, requestId })
  })
  return { feed, events, views, writes, requests, view: () => views.at(-1) }
}

test('MOB-R04 restores a fresh controller from the saved snapshot offline', async t => {
  const { feed, view, writes, requests } = fixture(t)
  await feed.restore()
  feed.setOffline(true)
  await feed.refresh('launch')
  assert.deepEqual(view().snapshot, cached)
  assert.equal(view().offline, true)
  assert.equal(view().loading, false)
  assert.deepEqual(requests, [])
  assert.deepEqual(writes, [])
})

test('MOB-R05 times out at the deadline, exits loading and recovers on Retry', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { feed, view, writes, events } = fixture(t, {
    respond: ({ requestId, signal, count }) => count === 1
      ? new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))
      : Response.json({ ...fresh, requestId }),
  })
  await feed.restore()
  const pending = feed.refresh('refresh')
  t.mock.timers.tick(44_999)
  assert.equal(view().loading, true)
  assert.deepEqual(view().snapshot, cached)
  t.mock.timers.tick(1)
  await pending
  assert.deepEqual(view(), { snapshot: cached, problem: 'The refresh timed out.', offline: false, loading: false })
  assert.deepEqual(writes, [])
  await feed.refresh('retry')
  assert.equal(view().loading, false)
  assert.equal(view().problem, null)
  assert.deepEqual(view().snapshot.items, fresh.items)
  assert.equal(view().snapshot.revision, 'v2')
  assert.deepEqual(writes, [[key, view().snapshot]])
  assert.ok(events.some(event => event.reason === 'timeout'))
})

for (const [name, respond] of [
  ['malformed JSON', () => new Response('{', { headers: { 'Content-Type': 'application/json' } })],
  ['invalid feed shape', ({ requestId }) => Response.json({ ...fresh, items: [42, 'valid'], requestId })],
  ['mismatched request ID', () => Response.json({ ...fresh, requestId: 'different-request' })],
]) {
  test(`MOB-R05 keeps the last good snapshot on ${name}`, async t => {
    const { feed, view, writes } = fixture(t, { respond })
    await feed.restore()
    await feed.refresh('refresh')
    assert.deepEqual(view(), { snapshot: cached, problem: 'The feed could not be refreshed.', offline: false, loading: false })
    assert.deepEqual(writes, [])
  })
}

for (const [name, saved] of [
  ['corrupt JSON', '{'],
  ['unusable timestamp', JSON.stringify({ ...cached, updatedAt: 'invalid' })],
]) {
  test(`MOB-R04 ignores cached ${name} and recovers on a healthy response`, async t => {
    const { feed, view, writes } = fixture(t, { saved })
    await feed.restore()
    assert.equal(view().snapshot, null)
    await feed.refresh('retry')
    assert.equal(view().snapshot.revision, 'v2')
    assert.deepEqual(writes, [[key, view().snapshot]])
  })
}

test('MOB-R04 tolerates storage read and write errors without losing the live feed', async t => {
  const { feed, view, events } = fixture(t, {
    storage: {
      getItem: async () => { throw new Error('read failure') },
      setItem: async () => { throw new Error('write failure') },
    },
  })
  await feed.restore()
  assert.equal(view().snapshot, null)
  await feed.refresh('refresh')
  assert.equal(view().snapshot.revision, 'v2')
  assert.equal(view().loading, false)
  assert.equal(view().problem, null)
  await until(() => events.some(event => event.event === 'cache.write_failed'), 'cache write failure')
  assert.deepEqual(events.filter(event => event.event.startsWith('cache.')).map(event => event.event),
    ['cache.read_failed', 'cache.write_failed'])
})
