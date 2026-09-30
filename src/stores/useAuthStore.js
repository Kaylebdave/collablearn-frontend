import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  justSignedUp: false,

  setAuthenticatedUser: (userData, justSignedUp = false) => {
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
    set({ user, isAuthenticated: true, justSignedUp })
    localStorage.setItem('collablearn_user', JSON.stringify(user))
  },

  updateUser: (userData) => set((state) => {
    const user = { ...state.user, ...userData }
    localStorage.setItem('collablearn_user', JSON.stringify(user))
    return { user }
  }),

  signup: (userData) => {
    const newUser = {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      role: userData.role || 'student'   // student or tutor
    }
    set({
      user: newUser,
      isAuthenticated: true,
      justSignedUp: true
    })
    localStorage.setItem('collablearn_user', JSON.stringify(newUser))
  },

  login: (email) => {
    const savedUser = localStorage.getItem('collablearn_user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      if (user.email === email) {
        set({ user, isAuthenticated: true, justSignedUp: false })
        return true
      }
    }
    return false
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, justSignedUp: false })
    localStorage.removeItem('collablearn_user')
  },

  clearJustSignedUp: () => set({ justSignedUp: false }),

  checkAuth: () => {
    const savedUser = localStorage.getItem('collablearn_user')
    if (savedUser) {
      set({
        user: JSON.parse(savedUser),
        isAuthenticated: true,
        justSignedUp: false
      })
    }
  }
}))

export default useAuthStore
