import { createCourse } from '../api/courses'
import { createDiscussion, createDiscussionReply } from '../api/discussions'
import { createGroup } from '../api/groups'

const unwrapResponse = (response, entity) =>
  response?.[entity] || response?.data?.[entity] || response?.data || response

export const getRecordId = (record, fallbackId) => record?.id ?? record?._id ?? fallbackId

export const sendSyncItem = async (item) => {
  const { localId, ...payload } = item.payload

  switch (item.type) {
    case 'CREATE_REPLY': {
      const response = await createDiscussionReply(payload.discussionId, {
        content: payload.content,
        author: payload.author,
        userId: payload.userId
      })
      const data = response?.data ?? response
      const replies = Array.isArray(data?.replies)
        ? data.replies
        : Array.isArray(data?.data?.replies) ? data.data.replies : null
      const record = data?.reply || data?.data?.reply || replies?.find((reply) =>
        reply.content === payload.content && reply.author === payload.author
      ) || (data?.id || data?._id ? data : {})
      return {
        record: {
          ...record,
          content: record.content ?? payload.content,
          author: record.author ?? payload.author,
          discussionId: payload.discussionId
        },
        replies,
        localId
      }
    }
    case 'CREATE_COURSE': {
      const response = await createCourse(payload)
      return { record: unwrapResponse(response, 'course'), localId }
    }
    case 'CREATE_DISCUSSION': {
      const response = await createDiscussion({
        courseId: payload.courseId,
        title: payload.title,
        content: payload.content,
        userId: payload.userId
      })
      return { record: unwrapResponse(response, 'discussion'), localId }
    }
    case 'CREATE_GROUP': {
      const response = await createGroup(payload)
      return { record: unwrapResponse(response, 'group'), localId }
    }
    default:
      throw new Error(`Unsupported sync item type: ${item.type}`)
  }
}

export const isNetworkFailure = (error) => {
  if (error?.response) return false
  return ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error?.code) ||
    error?.message === 'Network Error' ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
}
