import assert from 'node:assert/strict'
import test from 'node:test'
import { createFeed } from '../mobile/feed.mjs'
import { startHarness, until } from './harness.mjs'

test('MOB-R03 keeps the visible and cached v2 after late v1', async t => {
  const harness = await startHarness(t)
  const store = new Map()
  const events = []
  let view
  const feed = createFeed({
    url: harness.feedUrl,
    storage: {
      getItem: async key => store.get(key) ?? null,
      setItem: async (key, value) => store.set(key, value),
    },
    publish: next => { view = next },
    log: (event, detail) => events.push({ event, ...detail }),
  })

  const cached = () => JSON.parse([...store.values()][0] ?? 'null')
  await harness.plan('hold', 'v1')
  const refreshA = feed.refresh('refresh')
  const a = await harness.event('request.start')
  assert.deepEqual([a.requestedRevision, a.mode], ['v1', 'hold'])
  await harness.plan('normal', 'v2')
  await feed.refresh('refresh')
  const applied = events.find(row => row.event === 'response.applied')
  assert.equal((await harness.event('request.start', applied.requestId)).requestedRevision, 'v2')
  assert.deepEqual(events.filter(row => row.event === 'request.end').map(row => row.responseRevision), ['v2'])
  await until(() => cached()?.revision === 'v2', 'cached v2')
  assert.equal(view.snapshot.revision, 'v2')
  const v2 = view.snapshot
  assert.deepEqual(cached(), v2)

  await harness.release(a.requestId)
  await refreshA
  const arrivals = events.filter(row => row.event === 'request.end')
  const decisions = events.filter(row => ['response.applied', 'response.discarded'].includes(row.event))
  t.diagnostic(`requested: ${a.requestId}=v1, ${applied.requestId}=v2`)
  t.diagnostic(`arrived: ${arrivals.map(row => `${row.requestId}=${row.responseRevision}`).join(' → ')}`)
  t.diagnostic(`decisions: ${decisions.map(row => `${row.responseRevision} ${row.event.split('.')[1]}`).join(' → ')}; final visible=${view.snapshot.revision}; final cache=${cached()?.revision}`)
  assert.deepEqual(arrivals.map(row => [row.requestId, row.responseRevision]), [[applied.requestId, 'v2'], [a.requestId, 'v1']])
  assert.deepEqual({ visible: view.snapshot, cache: cached() }, { visible: v2, cache: v2 })
  assert.deepEqual(decisions.map(row => [row.event, row.responseRevision]), [
    ['response.applied', 'v2'], ['response.discarded', 'v1'],
  ])
})
