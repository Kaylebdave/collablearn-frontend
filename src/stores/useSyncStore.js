import { create } from 'zustand'
import { getRecordId, isNetworkFailure, sendSyncItem } from '../services/syncEngine'
import useCourseStore from './useCourseStore'
import useDiscussionStore from './useDiscussionStore'
import useGroupStore from './useGroupStore'
import { enqueueSyncItem, readSyncQueue, removeSyncItem, updateSyncItem, writeSyncQueue } from '../utils/syncQueueStorage'

const replaceDiscussionIdInReplyQueue = (localDiscussionId, serverDiscussionId) => {
  const queue = readSyncQueue().map((item) =>
    item.type === 'CREATE_REPLY' && String(item.payload.discussionId) === String(localDiscussionId)
      ? { ...item, payload: { ...item.payload, discussionId: serverDiscussionId } }
      : item
  )
  writeSyncQueue(queue)
}

const getRequestUrl = (error) => {
  const { baseURL, url } = error?.config || {}
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return `${(baseURL || '').replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

const getRequestPayload = (item, error) => {
  if (item.type === 'CREATE_REPLY') {
    return { content: item.payload.content, author: item.payload.author }
  }
  const data = error?.config?.data
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

const restoreQueuedItem = (item) => {
  const { localId, ...payload } = item.payload
  if (item.type === 'CREATE_COURSE') {
    const store = useCourseStore.getState()
    if (!store.courses.some((course) => String(course.id) === String(localId))) {
      store.addCourse({ ...payload, id: localId }, false)
    }
  } else if (item.type === 'CREATE_DISCUSSION') {
    const store = useDiscussionStore.getState()
    if (!store.posts.some((post) => String(post.id) === String(localId))) {
      store.addPost({ ...payload, id: localId }, false)
    }
  } else if (item.type === 'CREATE_GROUP') {
    const store = useGroupStore.getState()
    if (!store.groups.some((group) => String(group.id) === String(localId))) {
      store.addGroup({ ...payload, id: localId }, false)
    }
  } else if (item.type === 'CREATE_REPLY') {
    const store = useDiscussionStore.getState()
    if (!store.localReplies.some((reply) => String(reply.localId) === String(localId))) {
      store.addLocalReply({ ...payload, localId, status: 'pending' })
    }
  }
}

const updateEntityStatus = (item, status) => {
  const { localId, discussionId } = item.payload
  if (item.type === 'CREATE_COURSE') {
    useCourseStore.getState().setCourseSyncStatus(localId, status)
  } else if (item.type === 'CREATE_DISCUSSION') {
    useDiscussionStore.getState().setPostSyncStatus(localId, status)
  } else if (item.type === 'CREATE_GROUP') {
    useGroupStore.getState().setGroupSyncStatus(localId, status)
  } else if (item.type === 'CREATE_REPLY') {
    useDiscussionStore.getState().setReplySyncStatus(discussionId, localId, status)
  }
}

const applySyncResult = (item, record, replies) => {
  const { localId, ...payload } = item.payload
  if (item.type === 'CREATE_COURSE') {
    useCourseStore.getState().updateSyncedCourse(localId, {
      ...payload,
      ...record,
      id: getRecordId(record, localId)
    })
  } else if (item.type === 'CREATE_DISCUSSION') {
    const serverId = getRecordId(record, localId)
    useDiscussionStore.getState().updateSyncedPost(localId, { ...payload, ...record, id: serverId })
    if (String(serverId) !== String(localId)) replaceDiscussionIdInReplyQueue(localId, serverId)
  } else if (item.type === 'CREATE_GROUP') {
    useGroupStore.getState().updateSyncedGroup(localId, {
      ...payload,
      ...record,
      id: getRecordId(record, localId)
    })
  } else if (item.type === 'CREATE_REPLY') {
    if (Array.isArray(replies)) {
      useDiscussionStore.getState().updatePost({ id: payload.discussionId, replies })
    }
    useDiscussionStore.getState().updateSyncedReply(payload.discussionId, localId, {
      ...payload,
      ...record,
      localId,
      id: getRecordId(record, localId),
      status: 'synced'
    })
  }
}

const useSyncStore = create((set, get) => ({
  isSyncing: false,
  lastSynced: null,
  queue: readSyncQueue(),

  refreshQueue: () => set({ queue: readSyncQueue() }),
  restoreQueuedItems: () => readSyncQueue()
    .filter((item) => ['pending', 'failed', 'syncing'].includes(item.status))
    .forEach(restoreQueuedItem),

  enqueue: (type, payload, localId) => {
    const item = enqueueSyncItem(type, payload, localId)
    set({ queue: readSyncQueue() })
    return item
  },

  getPendingItems: () => get().queue
    .filter((item) => item.status !== 'synced')
    .map((item) => ({
      ...item,
      label: {
        CREATE_COURSE: 'Course',
        CREATE_DISCUSSION: 'Discussion',
        CREATE_REPLY: 'Reply',
        CREATE_GROUP: 'Study Group'
      }[item.type],
      title: item.payload.title || item.payload.name || item.payload.content || 'Pending item'
    })),

  syncNow: async () => {
    if (get().isSyncing || (typeof navigator !== 'undefined' && !navigator.onLine)) return
    set({ isSyncing: true })
    try {
      const queuedItems = readSyncQueue()
        .filter((item) => ['pending', 'failed', 'syncing'].includes(item.status))
        .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))

      for (const queuedItem of queuedItems) {
        const item = readSyncQueue().find((candidate) => candidate.id === queuedItem.id)
        if (!item || !['pending', 'failed', 'syncing'].includes(item.status)) continue

        updateSyncItem(item.id, { status: 'syncing', error: undefined })
        set({ queue: readSyncQueue() })
        updateEntityStatus(item, 'syncing')

        let result
        try {
          result = await sendSyncItem(item)
        } catch (error) {
          console.error('Sync failed', {
            type: item.type,
            localId: item.payload.localId,
            status: error?.response?.status,
            responseData: error?.response?.data,
            url: getRequestUrl(error),
            requestPayload: getRequestPayload(item, error),
            message: error?.response?.data?.message || error?.response?.data?.error || error?.message
          })
          const failed = Boolean(error?.response) || isNetworkFailure(error)
          updateSyncItem(item.id, {
            status: failed ? 'failed' : 'pending',
            error: failed ? error?.response?.data?.message || error?.message || 'Unable to sync this item.' : undefined
          })
          updateEntityStatus(item, failed ? 'failed' : 'pending')
          set({ queue: readSyncQueue() })
          continue
        }

        try {
          applySyncResult(item, result.record || {}, result.replies)
        } catch (error) {
          console.error('Sync succeeded but local update failed', {
            type: item.type,
            localId: item.payload.localId,
            status: error?.response?.status,
            responseData: error?.response?.data,
            url: getRequestUrl(error),
            requestPayload: getRequestPayload(item, error),
            message: error?.message
          })
        }
        removeSyncItem(item.id)
        updateEntityStatus(item, 'synced')
        set({ queue: readSyncQueue() })
      }
      set({ lastSynced: new Date().toLocaleTimeString() })
    } finally {
      set({ isSyncing: false, queue: readSyncQueue() })
    }
  },

  syncAll: () => get().syncNow()
}))

if (typeof window !== 'undefined') {
  window.addEventListener('sync-queue-updated', () => {
    useSyncStore.getState().refreshQueue()
  })
  window.addEventListener('storage', (event) => {
    if (event.key === 'collablearn-sync-queue') useSyncStore.getState().refreshQueue()
  })
}

export default useSyncStore