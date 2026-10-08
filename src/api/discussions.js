import api from './axios'

export const getDiscussions = ({ courseId, userId } = {}) =>
  api.get('/discussions', {
    params: { ...(courseId == null ? {} : { courseId }), ...(userId == null ? {} : { userId }) },
    headers: userId == null ? undefined : { 'X-User-Id': userId }
  }).then((response) => response.data)

const getUserConfig = (userId) => userId == null || userId === ''
  ? {}
  : { params: { userId }, headers: { 'X-User-Id': userId } }

export const getDiscussionById = (id, userId) =>
  api.get(`/discussions/${id}`, getUserConfig(userId)).then((response) => response.data)

export const createDiscussion = (data) => {
  const config = getUserConfig(data.userId)
  return api.post('/discussions', data, {
    ...config,
    headers: { ...config.headers, 'Content-Type': 'application/json' }
  }).then((response) => response.data)
}

export const createDiscussionReply = (id, data) => {
  const config = getUserConfig(data.userId)
  return api.post(`/discussions/${id}/replies`, data, {
    ...config,
    headers: { ...config.headers, 'Content-Type': 'application/json' }
  }).then((response) => response.data)
}