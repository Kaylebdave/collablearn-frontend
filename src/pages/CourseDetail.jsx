import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle2, Download } from 'lucide-react'
import useAuthStore from '../stores/useAuthStore'
import useConnectivityStore from '../stores/useConnectivityStore'
import useCourseStore from '../stores/useCourseStore'
import './CourseDetail.css'

function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const courses = useCourseStore((state) => state.courses) || []
  const downloadCourse = useCourseStore((state) => state.downloadCourse)
  const user = useAuthStore((state) => state.user)
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const course = courses.find((c) => String(c.id) === String(id))

  if (!course) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Course not found</h2>
        <p>ID received: {id}</p>
        <button onClick={() => navigate('/courses')}>
          Back to Courses
        </button>
      </div>
    )
  }

  return (
    <div className="course-detail-page">
      <div className="detail-top">
        <button className="back-btn" onClick={() => navigate('/courses')}>
          <ArrowLeft size={20} />
        </button>
        <h1>Course Details</h1>
      </div>

      <div className={`course-hero ${course.color || 'blue'}`}>
        <div className="hero-icon">
          <BookOpen size={28} />
        </div>
        <div className="hero-content">
          <span className="hero-code">{course.code}</span>
          <h2>{course.title}</h2>
          <p>{course.lecturer} • {course.materials} materials</p>
        </div>
      </div>

      <div className="progress-card">
        <div className="progress-header">
          <span>{user?.role === 'tutor' ? 'Learner progress' : 'Your progress'}</span>
          <strong>{course.progress || 0}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${course.progress || 0}%` }} />
        </div>
      </div>

      {user?.role !== 'tutor' && (
        <button
          className="course-download-btn"
          onClick={() => downloadCourse(course.id, isOnline)}
          disabled={course.downloaded}
        >
          {course.downloaded ? <CheckCircle2 size={16} /> : <Download size={16} />}
          {course.downloaded ? 'Materials available offline' : 'Download materials'}
        </button>
      )}

      {!isOnline && !course.downloaded && (
        <div className="offline-note">
          You are offline. Your download will be queued for sync.
        </div>
      )}
    </div>
  )
}

export default CourseDetail
