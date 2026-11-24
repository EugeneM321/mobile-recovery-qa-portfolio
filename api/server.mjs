import { createServer } from 'node:http'

const feedItems = {
  v1: ['Workshop starts at 10', 'Tool swap on Friday'],
  v2: ['Workshop starts at 11', 'Tool swap on Friday'],
}

let plan = { mode: 'normal', revision: 'v1' }
let counter = 0
const pending = new Map()

function log(event, details) {
  console.log(JSON.stringify({ at: new Date().toISOString(), source: 'feed-api', event, ...details }))
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function readConfig(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 1024) throw new Error('Control payload too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks))
}

const feed = createServer((req, res) => {
  if (req.method !== 'GET' || req.url !== '/feed') return json(res, 404, { error: 'Not found' })

  const receivedId = req.headers['x-request-id']
  const requestId = /^mobile-[a-z0-9]{1,24}-\d{1,5}$/.test(receivedId ?? '')
    ? receivedId
    : `local-${++counter}`
  const { mode, revision, delayMs } = plan
  const requestedRevision = revision
  log('request.start', { requestId, requestedRevision, mode })
  let timer
  let finished = false
  let entry

  function finish() {
    finished = true
    clearTimeout(timer)
    if (pending.get(requestId) === entry) pending.delete(requestId)
  }

  res.on('close', () => {
    finish()
    if (!res.writableEnded) log('request.closed', { requestId, requestedRevision })
  })

  function deliver() {
    if (finished) return
    finish()
    const serverTimestamp = new Date().toISOString()
    const status = mode === '503' ? 503 : 200
    const responseRevision = status === 200 ? revision : null
    log('request.end', { requestId, requestedRevision, responseRevision, status })
    if (status === 503) return json(res, status, { requestId, error: 'Simulated unavailable' })
    json(res, status, { requestId, revision, items: feedItems[revision], serverTimestamp })
  }

  if (mode === 'hold') {
    if (pending.has(requestId)) return json(res, 409, { error: 'Request ID already held' })
    if (pending.size >= 20) return json(res, 503, { requestId, error: 'Hold queue is full' })
    entry = { requestId, revision, deliver }
    pending.set(requestId, entry)
    timer = setTimeout(() => res.destroy(), 60_000)
  } else if (mode === 'delay') {
    timer = setTimeout(deliver, delayMs)
  } else {
    deliver()
  }
})

const controls = createServer(async (req, res) => {
  const path = req.url
  if (req.method === 'GET' && path === '/control') {
    return json(res, 200, { plan, held: [...pending.values()].map(({ requestId, revision }) => ({ requestId, revision })) })
  }
  if (req.method !== 'POST' || !['/control', '/control/release'].includes(path)) {
    return json(res, 404, { error: 'Not found' })
  }
  if (req.headers['content-type'] !== 'application/json') {
    return json(res, 415, { error: 'Use application/json' })
  }

  try {
    const body = await readConfig(req)
    if (path === '/control/release') {
      const request = pending.get(body.requestId)
      if (!request) return json(res, 404, { error: 'No matching held request' })
      request.deliver()
      return json(res, 200, { released: request.requestId })
    }
    const { mode, revision, delayMs } = body
    if (!['normal', '503', 'delay', 'hold'].includes(mode) || !Object.hasOwn(feedItems, revision)) {
      return json(res, 400, { error: 'Specify a supported mode and revision (v1 or v2)' })
    }
    if (mode === 'delay' && (!Number.isInteger(delayMs) || delayMs < 1 || delayMs > 55_000)) {
      return json(res, 400, { error: 'delayMs must be an integer from 1 to 55000' })
    }
    plan = mode === 'delay' ? { mode, revision, delayMs } : { mode, revision }
    json(res, 200, plan)
  } catch {
    json(res, 400, { error: 'Invalid control payload' })
  }
})

const feedHost = process.env.DEMO_FEED_HOST || '127.0.0.1'
feed.listen(3000, feedHost, () => console.log(`Synthetic feed listening on ${feedHost}:3000`))
controls.listen(3001, '127.0.0.1', () => console.log('Test-only controls listening on 127.0.0.1:3001'))
