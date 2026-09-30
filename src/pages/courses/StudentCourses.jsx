import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Clock, Download, Search } from 'lucide-react'
import { getCourses } from '../../api/courses'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useCourseStore from '../../stores/useCourseStore'
import './Courses.css'

const getCourseList = (response) => {
  const courses = Array.isArray(response) ? response : response?.courses || response?.data?.courses || response?.data
  return Array.isArray(courses) ? courses : null
}

function StudentCourses() {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const courses = useCourseStore((state) => state.courses)
  const setCourses = useCourseStore((state) => state.setCourses)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)

  useEffect(() => {
    if (!isOnline) return

    let isMounted = true

    Promise.resolve().then(() => {
      if (!isMounted) return null
      setLoading(true)
      setError('')
      return getCourses()
        .then((data) => {
          const remoteCourses = getCourseList(data)
          if (!remoteCourses) throw new Error('Invalid courses response')
          if (isMounted) setCourses(remoteCourses)
        })
        .catch((requestError) => {
          console.warn('Failed to load courses', {
            status: requestError?.response?.status,
            message: requestError?.response?.data?.message || requestError?.message
          })
          if (isMounted) setError('Unable to load courses from the server. Showing saved courses.')
        })
        .finally(() => {
          if (isMounted) setLoading(false)
        })
    })

    return () => {
      isMounted = false
    }
  }, [isOnline, setCourses])

  const filteredCourses = courses.filter((course) =>
    `${course.code} ${course.title}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div>
          <h1>My Courses</h1>
          <p>{courses.length} enrolled courses</p>
        </div>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses..." />
      </div>

      {loading && <div className="courses-message">Loading courses...</div>}
      {error && <div className="courses-message error">{error}</div>}

      <div className="courses-list">
        {filteredCourses.map((course) => (
          <Link to={`/courses/${course.id}`} key={course.id} className="course-item">
            <div className={`course-badge ${course.color || 'blue'}`}><BookOpen size={20} /></div>
            <div className="course-details">
              <div className="course-top">
                <span className="course-code">{course.code}</span>
                {course.status === 'pending' ? <span className="status pending"><Clock size={14} />Pending</span> : course.status === 'syncing' ? <span className="status pending"><Clock size={14} />Syncing</span> : course.status === 'failed' ? <span className="status pending"><Clock size={14} />Sync failed</span> : course.downloaded ? <span className="status downloaded"><CheckCircle2 size={14} />Available offline</span> : <span className="status not-downloaded"><Download size={14} />Download materials</span>}
              </div>
              <h3>{course.title}</h3>
              <p className="lecturer">{course.lecturer} · {Array.isArray(course.materials) ? course.materials.length : Number(course.materials) || 0} materials</p>
              <div className="progress-section">
                <div className="progress-track"><div className="progress-bar" style={{ width: `${course.progress || 0}%` }} /></div>
                <span>{course.progress || 0}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCourses.length === 0 && <div className="empty-state"><BookOpen size={40} /><p>No courses found</p></div>}
    </div>
  )
}

export default StudentCourses
