import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Plus, Search, Users } from 'lucide-react'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useGroupStore from '../../stores/useGroupStore'
import useSyncStore from '../../stores/useSyncStore'
import './Groups.css'

const courseOptions = ['CSC 301', 'CSC 205', 'MTH 201', 'CSC 401']

function StudentGroups() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [course, setCourse] = useState(courseOptions[0])
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const { groups, addGroup } = useGroupStore()
  const setGroupSyncStatus = useGroupStore((state) => state.setGroupSyncStatus)
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const enqueue = useSyncStore((state) => state.enqueue)
  const syncNow = useSyncStore((state) => state.syncNow)
  const filteredGroups = groups.filter((group) => `${group.name} ${group.course}`.toLowerCase().includes(search.toLowerCase()))
  const createGroup = (event) => {
    event.preventDefault()
    if (!name.trim() || !description.trim()) return
    const payload = { name: name.trim(), course, description: description.trim() }
    const localGroup = addGroup(payload, false)
    setError('')
    try {
      enqueue('CREATE_GROUP', payload, localGroup.id)
      if (isOnline) syncNow()
    } catch (queueError) {
      setGroupSyncStatus(localGroup.id, 'failed')
      setError(queueError?.message || 'Group saved locally but could not be queued for sync.')
    }
    setName('')
    setDescription('')
    setShowModal(false)
  }

  return <div className="groups-page"><div className="groups-header"><div><h1>Study Groups</h1><p>Join or create a group with classmates</p></div><button className="new-group-btn" onClick={() => setShowModal(true)}><Plus size={18} />New Group</button></div><div className="search-bar"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search study groups..." /></div>{error && <div className="courses-message error">{error}</div>}<div className="groups-list">{filteredGroups.map((group) => <Link to={`/groups/${group.id}`} key={group.id} className="group-card"><div className="group-top"><div className="group-icon"><Users size={20} /></div><div className="group-info"><div className="group-title-row"><h3>{group.name}</h3>{['pending', 'syncing', 'failed'].includes(group.status) && <span className="pending-badge"><Clock size={12} />{group.status === 'pending' ? 'Pending' : group.status === 'syncing' ? 'Syncing' : 'Sync failed'}</span>}</div><span className="group-course">{group.course}</span></div></div><p className="group-description">{group.description}</p><div className="group-footer"><span className="members"><Users size={14} />{group.members?.length || 0} members</span><span className="view-text">Join group</span></div></Link>)}</div>{filteredGroups.length === 0 && <div className="empty-state"><Users size={40} /><p>No study groups found</p></div>}{showModal && <GroupModal close={() => setShowModal(false)} createGroup={createGroup} name={name} setName={setName} course={course} setCourse={setCourse} description={description} setDescription={setDescription} isOnline={isOnline} />}</div>
}

function GroupModal({ close, createGroup, name, setName, course, setCourse, description, setDescription, isOnline }) {
  return <div className="modal-overlay"><div className="modal"><div className="modal-header"><h2>Create Study Group</h2><button type="button" aria-label="Close" onClick={close}>×</button></div><form onSubmit={createGroup}><div className="form-group"><label>Group Name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter group name" /></div><div className="form-group"><label>Course</label><select value={course} onChange={(event) => setCourse(event.target.value)}>{courseOptions.map((option) => <option key={option}>{option}</option>)}</select></div><div className="form-group"><label>Description</label><textarea rows="3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this group about?" /></div>{!isOnline && <div className="offline-note">You are offline. This group will be saved and synced later.</div>}<button className="submit-btn" type="submit">{isOnline ? 'Create Group' : 'Save Offline'}</button></form></div></div>
}

export default StudentGroups
