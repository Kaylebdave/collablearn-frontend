import { useState } from 'react'
import { X } from 'lucide-react'
import { createDiscussion } from '../../api/discussions'
import useAuthStore from '../../stores/useAuthStore'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useDiscussionStore from '../../stores/useDiscussionStore'
import useCourseStore from '../../stores/useCourseStore'
import useSyncStore from '../../stores/useSyncStore'
import { isNetworkFailure } from '../../services/syncEngine'

const getResponseMessage = (requestError, fallback) => {
  const responseData = requestError?.response?.data
  if (typeof responseData === 'string') return responseData
  return responseData?.message || responseData?.error || requestError?.message || fallback
}

const getCreatedDiscussion = (response) => response?.discussion || response?.data?.discussion || response?.data || response

function DiscussionComposer({ onClose, onCreated }) {
  const user = useAuthStore((state) => state.user)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const addPost = useDiscussionStore((state) => state.addPost)
  const courses = useCourseStore((state) => state.courses)
  const enqueue = useSyncStore((state) => state.enqueue)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [courseId, setCourseId] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!user?.id) {
      setError('Please login again')
      return
    }

    const selectedCourse = courses.find((item) => String(item.id ?? item._id) === String(courseId))
    const payload = {
      title: title.trim(),
      content: content.trim(),
      courseId: selectedCourse?.id ?? selectedCourse?._id,
      userId: user.id
    }
    const localPostData = {
      ...payload,
      course: selectedCourse?.code || selectedCourse?.title || selectedCourse?.name || '',
      author: user.name?.trim() || ''
    }
    const nextErrors = Object.fromEntries(
      Object.entries(payload)
        .filter(([, value]) => !value)
        .map(([field]) => [field, `${field[0].toUpperCase()}${field.slice(1)} is required.`])
    )

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setError('')
    setSaving(true)

    try {
      if (isOnline) {
        const createdDiscussion = getCreatedDiscussion(await createDiscussion(payload))
        if (!createdDiscussion || typeof createdDiscussion !== 'object') {
          setError('Discussion was created, but the server returned an invalid response.')
          return
        }
        addPost({ ...localPostData, ...createdDiscussion, author: createdDiscussion.author ?? localPostData.author }, true)
      } else {
        const localDiscussion = addPost(localPostData, false)
        enqueue('CREATE_DISCUSSION', localPostData, localDiscussion.id)
      }
      onCreated?.()
      onClose()
    } catch (requestError) {
      console.error('Failed to create discussion', {
        status: requestError?.response?.status,
        response: requestError?.response?.data,
        message: getResponseMessage(requestError, 'Request failed')
      })
      if (isNetworkFailure(requestError)) {
        const localDiscussion = addPost(localPostData, false)
        enqueue('CREATE_DISCUSSION', localPostData, localDiscussion.id)
        onCreated?.()
        onClose()
      } else {
        setError(getResponseMessage(requestError, 'Unable to create discussion.'))
      }
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field, setter) => (event) => {
    setter(event.target.value)
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: '' }))
  }

  const field = (name, label, value, setter, multiline = false) => {
    const id = `discussion-${name}`
    const errorId = `${id}-error`
    const inputProps = {
      id,
      value,
      onChange: updateField(name, setter),
      'aria-invalid': Boolean(fieldErrors[name]),
      'aria-describedby': fieldErrors[name] ? errorId : undefined
    }

    return (
      <div className="form-group" key={name}>
        <label htmlFor={id}>{label}</label>
        {multiline ? <textarea {...inputProps} rows="4" /> : <input {...inputProps} />}
        {fieldErrors[name] && <p id={errorId} className="field-error">{fieldErrors[name]}</p>}
      </div>
    )
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-discussion-title">
        <div className="modal-header">
          <h2 id="new-discussion-title">New Discussion</h2>
          <button type="button" aria-label="Close" onClick={onClose} disabled={saving}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {field('title', 'Title', title, setTitle)}
          <div className="form-group">
            <label htmlFor="discussion-course">Course</label>
            <select id="discussion-course" value={courseId} onChange={updateField('courseId', setCourseId)} aria-invalid={Boolean(fieldErrors.courseId)} required>
              <option value="">Select a course</option>
              {courses.map((item) => <option key={item.id ?? item._id} value={item.id ?? item._id}>{item.code || item.title || item.name || 'Course'}</option>)}
            </select>
            {fieldErrors.courseId && <p className="field-error">Select a course.</p>}
          </div>
          {field('content', 'Message', content, setContent, true)}
          <div className="form-group"><label htmlFor="discussion-author">Author</label><input id="discussion-author" value={user?.name || ''} readOnly /></div>
          {error && <p className="form-error">{error}</p>}
          {!isOnline && <div className="offline-note">You are offline. This discussion will be saved and synced later.</div>}
          <button className="submit-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create discussion'}</button>
        </form>
      </div>
    </div>
  )
}

export default DiscussionComposer