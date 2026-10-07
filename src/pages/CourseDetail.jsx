import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle2, Download, FileText, MessageSquare, Upload, Users } from 'lucide-react'
import { getCourseById, uploadCourseMaterial } from '../api/courses'
import useAuthStore from '../stores/useAuthStore'
import useConnectivityStore from '../stores/useConnectivityStore'
import useCourseStore from '../stores/useCourseStore'
import useDiscussionStore from '../stores/useDiscussionStore'
import useGroupStore from '../stores/useGroupStore'
import './CourseDetail.css'

const getCourseFromResponse = (response) => response?.course || response?.data?.course || response?.data || response

const getErrorMessage = (requestError, fallback) => {
  const responseData = requestError?.response?.data
  if (typeof responseData === 'string') return responseData
  return responseData?.message || responseData?.error || requestError?.message || fallback
}

const displayText = (value, fallback) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : fallback

function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const courses = useCourseStore((state) => state.courses)
  const discussions = useDiscussionStore((state) => state.posts)
  const groups = useGroupStore((state) => state.groups)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const localCourse = courses.find((item) => String(item.id) === String(id)) || null
  const [course, setCourse] = useState(localCourse)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const loadCourse = async () => {
    if (!isOnline) {
      setCourse(localCourse)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError('')

    try {
      const response = await getCourseById(id, user?.id)
      const fetchedCourse = getCourseFromResponse(response)

      if (!fetchedCourse || typeof fetchedCourse !== 'object') {
        throw new Error('Invalid course response')
      }

      setCourse({ ...fetchedCourse, id: fetchedCourse.id ?? fetchedCourse._id })
    } catch (requestError) {
      console.warn('Failed to load course details', {
        status: requestError?.response?.status,
        message: getErrorMessage(requestError, 'Request failed')
      })
      setCourse(localCourse)
      setLoadError(getErrorMessage(requestError, 'Unable to load course details.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    if (!isOnline || !user?.id) return () => { active = false }

    Promise.resolve().then(async () => {
      if (!active) return

      setLoading(true)
      setLoadError('')
      setUploadError('')
      setCourse(localCourse)

      try {
        const response = await getCourseById(id)
        const fetchedCourse = getCourseFromResponse(response)

        if (!fetchedCourse || typeof fetchedCourse !== 'object') {
          throw new Error('Invalid course response')
        }

        if (active) setCourse({ ...fetchedCourse, id: fetchedCourse.id ?? fetchedCourse._id })
      } catch (requestError) {
        console.warn('Failed to load course details', {
          status: requestError?.response?.status,
          message: getErrorMessage(requestError, 'Request failed')
        })
        if (active) {
          setCourse(localCourse)
          setLoadError(getErrorMessage(requestError, 'Unable to load course details.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [id, isOnline, localCourse, user?.id])

  const handleUpload = async (event) => {
    event.preventDefault()

    if (!title.trim() || !file) {
      setUploadError('Enter a material title and choose a file.')
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('file', file)
    setUploading(true)
    setUploadError('')

    try {
      await uploadCourseMaterial(id, formData, user?.id)
      await loadCourse()
      setTitle('')
      setFile(null)
      event.currentTarget.reset()
    } catch (uploadError) {
      setUploadError(getErrorMessage(uploadError, 'Unable to upload material.'))
    } finally {
      setUploading(false)
    }
  }

  const displayedCourse = String(course?.id) === String(id) ? course : localCourse

  if (!user?.id) {
    return <div className="course-message error" role="alert">Please login again</div>
  }

  if (loading && isOnline && !displayedCourse) {
    return <div className="course-message">Loading...</div>
  }

  if (!displayedCourse) {
    return (
      <div className="not-found">
        <h2>Course not found</h2>
        <p>{loadError || 'The requested course could not be loaded.'}</p>
        <button className="back-link" onClick={() => navigate('/courses')}>
          Back to Courses
        </button>
      </div>
    )
  }

  const materials = Array.isArray(displayedCourse.materials) ? displayedCourse.materials : []
  const tutor = displayedCourse.tutor || displayedCourse.instructor || displayedCourse.lecturer
  const tutorName = typeof tutor === 'string' ? tutor : tutor?.name || displayedCourse.tutorName || 'Tutor not listed'
  const people = displayedCourse.students || displayedCourse.enrolledStudents || displayedCourse.classmates || displayedCourse.learners || []
  const courseMatches = (item) => {
    const linkedCourseId = item.courseId ?? item.course?.id ?? item.course?._id
    const linkedCourse = typeof item.course === 'string' ? item.course : item.course?.code ?? item.course?.title
    return (linkedCourseId != null && String(linkedCourseId) === String(id)) ||
      (linkedCourse && [displayedCourse.code, displayedCourse.title].some((value) => value && String(value).toLowerCase() === String(linkedCourse).toLowerCase()))
  }
  const courseDiscussions = discussions.filter(courseMatches)
  const courseGroups = groups.filter(courseMatches)
  const tabItems = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'people', label: user?.role === 'tutor' ? 'Students' : 'Classmates', icon: Users },
    { id: 'groups', label: 'Groups', icon: Users }
  ]

  return (
    <div className="course-detail-page">
      <div className="detail-top">
        <button className="back-btn" onClick={() => navigate('/courses')} aria-label="Back to courses">
          <ArrowLeft size={20} />
        </button>
        <h1>Course Details</h1>
      </div>

      {loadError && <div className="course-message error">{loadError} Showing saved course details.</div>}

      <section className="course-hero blue">
        <div className="hero-icon">
          <FileText size={28} />
        </div>
        <div className="hero-content">
          <span className="hero-code">{displayText(displayedCourse.code, 'Course')}</span>
          <h2>{displayText(displayedCourse.title, 'Untitled course')}</h2>
          <p>{tutorName}</p>
        </div>
        {user?.role === 'student' && <span className="enrolled-badge"><CheckCircle2 size={15} />Enrolled</span>}
      </section>

      <nav className="course-detail-tabs" role="tablist" aria-label="Course sections">
        {tabItems.map(({ id: tabId, label, icon: Icon }) => <button key={tabId} type="button" role="tab" aria-selected={activeTab === tabId} className={activeTab === tabId ? 'active' : ''} onClick={() => setActiveTab(tabId)}><Icon size={16} />{label}</button>)}
      </nav>

      {activeTab === 'overview' && <section className="detail-section overview-panel">
        <div><span className="detail-eyebrow">Course overview</span><h3>{displayText(displayedCourse.title, 'Untitled course')}</h3><p>{displayText(displayedCourse.description, 'No description available.')}</p></div>
        <div className="tutor-info-card"><div className="tutor-avatar">{tutorName.slice(0, 1).toUpperCase()}</div><div><span className="detail-eyebrow">Course tutor</span><strong>{tutorName}</strong>{typeof tutor === 'object' && tutor.email && <small>{tutor.email}</small>}</div><span className="tutor-role">Tutor</span></div>
        {user?.role === 'tutor' && <button type="button" className="manage-course-btn" onClick={() => setActiveTab('materials')}><Upload size={16} />Manage course materials</button>}
      </section>}

      {activeTab === 'materials' && <section className="detail-section">
        <div className="section-header"><h3>Materials</h3><span className="material-count">{materials.length}</span></div>
        {user?.role === 'tutor' && <div className="upload-section"><h3>Upload material</h3>{uploadError && <p className="form-error">{uploadError}</p>}<form className="upload-form" onSubmit={handleUpload}><label htmlFor="material-title">Title</label><input id="material-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={uploading} required /><label htmlFor="material-file">File</label><input id="material-file" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} disabled={uploading} required /><button className="upload-submit" type="submit" disabled={uploading}><Upload size={16} />{uploading ? 'Uploading...' : 'Upload material'}</button></form></div>}
        {materials.length === 0 ? <div className="materials-empty">No materials available yet.</div> : <div className="materials-list">{materials.map((material) => {
          if (!material || typeof material !== 'object') return null
          const materialTitle = displayText(material.title, 'Untitled material')
          const materialType = displayText(material.fileType, '')
          const materialUrl = typeof (material.fileUrl || material.url) === 'string' ? material.fileUrl || material.url : ''
          return <div className="material-item" key={material.id || material._id || materialUrl || materialTitle}><div className="material-icon"><FileText size={18} /></div><div className="material-info"><h4>{materialTitle}</h4>{materialType && <p>{materialType}</p>}</div>{material.offline && <span className="offline-badge">Offline</span>}{materialUrl && <a className="download-btn" href={materialUrl} target="_blank" rel="noreferrer" aria-label={`Open ${materialTitle}`}><Download size={17} /></a>}</div>
        })}</div>}
      </section>}

      {activeTab === 'discussion' && <section className="detail-section"><div className="section-header"><h3>Course discussion</h3><span className="material-count">{courseDiscussions.length}</span></div>{courseDiscussions.length ? <div className="course-related-list">{courseDiscussions.map((post) => <Link to={`/discussions/${post.id ?? post._id}`} className="course-related-item" key={post.id ?? post._id}><MessageSquare size={18} /><div><strong>{post.title || 'Discussion thread'}</strong><span>{post.author?.name || post.authorName || (typeof post.author === 'string' ? post.author : 'Author not provided')} · {post.replies?.length || 0} replies</span></div></Link>)}</div> : <div className="materials-empty">No discussions for this course yet.</div>}</section>}

      {activeTab === 'people' && <section className="detail-section"><div className="section-header"><h3>{user?.role === 'tutor' ? 'Students in this course' : 'Classmates'}</h3><span className="material-count">{Array.isArray(people) ? people.length : 0}</span></div><div className="course-people-list"><div className="course-person tutor-person"><div className="person-avatar">{tutorName.slice(0, 1).toUpperCase()}</div><div><strong>{tutorName}</strong><span>Course tutor</span></div></div>{Array.isArray(people) && people.filter((person) => person && (typeof person === 'object' || typeof person === 'string')).map((person, index) => { const name = typeof person === 'string' ? person : person.name || person.fullName; if (!name || name === tutorName) return null; return <div className="course-person" key={person.id ?? person._id ?? person.email ?? `${name}-${index}`}><div className="person-avatar">{name.slice(0, 1).toUpperCase()}</div><div><strong>{name}</strong><span>{person.role === 'tutor' ? 'Tutor' : 'Student'}</span></div></div> })}</div>{(!Array.isArray(people) || people.length === 0) && <div className="materials-empty">No student roster is available for this course yet.</div>}</section>}

      {activeTab === 'groups' && <section className="detail-section"><div className="section-header"><h3>Course groups</h3><span className="material-count">{courseGroups.length}</span></div>{courseGroups.length ? <div className="course-related-list">{courseGroups.map((group) => <Link to={`/groups/${group.id ?? group._id}`} className="course-related-item" key={group.id ?? group._id}><Users size={18} /><div><strong>{group.name || 'Study group'}</strong><span>{Number(group.membersCount ?? group.members?.length) || 0} members</span></div></Link>)}</div> : <div className="materials-empty">No study groups are linked to this course.</div>}</section>}
    </div>
  )
}

export default CourseDetail
