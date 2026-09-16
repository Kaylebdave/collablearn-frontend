import { create } from 'zustand'

const useConnectivityStore = create((set) => ({
  isOnline: navigator.onLine,

  setOnline: () => set({ isOnline: true }),
  setOffline: () => set({ isOnline: false }),
}))

export default useConnectivityStore