import api from './axios'

const request = (method, url, data) =>
  api({ method, url, data }).then((response) => response.data)

export const getDiscussions = () => request('get', '/discussions')

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