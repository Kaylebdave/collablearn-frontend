import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Plus, Search, Users } from 'lucide-react'
import { getGroups } from '../../api/groups'
import useAuthStore from '../../stores/useAuthStore'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useGroupStore from '../../stores/useGroupStore'
import useSyncStore from '../../stores/useSyncStore'
import './Groups.css'

const courseOptions = ['CSC 301', 'CSC 205', 'MTH 201', 'CSC 401']

const getGroupList = (response) => {
  const groups = Array.isArray(response)
    ? response
    : response?.groups || response?.data?.groups || response?.data
  return Array.isArray(groups) ? groups : null
}

const getMemberCount = (group) => Array.isArray(group.members) ? group.members.length : Number(group.membersCount || group.memberCount) || 0

function GroupList() {
  const user = useAuthStore((state) => state.user)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const groups = useGroupStore((state) => state.groups)
  const setGroups = useGroupStore((state) => state.setGroups)
  const addGroup = useGroupStore((state) => state.addGroup)
  const setGroupSyncStatus = useGroupStore((state) => state.setGroupSyncStatus)
  const enqueue = useSyncStore((state) => state.enqueue)
  const syncNow = useSyncStore((state) => state.syncNow)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOnline) return

    let active = true
    Promise.resolve().then(() => {
      if (!active) return null
      setLoading(true)
      setError('')
      return getGroups()
        .then((response) => {
          const remoteGroups = getGroupList(response)
          if (!remoteGroups) throw new Error('Invalid groups response')
          if (active) setGroups(remoteGroups)
        })
        .catch((requestError) => {
          console.warn('Failed to load groups', {
            status: requestError?.response?.status,
            message: requestError?.response?.data?.message || requestError?.message
          })
          if (active) setError('Unable to load groups from the server. Showing saved groups.')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    })

    return () => {
      active = false
    }
  }, [isOnline, setGroups])

  const filteredGroups = groups.filter((group) =>
    `${group.name || ''} ${group.course || ''} ${group.description || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const isTutor = user?.role === 'tutor'
  const totalMembers = groups.reduce((total, group) => total + getMemberCount(group), 0)

  return (
    <div className="groups-page">
      <div className="groups-header">
        <div><h1>{isTutor ? 'Study Group Monitor' : 'Study Groups'}</h1><p>{isTutor ? `${groups.length} active groups · ${totalMembers} memberships` : 'Join or create a group with classmates'}</p></div>
        <button className="new-group-btn" type="button" onClick={() => setShowModal(true)}><Plus size={18} />New Group</button>
      </div>
      <div className="search-bar"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search study groups..." /></div>
      {loading && <div className="courses-message">Loading groups...</div>}
      {error && <div className="courses-message error">{error}</div>}
      <div className="groups-list">
        {filteredGroups.map((group) => (
          <Link to={`/groups/${group.id}`} key={group.id} className="group-card">
            <div className="group-top"><div className="group-icon"><Users size={20} /></div><div className="group-info"><div className="group-title-row"><h3>{group.name || 'Untitled group'}</h3>{['pending', 'syncing', 'failed'].includes(group.status) && <span className="pending-badge"><Clock size={12} />{group.status === 'pending' ? 'Pending sync' : group.status === 'syncing' ? 'Syncing' : 'Sync failed'}</span>}</div><span className="group-course">{group.course || 'Course not specified'}</span></div></div>
            <p className="group-description">{group.description || 'No description available.'}</p>
            <div className="group-footer"><span className="members"><Users size={14} />{getMemberCount(group)} members</span><span className="view-text">{isTutor ? 'Monitor group' : 'View group'}</span></div>
          </Link>
        ))}
      </div>
      {!loading && filteredGroups.length === 0 && <div className="empty-state"><Users size={40} /><p>{search ? 'No groups match your search.' : 'No study groups yet.'}</p></div>}
      {showModal && <GroupModal close={() => setShowModal(false)} isOnline={isOnline} user={user} onSaved={() => setShowModal(false)} addGroup={addGroup} enqueue={enqueue} syncNow={syncNow} setGroupSyncStatus={setGroupSyncStatus} />}
    </div>
  )
}

function GroupModal({ close, isOnline, user, onSaved, addGroup, enqueue, syncNow, setGroupSyncStatus }) {
  const [name, setName] = useState('')
  const [course, setCourse] = useState(courseOptions[0])
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      name: name.trim(),
      course: course.trim(),
      description: description.trim(),
      members: user?.name?.trim() ? [user.name.trim()] : []
    }
    const nextErrors = Object.fromEntries(
      Object.entries(payload).filter(([field, value]) => field !== 'members' && !value).map(([field]) => [field, `${field[0].toUpperCase()}${field.slice(1)} is required.`])
    )
    if (payload.members.length === 0) nextErrors.members = 'You must be signed in to create a group.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    const localGroup = addGroup(payload, false)
    let wasQueued = false
    try {
      enqueue('CREATE_GROUP', payload, localGroup.id)
      wasQueued = true
    } catch (queueError) {
      setGroupSyncStatus(localGroup.id, 'failed')
      console.error('Group saved locally but could not be queued for sync', queueError)
    }
    setSaving(false)
    onSaved()
    if (isOnline && wasQueued) syncNow()
  }

  return <div className="modal-overlay"><div className="modal"><div className="modal-header"><h2>Create Study Group</h2><button type="button" aria-label="Close" onClick={close} disabled={saving}>×</button></div><form onSubmit={handleSubmit} noValidate>
    <FormField label="Group Name" value={name} onChange={setName} error={fieldErrors.name} />
    <div className="form-group"><label htmlFor="group-course">Course</label><select id="group-course" value={course} onChange={(event) => setCourse(event.target.value)}>{courseOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
    <FormField label="Description" value={description} onChange={setDescription} error={fieldErrors.description} multiline />
    {!isOnline && <div className="offline-note">You are offline. This group will be saved and synced later.</div>}
    <button className="submit-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : isOnline ? 'Create Group' : 'Save Offline'}</button>
  </form></div></div>
}

function FormField({ label, value, onChange, error, multiline = false }) {
  const id = `group-${label.toLowerCase().replaceAll(' ', '-')}`
  return <div className="form-group"><label htmlFor={id}>{label}</label>{multiline ? <textarea id={id} rows="3" value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} /> : <input id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />}{error && <p className="field-error">{error}</p>}</div>
}

export default GroupList