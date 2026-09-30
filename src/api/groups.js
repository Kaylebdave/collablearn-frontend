import api from './axios'

const request = (method, url, data) =>
  api({ method, url, data }).then((response) => response.data)

export const getGroups = () => request('get', '/groups')

export const getGroupById = (id) => request('get', `/groups/${id}`)

export const createGroup = (data) =>
  api.post('/groups', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.data)