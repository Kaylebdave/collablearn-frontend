import { create } from 'zustand'
import useCourseStore from './useCourseStore'
import useDiscussionStore from './useDiscussionStore'
import useGroupStore from './useGroupStore'
import useSyncStore from './useSyncStore'
import { setSyncQueueUser } from '../utils/syncQueueStorage'

const getUserKey = (user) => user?.id ?? user?.userId ?? user?.email

const clearUserData = () => {
  useCourseStore.getState().resetCourses()
  useDiscussionStore.getState().clearUserData()
  useGroupStore.getState().resetGroups()
  useSyncStore.getState().clearQueue()
}

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  justSignedUp: false,

  setAuthenticatedUser: (userData, justSignedUp = false, authToken) => {
    const user = {
      id: userData.id || userData.userId || Date.now(),
      name: userData.name || userData.fullName || 'Student',
      email: userData.email,
      role: userData.role || 'student',
      username: userData.username || '',
      bio: userData.bio || '',
      department: userData.department || '',
      level: userData.level || '',
      institution: userData.institution || ''
    }
    const previousUser = get().user
    const isDifferentUser = previousUser && String(getUserKey(previousUser)) !== String(getUserKey(user))
    if (isDifferentUser) clearUserData()

    const token = authToken ?? userData.token ?? userData.accessToken ?? (isDifferentUser ? null : get().token)
    setSyncQueueUser(getUserKey(user))
    set({ user, token, isAuthenticated: true, justSignedUp })
    localStorage.setItem('collablearn_user', JSON.stringify(user))
    if (token) localStorage.setItem('collablearn_token', token)
    else localStorage.removeItem('collablearn_token')
  },

  updateUser: (userData) => set((state) => {
    const user = { ...state.user, ...userData }
    localStorage.setItem('collablearn_user', JSON.stringify(user))
    return { user }
  }),

  signup: (userData) => {
    get().setAuthenticatedUser({
      id: userData.id || Date.now(),
      name: userData.name,
      email: userData.email,
      role: userData.role || 'student'   // student or tutor
    }, true, userData.token ?? userData.accessToken)
  },

  login: (email) => {
    const savedUser = localStorage.getItem('collablearn_user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      if (user.email === email) {
        get().setAuthenticatedUser(user, false, localStorage.getItem('collablearn_token'))
        return true
      }
    }
    return false
  },

  logout: () => {
    clearUserData()
    set({ user: null, token: null, isAuthenticated: false, justSignedUp: false })
    localStorage.removeItem('collablearn_user')
    localStorage.removeItem('collablearn_token')
  },

  clearJustSignedUp: () => set({ justSignedUp: false }),

  checkAuth: () => {
    const savedUser = localStorage.getItem('collablearn_user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      const token = localStorage.getItem('collablearn_token')
      setSyncQueueUser(getUserKey(user))
      set({
        user,
        token,
        isAuthenticated: true,
        justSignedUp: false
      })
    } else {
      localStorage.removeItem('collablearn_token')
    }
  }
}))

export default useAuthStore
