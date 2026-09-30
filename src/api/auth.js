import api from './axios'

const request = (method, url, data) =>
  api({ method, url, data }).then((response) => response.data)

export const signup = (payload) => request('post', '/auth/signup', payload)

export const verifyOtp = (payload) => request('post', '/auth/verify-otp', payload)

export const resendOtp = (payload) => request('post', '/auth/resend-otp', payload)

export const login = (payload) => request('post', '/auth/login', payload)

export const updateProfile = (userId, payload) =>
  api.put('/auth/profile', { id: userId, ...payload }, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.data)

export const changePassword = (userId, payload) =>
  api.put('/auth/change-password', { id: userId, ...payload }, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.data)
