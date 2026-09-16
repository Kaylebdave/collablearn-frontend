import { create } from 'zustand'

const useCourseStore = create((set) => ({
  courses: [
    {
      id: 1,
      code: 'CSC 301',
      title: 'Database Systems',
      lecturer: 'Dr. Adeyemi',
      materials: 12,
      progress: 65,
      downloaded: true,
      color: 'blue'
    },
    {
      id: 2,
      code: 'CSC 205',
      title: 'Operating Systems',
      lecturer: 'Prof. Okonkwo',
      materials: 9,
      progress: 40,
      downloaded: false,
      color: 'indigo'
    },
    {
      id: 3,
      code: 'MTH 201',
      title: 'Linear Algebra',
      lecturer: 'Dr. Bello',
      materials: 7,
      progress: 80,
      downloaded: true,
      color: 'violet'
    },
    {
      id: 4,
      code: 'CSC 401',
      title: 'Software Engineering',
      lecturer: 'Dr. Nwachukwu',
      materials: 15,
      progress: 25,
      downloaded: false,
      color: 'sky'
    }
  ],

  addCourse: (courseData, isOnline) => {
    const colors = ['blue', 'indigo', 'violet', 'sky']
    const newCourse = {
      id: Date.now(),
      ...courseData,
      materials: 0,
      progress: 0,
      downloaded: false,
      color: colors[Math.floor(Math.random() * colors.length)],
      status: isOnline ? 'synced' : 'pending'
    }

    set((state) => ({
      courses: [newCourse, ...state.courses]
    }))
  },

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
