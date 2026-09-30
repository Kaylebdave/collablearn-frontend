import api from './axios'

const request = (method, url, data) =>
  api({ method, url, data }).then((response) => response.data)

export const getCourses = () => request('get', '/courses')

export const getCourseById = (id) => request('get', `/courses/${id}`)

export const createCourse = (data) =>
  api.post('/courses', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.data)

export const uploadCourseMaterial = (courseId, formData) =>
  api.post(`/courses/${courseId}/materials`, formData).then((response) => response.data)