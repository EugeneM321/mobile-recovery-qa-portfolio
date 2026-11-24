const cacheKey = 'harbor-circle:last-good'
const timeoutMs = 45_000

function revisionNumber(revision) {
  return /^v[1-9]\d*$/.test(revision) ? Number(revision.slice(1)) : 0
}

function isFeed(value) {
  return value && typeof value.revision === 'string' && revisionNumber(value.revision) > 0
    && Array.isArray(value.items) && value.items.length === 2 && value.items.every(item => typeof item === 'string')
}

export function createFeed({ url, storage, publish, log }) {
  let snapshot = null
  let problem = null
  let offline = false
  let pending = 0
  let sequence = 0
  let latestApplied = 0
  let writes = Promise.resolve()
  const session = Date.now().toString(36)

  function render() {
    publish({ snapshot, problem, offline, loading: pending > 0 })
  }

  async function restore() {
    try {
      const saved = JSON.parse(await storage.getItem(cacheKey))
      if (isFeed(saved) && typeof saved.updatedAt === 'string' && Number.isFinite(Date.parse(saved.updatedAt))) {
        snapshot = saved
        log('cache.restored', { revision: saved.revision })
      }
    } catch {
      log('cache.read_failed')
    }
    render()
  }

  function setOffline(value) {
    if (value && !offline) problem = 'Connection was interrupted. Retry to refresh the feed.'
    offline = value
    render()
  }

  async function refresh(action) {
    if (action === 'retry') log('retry')
    const number = ++sequence
    const requestId = `mobile-${session}-${number}`
    const requestedRevision = 'latest'
    const context = { action, requestId, requestedRevision }
    if (offline) {
      log('request.skipped_offline', context)
      return
    }

    pending++
    problem = null
    render()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    log('request.start', context)
    let httpStatus

    try {
      const response = await fetch(url, {
        headers: { 'X-Request-ID': requestId },
        signal: controller.signal,
      })
      httpStatus = response.status
      if (!response.ok) throw new Error('http')
      const body = await response.json()
      if (!isFeed(body) || body.requestId !== requestId) throw new Error('payload')

      const responseRevision = body.revision
      const details = { ...context, responseRevision, status: httpStatus }
      log('request.end', details)
      const incoming = revisionNumber(responseRevision)
      const current = revisionNumber(snapshot?.revision ?? '')
      if (incoming < current || (incoming === current && number < latestApplied)) {
        log('response.discarded', { ...details, keptRevision: snapshot.revision })
        return
      }

      latestApplied = Math.max(latestApplied, number)
      const accepted = { revision: responseRevision, items: body.items, updatedAt: new Date().toISOString() }
      snapshot = accepted
      problem = null
      log('response.applied', details)
      writes = writes.then(async () => {
        try {
          await storage.setItem(cacheKey, JSON.stringify(accepted))
          log('cache.updated', { requestId, revision: accepted.revision })
        } catch {
          log('cache.write_failed', { requestId })
        }
      })
    } catch (error) {
      const reason = controller.signal.aborted ? 'timeout' : error.message === 'payload' ? 'payload' : httpStatus >= 400 ? 'http' : 'network'
      log('request.end', { ...context, status: httpStatus ?? null, responseRevision: null, reason })
      if (number === sequence && number >= latestApplied) {
        problem = reason === 'timeout' ? 'The refresh timed out.' : 'The feed could not be refreshed.'
      }
    } finally {
      clearTimeout(timeout)
      pending--
      render()
    }
  }

  return { restore, setOffline, refresh }
}
