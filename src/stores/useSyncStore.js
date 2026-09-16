import { create } from 'zustand'
import useDiscussionStore from './useDiscussionStore'
import useGroupStore from './useGroupStore'
import useCourseStore from './useCourseStore'

const useSyncStore = create((set, get) => ({
  isSyncing: false,
  lastSynced: null,

  getPendingItems: () => {
    const posts = useDiscussionStore.getState().posts.filter(
      (p) => p.status === 'pending'
    )
    const groups = useGroupStore.getState().groups.filter(
      (g) => g.status === 'pending'
    )
    const courses = useCourseStore.getState().courses.filter(
      (c) => c.status === 'pending'
    )

    const pendingPosts = posts.map((p) => ({
      id: p.id,
      type: 'Discussion',
      title: p.title,
      time: p.time || 'Just now'
    }))

    const pendingGroups = groups.map((g) => ({
      id: g.id,
      type: 'Study Group',
      title: g.name,
      time: 'Just now'
    }))

    const pendingCourses = courses.map((c) => ({
      id: c.id,
      type: 'Course',
      title: c.title,
      time: 'Just now'
    }))

    return [...pendingPosts, ...pendingGroups, ...pendingCourses]
  },

  // Mark all pending items as synced
  syncAll: async () => {
    set({ isSyncing: true })

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // Sync Discussions
    useDiscussionStore.setState((state) => ({
      posts: state.posts.map((post) =>
        post.status === 'pending'
          ? {
              ...post,
              status: 'synced',
              replies: (post.replies || []).map((r) =>
                r.status === 'pending' ? { ...r, status: 'synced' } : r
              )
            }
          : {
              ...post,
              replies: (post.replies || []).map((r) =>
                r.status === 'pending' ? { ...r, status: 'synced' } : r
              )
            }
      )
    }))

    // Sync Groups
    useGroupStore.setState((state) => ({
      groups: state.groups.map((group) =>
        group.status === 'pending' ? { ...group, status: 'synced' } : group
      )
    }))

    // Sync Courses
    useCourseStore.setState((state) => ({
      courses: state.courses.map((course) =>
        course.status === 'pending' ? { ...course, status: 'synced' } : course
      )
    }))

    set({
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString()
    })
  }
}))

export default useSyncStore