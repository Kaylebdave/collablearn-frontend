import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Upload } from 'lucide-react'
import { getCourseById, uploadCourseMaterial } from '../api/courses'
import useAuthStore from '../stores/useAuthStore'
import useConnectivityStore from '../stores/useConnectivityStore'
import useCourseStore from '../stores/useCourseStore'
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

  const loadCourse = async () => {
    if (!isOnline) {
      setCourse(localCourse)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError('')

    try {
      const response = await getCourseById(id)
      const fetchedCourse = getCourseFromResponse(response)

      if (!fetchedCourse || typeof fetchedCourse !== 'object') {
        throw new Error('Invalid course response')
      }

      setCourse(fetchedCourse)
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

    if (!isOnline) return () => { active = false }

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

        if (active) setCourse(fetchedCourse)
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
  }, [id, isOnline, localCourse])

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
      await uploadCourseMaterial(id, formData)
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
          <p>{displayText(displayedCourse.lecturer, 'Lecturer not specified')}</p>
        </div>
      </section>

      <section className="detail-section">
        <h3>Description</h3>
        <p>{displayText(displayedCourse.description, 'No description available.')}</p>
      </section>

      {user?.role === 'tutor' && (
        <section className="detail-section upload-section">
          <h3>Upload Material</h3>
          {uploadError && <p className="form-error">{uploadError}</p>}
          <form className="upload-form" onSubmit={handleUpload}>
            <label htmlFor="material-title">Title</label>
            <input
              id="material-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={uploading}
              required
            />
            <label htmlFor="material-file">File</label>
            <input
              id="material-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              disabled={uploading}
              required
            />
            <button className="upload-submit" type="submit" disabled={uploading}>
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Upload material'}
            </button>
          </form>
        </section>
      )}

      <section className="detail-section">
        <div className="section-header">
          <h3>Materials</h3>
          <span className="material-count">{materials.length}</span>
        </div>

        {materials.length === 0 ? (
          <div className="materials-empty">No materials available yet.</div>
        ) : (
          <div className="materials-list">
            {materials.map((material) => {
              if (!material || typeof material !== 'object') return null

              const materialTitle = displayText(material.title, 'Untitled material')
              const materialType = displayText(material.fileType, '')
              const materialUrl = typeof material.fileUrl === 'string' ? material.fileUrl : ''

              return (
                <div className="material-item" key={material.id || material.fileUrl}>
                  <div className="material-icon">
                    <FileText size={18} />
                  </div>
                  <div className="material-info">
                    <h4>{materialTitle}</h4>
                    {materialType && <p>{materialType}</p>}
                  </div>
                  {material.offline && <span className="offline-badge">Offline</span>}
                  {materialUrl && (
                    <a
                      className="download-btn"
                      href={materialUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${materialTitle}`}
                    >
                      <Download size={17} />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default CourseDetail
