import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, CheckCircle2, Clock, Download, Search, UserRoundPlus } from 'lucide-react'
import { browseCourses, enrollInCourse, getCourses } from '../../api/courses'
import useAuthStore from '../../stores/useAuthStore'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useCourseStore from '../../stores/useCourseStore'
import './Courses.css'

const getCourseList = (response) => {
  const courses = Array.isArray(response) ? response : response?.courses || response?.data?.courses || response?.data
  return Array.isArray(courses) ? courses : null
}

function StudentCourses() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState(() => searchParams.get('view') === 'browse' ? 'browse' : 'mine')
  const [browseCoursesList, setBrowseCoursesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [joiningId, setJoiningId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const userId = useAuthStore((state) => state.user?.id)
  const courses = useCourseStore((state) => state.courses)
  const setCourses = useCourseStore((state) => state.setCourses)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)

  useEffect(() => {
    if (!isOnline || !userId) return

    let isMounted = true

    Promise.resolve().then(() => {
      if (!isMounted) return null
      setLoading(true)
      setError('')
      const loadCourses = tab === 'mine' ? getCourses(userId) : browseCourses(userId)
      return loadCourses
        .then((data) => {
          const remoteCourses = getCourseList(data)
          if (!remoteCourses) throw new Error('Invalid courses response')
          if (!isMounted) return
          if (tab === 'mine') setCourses(remoteCourses)
          else setBrowseCoursesList(remoteCourses)
        })
        .catch((requestError) => {
          console.warn('Failed to load courses', {
            status: requestError?.response?.status,
            message: requestError?.response?.data?.message || requestError?.message
          })
          if (isMounted) setError(tab === 'mine' ? 'Unable to load your courses. Showing saved courses.' : 'Unable to load courses to browse.')
        })
        .finally(() => {
          if (isMounted) setLoading(false)
        })
    })

    return () => {
      isMounted = false
    }
  }, [isOnline, setCourses, tab, userId])

  const handleJoin = async (course) => {
    if (!userId) {
      setError('Please login again')
      return
    }
    const courseId = course.id ?? course._id
    if (courseId == null) return
    setJoiningId(String(courseId))
    setError('')
    setSuccess('')
    try {
      const response = await enrollInCourse(courseId, userId)
      const enrolledCourse = response?.course || response?.data?.course || course
      const [myCoursesResult, browseResult] = await Promise.allSettled([
        getCourses(userId),
        browseCourses(userId)
      ])
      if (myCoursesResult.status === 'fulfilled') {
        const myCourses = getCourseList(myCoursesResult.value)
        if (myCourses) setCourses(myCourses)
        else setCourses([{ ...enrolledCourse, id: enrolledCourse.id ?? enrolledCourse._id ?? courseId }, ...courses])
      } else {
        setCourses([{ ...enrolledCourse, id: enrolledCourse.id ?? enrolledCourse._id ?? courseId }, ...courses])
      }
      if (browseResult.status === 'fulfilled') {
        const availableCourses = getCourseList(browseResult.value)
        if (availableCourses) setBrowseCoursesList(availableCourses)
      } else {
        setBrowseCoursesList((current) => current.filter((item) => String(item.id ?? item._id) !== String(courseId)))
      }
      setSuccess(`You joined ${course.title || course.name || 'the course'}.`)
      setTab('mine')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.error || 'Unable to join this course. Please try again.')
    } finally {
      setJoiningId(null)
    }
  }

  const visibleCourses = !userId ? [] : tab === 'mine' ? courses : browseCoursesList
  const filteredCourses = visibleCourses.filter((course) => {
    const tutorName = course.tutorName || course.tutor?.name || course.lecturer || ''
    return `${course.title || course.name || ''} ${course.code || ''} ${tutorName}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  })

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div>
          <h1>{tab === 'mine' ? 'My Courses' : 'Browse Courses'}</h1>
          <p>{tab === 'mine' ? `${courses.length} enrolled courses` : 'Find a course to join'}</p>
        </div>
      </div>

      <div className="course-tabs" role="tablist" aria-label="Course views">
        <button type="button" role="tab" aria-selected={tab === 'mine'} className={tab === 'mine' ? 'active' : ''} onClick={() => { setTab('mine'); setSearch(''); setSuccess('') }}>My Courses</button>
        <button type="button" role="tab" aria-selected={tab === 'browse'} className={tab === 'browse' ? 'active' : ''} onClick={() => { setTab('browse'); setSearch(''); setSuccess('') }}>Browse Courses</button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === 'mine' ? 'Search my courses...' : 'Search courses to join...'} />
      </div>

      {loading && <div className="courses-message" role="status">Loading courses...</div>}
      {!userId && <div className="courses-message error" role="alert">Please login again</div>}
      {error && <div className="courses-message error">{error}</div>}
      {success && <div className="courses-message" role="status">{success}</div>}

      <div className="courses-list">
        {filteredCourses.map((course) => (
          <div key={course.id ?? course._id} className="course-item">
            <div className={`course-badge ${course.color || 'blue'}`}><BookOpen size={20} /></div>
            <div className="course-details">
              <div className="course-top">
                <span className="course-code">{course.code}</span>
                {course.status === 'pending' ? <span className="status pending"><Clock size={14} />Pending</span> : course.status === 'syncing' ? <span className="status pending"><Clock size={14} />Syncing</span> : course.status === 'failed' ? <span className="status pending"><Clock size={14} />Sync failed</span> : course.downloaded ? <span className="status downloaded"><CheckCircle2 size={14} />Available offline</span> : <span className="status not-downloaded"><Download size={14} />Download materials</span>}
              </div>
              <h3>{course.title}</h3>
              <p className="lecturer">{course.tutor?.name || course.tutorName || course.lecturer || 'Tutor not listed'} · {Array.isArray(course.materials) ? course.materials.length : Number(course.materials) || 0} materials</p>
              <div className="progress-section"><span>{Number(course.studentsCount ?? course.studentCount ?? course.enrollments?.length) || 0} students</span></div>
            </div>
            {tab === 'mine' ? <Link className="open-course-btn" to={`/courses/${course.id ?? course._id}`}>Open course</Link> : <button className="join-course-btn" type="button" onClick={() => handleJoin(course)} disabled={joiningId === String(course.id ?? course._id)}><UserRoundPlus size={16} />{joiningId === String(course.id ?? course._id) ? 'Joining...' : 'Join course'}</button>}
          </div>
        ))}
      </div>

      {userId && filteredCourses.length === 0 && !loading && <div className="empty-state"><BookOpen size={40} /><p>{tab === 'mine' ? 'You haven’t joined any course yet' : 'No courses are available to join right now.'}</p>{tab === 'mine' && <button type="button" className="browse-empty-btn" onClick={() => setTab('browse')}>Browse Courses</button>}</div>}
    </div>
  )
}

export default StudentCourses
