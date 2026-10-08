import api from './axios'

const getUserConfig = (userId) => {
  if (userId == null || userId === '') throw new Error('Please login again')
  return { params: { userId }, headers: { 'X-User-Id': userId } }
}

export const getDiscussions = ({ courseId, userId } = {}) => {
  const config = getUserConfig(userId)
  return api.get('/discussions', {
    ...config,
    params: { ...config.params, ...(courseId == null ? {} : { courseId }) }
  }).then((response) => response.data)
}

export const getDiscussionById = (id, userId) =>
  api.get(`/discussions/${id}`, getUserConfig(userId)).then((response) => response.data)

export const createDiscussion = (data) => {
  if (data.courseId == null || data.courseId === '') throw new Error('A course is required to start a discussion.')
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