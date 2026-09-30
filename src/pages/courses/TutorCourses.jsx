import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Clock, Plus, Search, Users } from 'lucide-react'
import { getCourses } from '../../api/courses'
import useAuthStore from '../../stores/useAuthStore'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useCourseStore from '../../stores/useCourseStore'
import useSyncStore from '../../stores/useSyncStore'
import './Courses.css'

const getCourseList = (response) => {
  const courses = Array.isArray(response) ? response : response?.courses || response?.data?.courses || response?.data
  return Array.isArray(courses) ? courses : null
}

function TutorCourses() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [lecturer, setLecturer] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const user = useAuthStore((state) => state.user)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const { courses, addCourse, setCourses, setCourseSyncStatus } = useCourseStore()
  const enqueue = useSyncStore((state) => state.enqueue)
  const syncNow = useSyncStore((state) => state.syncNow)
  const filteredCourses = courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(search.toLowerCase()))

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

  const handleCreateCourse = async (event) => {
    event.preventDefault()

    const values = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      lecturer: lecturer.trim() || user?.name?.trim() || '',
      description: description.trim()
    }
    const nextFieldErrors = Object.fromEntries(
      Object.entries(values)
        .filter(([, value]) => !value)
        .map(([field]) => [field, `${field[0].toUpperCase()}${field.slice(1)} is required.`])
    )

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) return

    const courseData = {
      ...values
    }

    setSaving(true)
    setError('')
    const localCourse = addCourse(courseData, false)
    setCode('')
    setTitle('')
    setLecturer(user?.name || '')
    setDescription('')
    setFieldErrors({})
    setShowModal(false)
    try {
      enqueue('CREATE_COURSE', courseData, localCourse.id)
      if (isOnline) await syncNow()
    } catch (queueError) {
      setCourseSyncStatus(localCourse.id, 'failed')
      setError(queueError?.message || 'Course saved locally but could not be queued for sync.')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field, setter) => (event) => {
    setter(event.target.value)
    if (fieldErrors[field]) {
      setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: '' }))
    }
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div><h1>Course Management</h1><p>{courses.length} courses under your care</p></div>
        <button className="new-course-btn" onClick={() => setShowModal(true)}><Plus size={18} />New Course</button>
      </div>
      <div className="search-bar"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your courses..." /></div>
      {loading && <div className="courses-message">Loading courses...</div>}
      {error && <div className="courses-message error">{error}</div>}
      <div className="courses-list">
        {filteredCourses.map((course) => (
          <Link to={`/courses/${course.id}`} key={course.id} className="course-item">
            <div className={`course-badge ${course.color || 'blue'}`}><BookOpen size={20} /></div>
            <div className="course-details">
              <div className="course-top"><span className="course-code">{course.code}</span>{course.status === 'pending' ? <span className="status pending"><Clock size={14} />Pending sync</span> : course.status === 'syncing' ? <span className="status pending"><Clock size={14} />Syncing</span> : course.status === 'failed' ? <span className="status pending"><Clock size={14} />Sync failed</span> : <span className="status downloaded"><CheckCircle2 size={14} />Synced</span>}</div>
              <h3>{course.title}</h3>
              <p className="lecturer">{Array.isArray(course.materials) ? course.materials.length : Number(course.materials) || 0} materials · Teaching course</p>
              <div className="progress-section"><Users size={15} className="text-blue-600" /><span>Manage materials and learner activity</span></div>
            </div>
          </Link>
        ))}
      </div>
      {filteredCourses.length === 0 && <div className="empty-state"><BookOpen size={40} /><p>No courses found</p></div>}
      {showModal && <div className="modal-overlay"><div className="modal"><div className="modal-header"><h2>Create New Course</h2><button type="button" aria-label="Close" onClick={() => setShowModal(false)}>×</button></div><form onSubmit={handleCreateCourse} noValidate>
        <div className="form-group"><label htmlFor="course-code">Course Code</label><input id="course-code" value={code} onChange={updateField('code', setCode)} placeholder="e.g. CSC 301" aria-invalid={Boolean(fieldErrors.code)} aria-describedby={fieldErrors.code ? 'course-code-error' : undefined} />{fieldErrors.code && <p id="course-code-error" className="field-error">{fieldErrors.code}</p>}</div>
        <div className="form-group"><label htmlFor="course-title">Course Title</label><input id="course-title" value={title} onChange={updateField('title', setTitle)} placeholder="e.g. Database Systems" aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? 'course-title-error' : undefined} />{fieldErrors.title && <p id="course-title-error" className="field-error">{fieldErrors.title}</p>}</div>
        <div className="form-group"><label htmlFor="course-lecturer">Lecturer</label><input id="course-lecturer" value={lecturer || user?.name || ''} onChange={updateField('lecturer', setLecturer)} placeholder="Lecturer name" aria-invalid={Boolean(fieldErrors.lecturer)} aria-describedby={fieldErrors.lecturer ? 'course-lecturer-error' : undefined} />{fieldErrors.lecturer && <p id="course-lecturer-error" className="field-error">{fieldErrors.lecturer}</p>}</div>
        <div className="form-group"><label htmlFor="course-description">Description</label><textarea id="course-description" rows="3" value={description} onChange={updateField('description', setDescription)} placeholder="Short description of the course" aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? 'course-description-error' : undefined} />{fieldErrors.description && <p id="course-description-error" className="field-error">{fieldErrors.description}</p>}</div>
        {!isOnline && <div className="offline-note">You are offline. This course will be saved and synced later.</div>}<button className="submit-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : isOnline ? 'Create Course' : 'Save Offline'}</button></form></div></div>}
    </div>
  )
}

export default TutorCourses
