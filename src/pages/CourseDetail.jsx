import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle2, Download, FileText, MessageSquare, Upload, Users } from 'lucide-react'
import { getCourseById, uploadCourseMaterial } from '../api/courses'
import { createDiscussion, getDiscussions } from '../api/discussions'
import useAuthStore from '../stores/useAuthStore'
import useConnectivityStore from '../stores/useConnectivityStore'
import useCourseStore from '../stores/useCourseStore'
import useDiscussionStore from '../stores/useDiscussionStore'
import useGroupStore from '../stores/useGroupStore'
import useSyncStore from '../stores/useSyncStore'
import { isNetworkFailure } from '../services/syncEngine'
import './CourseDetail.css'

const getCourseFromResponse = (response) => response?.course || response?.data?.course || response?.data || response
const getDiscussionList = (response) => {
  const posts = Array.isArray(response)
    ? response
    : response?.discussions || response?.data?.discussions || response?.data
  return Array.isArray(posts) ? posts : null
}

const getErrorMessage = (requestError, fallback) => {
  const responseData = requestError?.response?.data
  if (typeof responseData === 'string') return responseData
  return responseData?.message || responseData?.error || requestError?.message || fallback
}

const displayText = (value, fallback) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : fallback
const getAuthorName = (author, fallback = 'Author not provided') =>
  typeof author === 'string' ? author : author?.name || author?.fullName || fallback
const allowedMaterialExtensions = new Set(['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'ppt', 'pptx'])

function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const courses = useCourseStore((state) => state.courses)
  const discussions = useDiscussionStore((state) => state.posts)
  const addPost = useDiscussionStore((state) => state.addPost)
  const groups = useGroupStore((state) => state.groups)
  const enqueue = useSyncStore((state) => state.enqueue)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const localCourse = courses.find((item) => String(item.id) === String(id)) || null
  const [course, setCourse] = useState(localCourse)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [courseDiscussionPosts, setCourseDiscussionPosts] = useState(null)
  const [discussionListCourseId, setDiscussionListCourseId] = useState(null)
  const [discussionLoading, setDiscussionLoading] = useState(false)
  const [discussionError, setDiscussionError] = useState('')
  const [discussionNotice, setDiscussionNotice] = useState('')
  const [showDiscussionForm, setShowDiscussionForm] = useState(false)
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('')
  const [newDiscussionContent, setNewDiscussionContent] = useState('')
  const [creatingDiscussion, setCreatingDiscussion] = useState(false)

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
      setCourse((currentCourse) => currentCourse || localCourse)
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
        const response = await getCourseById(id, user.id)
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

  useEffect(() => {
    if (!isOnline || !user?.id) return undefined
    let active = true
    Promise.resolve().then(() => {
      if (!active) return null
      setDiscussionLoading(true)
      setDiscussionError('')
      return getDiscussions({ courseId: id, userId: user.id })
        .then((response) => {
          const posts = getDiscussionList(response)
          if (!posts) throw new Error('Invalid discussions response')
          if (active) {
            setCourseDiscussionPosts(posts)
            setDiscussionListCourseId(id)
          }
        })
        .catch((requestError) => {
          if (!active) return
          setCourseDiscussionPosts([])
          setDiscussionListCourseId(id)
          setDiscussionError(getErrorMessage(requestError, 'Unable to load course discussions.'))
        })
        .finally(() => {
          if (active) setDiscussionLoading(false)
        })
    })
    return () => { active = false }
  }, [id, isOnline, user?.id])

  const handleUpload = async (event) => {
    event.preventDefault()

    if (!title.trim() || !file) {
      setUploadError('Enter a material title and choose a file.')
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!allowedMaterialExtensions.has(extension)) {
      setUploadError('Choose a PDF, PNG, JPG, JPEG, DOC, DOCX, PPT, or PPTX file.')
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('file', file)
    setUploading(true)
    setUploadError('')

    try {
      await uploadCourseMaterial(id, formData, user?.id)
    } catch (uploadError) {
      setUploadError(getErrorMessage(uploadError, 'Unable to upload material.'))
      setUploading(false)
      return
    }

    setTitle('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploadError('')

    try {
      await loadCourse()
    } finally {
      setUploading(false)
    }
  }

  const handleCreateDiscussion = async (event) => {
    event.preventDefault()
    if (!user?.id) {
      setDiscussionError('Please login again')
      return
    }
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim()) {
      setDiscussionError('Enter a title and message for your discussion.')
      return
    }

    setCreatingDiscussion(true)
    setDiscussionError('')
    setDiscussionNotice('')
    const courseId = displayedCourse.id ?? displayedCourse._id ?? id
    const courseName = displayedCourse.code || displayedCourse.title
    const payload = {
      title: newDiscussionTitle.trim(),
      content: newDiscussionContent.trim(),
      courseId,
      userId: user.id
    }

    let shouldRefresh = false
    try {
      if (isOnline) {
        try {
          const response = await createDiscussion(payload)
          const created = response?.discussion || response?.data?.discussion || response?.data || response
          addPost({
            ...payload,
            ...created,
            courseId: created?.courseId ?? courseId,
            course: created?.course ?? courseName,
            author: created?.author ?? user.name ?? ''
          }, true)
          shouldRefresh = true
        } catch (requestError) {
          if (!isNetworkFailure(requestError)) throw requestError
          const localPost = addPost({ ...payload, course: courseName, author: user.name || '' }, false)
          enqueue('CREATE_DISCUSSION', { ...payload, course: courseName, author: user.name || '' }, localPost.id)
          setDiscussionNotice('Saved offline. It will post when your connection returns.')
        }
      } else {
        const localPost = addPost({ ...payload, course: courseName, author: user.name || '' }, false)
        enqueue('CREATE_DISCUSSION', { ...payload, course: courseName, author: user.name || '' }, localPost.id)
        setDiscussionNotice('Saved offline. It will post when your connection returns.')
      }

      setNewDiscussionTitle('')
      setNewDiscussionContent('')
      setShowDiscussionForm(false)

      if (shouldRefresh) {
        try {
          const refreshed = await getDiscussions({ courseId, userId: user.id })
          const posts = getDiscussionList(refreshed)
          if (!posts) throw new Error('Invalid course discussion response')
          setCourseDiscussionPosts(posts)
          setDiscussionListCourseId(courseId)
        } catch (refreshError) {
          setDiscussionError(getErrorMessage(refreshError, 'Discussion posted, but the course list could not refresh.'))
        }
      }
    } catch (requestError) {
      setDiscussionError(getErrorMessage(requestError, 'Unable to create or refresh this discussion.'))
    } finally {
      setCreatingDiscussion(false)
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
    const linkedCourseId = item?.courseId ?? item?.course?.id ?? item?.course?._id
    const linkedCourse = typeof item?.course === 'string' ? item.course : item?.course?.code ?? item?.course?.title
    if (linkedCourseId != null) return String(linkedCourseId) === String(id)
    return Boolean(linkedCourse && [displayedCourse.code, displayedCourse.title].some((value) => value && String(value).toLowerCase() === String(linkedCourse).toLowerCase()))
  }
  const discussionMap = new Map()
  for (const post of [
    ...(String(discussionListCourseId) === String(id) ? courseDiscussionPosts || [] : []),
    ...discussions.filter(courseMatches)
  ]) {
    const postId = post.id ?? post._id ?? post.localId
    const key = postId == null ? `${post.courseId}:${post.title}:${post.content}` : String(postId)
    discussionMap.set(key, { ...discussionMap.get(key), ...post })
  }
  const courseDiscussions = [...discussionMap.values()]
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
        {user?.role === 'tutor' && <div className="upload-section"><h3>Upload material</h3>{uploadError && <p className="form-error" role="alert">{uploadError}</p>}<form className="upload-form" onSubmit={handleUpload}><label htmlFor="material-title">Title</label><input id="material-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={uploading} required /><label htmlFor="material-file">File</label><input ref={fileInputRef} id="material-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx" onChange={(event) => setFile(event.target.files?.[0] || null)} disabled={uploading} required /><button className="upload-submit" type="submit" disabled={uploading}><Upload size={16} />{uploading ? 'Uploading...' : 'Upload material'}</button></form></div>}
        {materials.length === 0 ? <div className="materials-empty">No materials available yet.</div> : <div className="materials-list">{materials.map((material) => {
          if (!material || typeof material !== 'object') return null
          const materialTitle = displayText(material.title, 'Untitled material')
          const materialType = displayText(material.fileType, '')
          const materialUrl = typeof (material.fileUrl || material.url) === 'string' ? material.fileUrl || material.url : ''
          return <div className="material-item" key={material.id || material._id || materialUrl || materialTitle}><div className="material-icon"><FileText size={18} /></div><div className="material-info"><h4>{materialTitle}</h4>{materialType && <p>{materialType}</p>}</div>{material.offline && <span className="offline-badge">Offline</span>}{materialUrl && <a className="download-btn" href={materialUrl} target="_blank" rel="noreferrer" aria-label={`Open ${materialTitle}`}><Download size={17} /></a>}</div>
        })}</div>}
      </section>}

      {activeTab === 'discussion' && <section className="detail-section course-discussions-section">
        <div className="section-header">
          <div><h3>Course discussion</h3><span className="discussion-section-count">{courseDiscussions.length} threads</span></div>
          <button type="button" className="start-discussion-btn" onClick={() => { setShowDiscussionForm((isOpen) => !isOpen); setDiscussionError('') }}><MessageSquare size={16} />{showDiscussionForm ? 'Cancel' : 'Start discussion'}</button>
        </div>
        {discussionError && <div className="course-message error" role="alert">{discussionError}</div>}
        {discussionNotice && <div className="course-message" role="status">{discussionNotice}</div>}
        {showDiscussionForm && <form className="course-discussion-form" onSubmit={handleCreateDiscussion}>
          <label htmlFor="course-discussion-title">Title</label>
          <input id="course-discussion-title" value={newDiscussionTitle} onChange={(event) => setNewDiscussionTitle(event.target.value)} disabled={creatingDiscussion} required />
          <label htmlFor="course-discussion-content">Message</label>
          <textarea id="course-discussion-content" rows="4" value={newDiscussionContent} onChange={(event) => setNewDiscussionContent(event.target.value)} disabled={creatingDiscussion} required />
          <button className="upload-submit" type="submit" disabled={creatingDiscussion}><MessageSquare size={16} />{creatingDiscussion ? 'Posting...' : 'Post discussion'}</button>
        </form>}
        {discussionLoading ? <div className="materials-empty" role="status">Loading course discussions...</div> : courseDiscussions.length ? <div className="course-related-list">{courseDiscussions.map((post) => <Link to={`/discussions/${post.id ?? post._id}`} state={{ courseId: id, courseTitle: displayedCourse.code || displayedCourse.title }} className="course-related-item discussion-list-item" key={post.id ?? post._id}><MessageSquare size={18} /><div><strong>{post.title || 'Discussion thread'}</strong><p>{post.content || ''}</p><span>{getAuthorName(post.author || post.authorName)} · {post.replies?.length ?? post.replyCount ?? 0} replies</span></div></Link>)}</div> : <div className="discussion-empty-state"><MessageSquare size={28} /><p>No discussions for this course yet.</p><button type="button" className="start-discussion-btn" onClick={() => { setShowDiscussionForm(true); setDiscussionError('') }}>Start discussion</button></div>}
      </section>}

      {activeTab === 'people' && <section className="detail-section"><div className="section-header"><h3>{user?.role === 'tutor' ? 'Students in this course' : 'Classmates'}</h3><span className="material-count">{Array.isArray(people) ? people.length : 0}</span></div><div className="course-people-list"><div className="course-person tutor-person"><div className="person-avatar">{tutorName.slice(0, 1).toUpperCase()}</div><div><strong>{tutorName}</strong><span>Course tutor</span></div></div>{Array.isArray(people) && people.filter((person) => person && (typeof person === 'object' || typeof person === 'string')).map((person, index) => { const name = typeof person === 'string' ? person : person.name || person.fullName; if (!name || name === tutorName) return null; return <div className="course-person" key={person.id ?? person._id ?? person.email ?? `${name}-${index}`}><div className="person-avatar">{name.slice(0, 1).toUpperCase()}</div><div><strong>{name}</strong><span>{person.role === 'tutor' ? 'Tutor' : 'Student'}</span></div></div> })}</div>{(!Array.isArray(people) || people.length === 0) && <div className="materials-empty">No student roster is available for this course yet.</div>}</section>}

      {activeTab === 'groups' && <section className="detail-section"><div className="section-header"><h3>Course groups</h3><span className="material-count">{courseGroups.length}</span></div>{courseGroups.length ? <div className="course-related-list">{courseGroups.map((group) => <Link to={`/groups/${group.id ?? group._id}`} className="course-related-item" key={group.id ?? group._id}><Users size={18} /><div><strong>{group.name || 'Study group'}</strong><span>{Number(group.membersCount ?? group.members?.length) || 0} members</span></div></Link>)}</div> : <div className="materials-empty">No study groups are linked to this course.</div>}</section>}
    </div>
  )
}

export default CourseDetail
