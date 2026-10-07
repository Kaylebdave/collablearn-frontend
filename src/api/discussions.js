import api from './axios'

const request = (method, url, data) =>
  api({ method, url, data }).then((response) => response.data)

export const getDiscussions = ({ courseId, userId } = {}) =>
  api.get('/discussions', {
    params: { ...(courseId == null ? {} : { courseId }), ...(userId == null ? {} : { userId }) },
    headers: userId == null ? undefined : { 'X-User-Id': userId }
  }).then((response) => response.data)

export const getDiscussionById = (id) => request('get', `/discussions/${id}`)

export const createDiscussion = (data) =>
  api.post('/discussions', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.data)

export const createDiscussionReply = (id, data) =>
  api.post(`/discussions/${id}/replies`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.data)