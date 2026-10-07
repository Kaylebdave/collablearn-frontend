import { create } from 'zustand'

const useCourseStore = create((set) => ({
  courses: [],

  resetCourses: () => set({ courses: [] }),

  setCourses: (courses) => set((state) => {
    const normalizedCourses = courses.map((course) => ({ ...course, id: course.id ?? course._id }))
    const remoteIds = new Set(normalizedCourses.map((course) => String(course.id)))
    const pendingCourses = state.courses.filter((course) =>
      (course.status === 'pending' || course.localOnly) && !remoteIds.has(String(course.id))
    )
    const mergedCourses = normalizedCourses.map((course) => ({ ...course, status: 'synced', localOnly: false }))
    return { courses: [...mergedCourses, ...pendingCourses] }
  }),

  addCourse: (courseData, isOnline) => {
    const colors = ['blue', 'indigo', 'violet', 'sky']
    const newCourse = {
      ...courseData,
      id: courseData.id ?? courseData._id ?? Date.now(),
      materials: courseData.materials ?? 0,
      progress: courseData.progress ?? 0,
      downloaded: courseData.downloaded ?? false,
      color: courseData.color ?? colors[Math.floor(Math.random() * colors.length)],
      status: isOnline ? 'synced' : 'pending',
      localOnly: true
    }

    set((state) => ({
      courses: [newCourse, ...state.courses]
    }))
    return newCourse
  },

  updateSyncedCourse: (localId, backendCourse) => set((state) => {
    const exists = state.courses.some((course) => String(course.id) === String(localId))
    return {
      courses: exists
        ? state.courses.map((course) => String(course.id) === String(localId)
            ? { ...course, ...backendCourse, status: 'synced', localOnly: true }
            : course)
          : [{ ...backendCourse, status: 'synced', localOnly: true }, ...state.courses]
    }
  }),

  setCourseSyncStatus: (localId, status) => set((state) => ({
    courses: state.courses.map((course) => String(course.id) === String(localId) ? { ...course, status } : course)
  })),

  downloadCourse: (courseId, isOnline) => {
    set((state) => ({
      courses: state.courses.map((course) =>
        String(course.id) === String(courseId)
          ? {
              ...course,
              downloaded: true,
              status: isOnline ? 'synced' : 'pending'
            }
          : course
      )
    }))
  }
}))

export default useCourseStore
