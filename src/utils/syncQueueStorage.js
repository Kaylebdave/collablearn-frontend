const STORAGE_KEY = 'collablearn-sync-queue'
const OWNER_KEY = 'collablearn-sync-queue-user'

const notifyQueueChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sync-queue-updated'))
  }
}

export const readSyncQueue = () => {
  if (typeof localStorage === 'undefined') return []

  try {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(queue)) return []
    return queue.map((item) => {
      const payload = item.type === 'CREATE_REPLY' && item.payload?.data
        ? { ...item.payload.data, discussionId: item.payload.discussionId }
        : item.payload
      const { entityId, ...queueItem } = item
      return {
        ...queueItem,
        id: item.id ?? (globalThis.crypto?.randomUUID?.() || `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`),
        payload: entityId == null || payload?.localId != null ? payload : { ...payload, localId: entityId },
        status: item.status
      }
    })
  } catch {
    return []
  }
}

export const writeSyncQueue = (queue) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  }
  notifyQueueChanged()
}

export const clearSyncQueue = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(OWNER_KEY)
  }
  notifyQueueChanged()
}

export const setSyncQueueUser = (userId) => {
  if (typeof localStorage === 'undefined' || userId == null) return

  const nextOwner = String(userId)
  const currentOwner = localStorage.getItem(OWNER_KEY)
  if (currentOwner !== nextOwner) {
    if (currentOwner || readSyncQueue().length > 0) {
      localStorage.removeItem(STORAGE_KEY)
      notifyQueueChanged()
    }
    localStorage.setItem(OWNER_KEY, nextOwner)
  }
}

export const enqueueSyncItem = (type, payload, entityId) => {
  const queue = readSyncQueue()
  const existing = queue.find((item) => item.type === type && String(item.payload.localId) === String(entityId))
  if (existing) return existing

  const item = {
    id: globalThis.crypto?.randomUUID?.() || `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    payload: { ...payload, localId: entityId },
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  writeSyncQueue([...queue, item])
  return item
}

export const updateSyncItem = (id, updates) => {
  const queue = readSyncQueue().map((item) =>
    item.id === id ? { ...item, ...updates } : item
  )
  writeSyncQueue(queue)
}


export const removeSyncItem = (id) => {
  writeSyncQueue(readSyncQueue().filter((item) => item.id !== id))
}