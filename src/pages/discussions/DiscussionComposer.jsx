import { useState } from 'react'
import { X } from 'lucide-react'
import { createDiscussion } from '../../api/discussions'
import useAuthStore from '../../stores/useAuthStore'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useDiscussionStore from '../../stores/useDiscussionStore'
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
  const enqueue = useSyncStore((state) => state.enqueue)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [course, setCourse] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      title: title.trim(),
      content: content.trim(),
      author: user?.name?.trim() || '',
      course: course.trim()
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
        addPost(createdDiscussion, true)
      } else {
        const localDiscussion = addPost(payload, false)
        enqueue('CREATE_DISCUSSION', payload, localDiscussion.id)
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
        const localDiscussion = addPost(payload, false)
        enqueue('CREATE_DISCUSSION', payload, localDiscussion.id)
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
          {field('course', 'Course', course, setCourse)}
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