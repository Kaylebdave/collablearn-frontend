import { useEffect } from 'react'
import { getCourses, getCreatedCourses } from '../../api/courses'
import { getDiscussions } from '../../api/discussions'
import { getGroups } from '../../api/groups'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useAuthStore from '../../stores/useAuthStore'
import useCourseStore from '../../stores/useCourseStore'
import useDiscussionStore from '../../stores/useDiscussionStore'
import useGroupStore from '../../stores/useGroupStore'
import StudentHome from './StudentHome'
import TutorHome from './TutorHome'

const getList = (response, key) => {
  const list = Array.isArray(response)
    ? response
    : response?.[key] || response?.data?.[key] || response?.data
  return Array.isArray(list) ? list : null
}

function Home() {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const setCourses = useCourseStore((state) => state.setCourses)
  const setPosts = useDiscussionStore((state) => state.setPosts)
  const setGroups = useGroupStore((state) => state.setGroups)
  const userRole = user?.role

  useEffect(() => {
    if (!userId || !isOnline) return undefined

    let active = true
    const loadDashboardData = async () => {
      const [coursesResult, discussionsResult, groupsResult] = await Promise.allSettled([
        userRole === 'tutor' ? getCreatedCourses(userId) : getCourses(userId),
        getDiscussions(),
        getGroups()
      ])
      if (!active) return

      if (coursesResult.status === 'fulfilled') {
        const courses = getList(coursesResult.value, 'courses')
        if (courses) setCourses(courses)
      }
      if (discussionsResult.status === 'fulfilled') {
        const posts = getList(discussionsResult.value, 'discussions')
        if (posts) setPosts(posts)
      }
      if (groupsResult.status === 'fulfilled') {
        const groups = getList(groupsResult.value, 'groups')
        if (groups) setGroups(groups)
      }
    }

    void loadDashboardData()
    return () => {
      active = false
    }
  }, [userId, userRole, isOnline, setCourses, setPosts, setGroups])

  const isTutor = user?.role === 'tutor'

  if (!userId) {
    return <div className="courses-message error" role="alert">Please login again</div>
  }

  return isTutor ? <TutorHome /> : <StudentHome />
}

export default Home