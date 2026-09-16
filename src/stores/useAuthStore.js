import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  justSignedUp: false,

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