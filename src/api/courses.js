import api from './axios'

const request = (method, url, data, config = {}) =>
  api({ method, url, data, ...config }).then((response) => response.data)

const userRequestConfig = (userId) => {
  if (userId == null || userId === '') throw new Error('Please login again')
  return {
    params: { userId },
    headers: { 'X-User-Id': userId }
  }
}

export const getCourses = (userId) => request('get', '/courses', undefined, userRequestConfig(userId))

export const browseCourses = (userId) => request('get', '/courses/browse', undefined, userRequestConfig(userId))

export const enrollInCourse = (courseId, userId) =>
  request('post', `/courses/${courseId}/enroll`, { userId }, userRequestConfig(userId))

export const getCourseById = (id, userId) => request('get', `/courses/${id}`, undefined, userRequestConfig(userId))

export const createCourse = (data, userId = data.tutorId) => {
  const config = userRequestConfig(userId)
  return api.post('/courses', data, {
    ...config,
    headers: {
      ...config.headers,
      'Content-Type': 'application/json'
    }
  }).then((response) => response.data)
}

export const uploadCourseMaterial = (courseId, formData, userId) =>
  api.post(`/courses/${courseId}/materials`, formData, userRequestConfig(userId)).then((response) => response.data)