import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CloudOff,
  Download,
  FileText,
  Link as LinkIcon,
  Send,
  Upload,
  UserMinus,
  UserPlus,
  Users
} from 'lucide-react'
import { getGroupById } from '../api/groups'
import useAuthStore from '../stores/useAuthStore'
import useConnectivityStore from '../stores/useConnectivityStore'
import useGroupStore from '../stores/useGroupStore'
import './GroupDetail.css'

const getGroup = (response) => response?.group || response?.data?.group || response?.data || response

const getErrorMessage = (requestError, fallback) => {
  const responseData = requestError?.response?.data
  if (typeof responseData === 'string') return responseData
  return responseData?.message || responseData?.error || requestError?.message || fallback
}

const getMember = (member, index) => {
  if (typeof member === 'string') return { id: `${member}-${index}`, name: member, role: 'Member' }
  if (!member || typeof member !== 'object') return null
  return {
    id: member.id || member._id || `${member.name || 'member'}-${index}`,
    name: member.name || member.email || 'Unknown member',
    role: member.role || 'Member',
    status: member.status
  }
}

const getInitials = (name) => name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
const getMembers = (group) => (Array.isArray(group.members) ? group.members : []).map(getMember).filter(Boolean)
const getLocalId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`

function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const groups = useGroupStore((state) => state.groups) || []
  const updateGroup = useGroupStore((state) => state.updateGroup)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [postText, setPostText] = useState('')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceFile, setResourceFile] = useState(null)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const group = groups.find((item) => String(item.id) === String(id))
  const members = group ? getMembers(group) : []
  const currentUserName = user?.name?.trim() || ''
  const isMember = members.some((member) => member.name.toLowerCase() === currentUserName.toLowerCase())
  const resources = group && Array.isArray(group.resources) ? group.resources : []
  const posts = group && Array.isArray(group.posts) ? group.posts : []
  const memberCount = members.length || Number(group?.membersCount ?? group?.memberCount) || 0
  const resourceCount = resources.length || Number(group?.resourcesCount) || 0

  useEffect(() => {
    if (!isOnline) return
    let active = true
    Promise.resolve().then(() => {
      if (!active) return null
      setLoading(true)
      setError('')
      return getGroupById(id)
        .then((response) => {
          const remoteGroup = getGroup(response)
          if (!remoteGroup || typeof remoteGroup !== 'object') throw new Error('Invalid group response')
          if (active) updateGroup(remoteGroup)
        })
        .catch((requestError) => {
          console.warn('Failed to load group details', {
            status: requestError?.response?.status,
            message: getErrorMessage(requestError, 'Request failed')
          })
          if (active) setError(getErrorMessage(requestError, 'Unable to load this group.'))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    })
    return () => { active = false }
  }, [id, isOnline, updateGroup])

  const updateLocalGroup = (changes) => {
    if (!group) return
    updateGroup({
      ...group,
      ...changes,
      ...(Object.hasOwn(changes, 'members') ? { membersPending: true } : {}),
      localChangesPending: true
    })
  }

  const handleMembership = () => {
    if (!currentUserName) {
      setError('Sign in with a name before joining this group.')
      return
    }
    const nextMembers = isMember
      ? members.filter((member) => member.name.toLowerCase() !== currentUserName.toLowerCase())
      : [...members, { id: getLocalId('local-member'), name: currentUserName, role: 'Member', status: 'pending' }]
    updateLocalGroup({ members: nextMembers })
  }

  const handleResourceUpload = (event) => {
    event.preventDefault()
    if (!resourceTitle.trim() || !resourceFile) return
    const resource = {
      id: getLocalId('local-resource'),
      title: resourceTitle.trim(),
      size: `${Math.max(1, Math.round(resourceFile.size / 1024))} KB`,
      fileUrl: URL.createObjectURL(resourceFile),
      localOnly: true,
      status: 'pending'
    }
    updateLocalGroup({ resources: [...resources, resource] })
    setResourceTitle('')
    setResourceFile(null)
    setShowResourceForm(false)
    event.currentTarget.reset()
  }

  const handlePost = (event) => {
    event.preventDefault()
    if (!currentUserName) {
      setError('Sign in with a name before posting.')
      return
    }
    if (!isMember) {
      setError('Join this group before posting.')
      return
    }
    if (!postText.trim()) return
    setError('')
    updateLocalGroup({
      posts: [...posts, { id: getLocalId('local-post'), author: currentUserName, content: postText.trim(), time: 'Just now', localOnly: true, status: 'pending' }]
    })
    setPostText('')
  }

  if (isOnline && loading && !group) return <div className="group-detail-page"><div className="course-message">Loading group...</div></div>

  if (!group) return <div className="group-detail-page"><div className="not-found"><h2>Study Group not found</h2><p>{error || 'The requested group could not be loaded.'}</p><button onClick={() => navigate('/groups')}>Back to Groups</button></div></div>

  return (
    <div className="group-detail-page">
      <div className="detail-top"><button className="back-btn" onClick={() => navigate('/groups')} aria-label="Back to groups"><ArrowLeft size={20} /></button><h1>Study Group</h1></div>
      {!isOnline && <div className="offline-state"><CloudOff size={16} /><span>Offline mode. Local group updates stay visible on this device.</span></div>}
      {error && <div className="courses-message error">{error}</div>}

      <section className="group-hero">
        <div className="hero-icon"><Users size={28} /></div>
        <div className="hero-content">
          <div className="hero-top"><span className="group-course">{group.course || 'Course not specified'}</span>{['pending', 'syncing', 'failed'].includes(group.status) && <span className="pending-badge"><Clock size={12} />{group.status === 'pending' ? 'Pending sync' : group.status === 'syncing' ? 'Syncing' : 'Sync failed'}</span>}{group.localChangesPending && <span className="local-change-badge">Local changes</span>}</div>
          <h2>{group.name || 'Untitled group'}</h2>
          <div className="hero-stats"><span><Users size={14} />{memberCount} members</span><span><FileText size={14} />{resourceCount} resources</span></div>
        </div>
        <button className="join-btn hero-action" type="button" onClick={handleMembership} aria-pressed={isMember}>{isMember ? <UserMinus size={16} /> : <UserPlus size={16} />}{isMember ? 'Leave group' : 'Join group'}</button>
      </section>

      <section className="detail-section description-section"><h3>About this group</h3><p>{group.description || 'No description available yet.'}</p></section>

      <section className="detail-section">
        <div className="section-header"><h3>Members</h3><div className="section-meta">{group.membersPending && <span className="local-change-badge">Membership pending</span>}<span className="section-count">{memberCount}</span></div></div>
        {members.length === 0 ? <div className="empty-resources">No members yet.</div> : <div className="members-list">{members.map((member) => <div key={member.id} className="member-item"><div className="member-avatar">{getInitials(member.name)}</div><div className="member-info"><h4>{member.name}</h4><span>{member.role}</span></div>{member.status === 'pending' && <span className="item-pending">Pending</span>}</div>)}</div>}
      </section>

      <section className="detail-section">
        <div className="section-header"><div><h3>Shared Resources</h3><p className="section-subtitle">Notes and files for the group</p></div><button className="section-action" type="button" onClick={() => setShowResourceForm((visible) => !visible)}><Upload size={15} />Upload</button></div>
        {showResourceForm && <form className="resource-form" onSubmit={handleResourceUpload}><label htmlFor="resource-title">Title</label><input id="resource-title" value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} placeholder="Resource title" required /><label htmlFor="resource-file">File</label><input id="resource-file" type="file" onChange={(event) => setResourceFile(event.target.files?.[0] || null)} required /><p className="local-resource-note">Resource uploads are saved locally until a group upload endpoint is available.</p><button className="submit-btn" type="submit">Add resource</button></form>}
        {resources.length === 0 ? <div className="empty-resources">No resources shared yet. Upload the first one.</div> : <div className="resources-list">{resources.map((item, index) => <div key={item.id || `${item.title}-${index}`} className="resource-item"><div className="resource-icon"><FileText size={18} /></div><div className="resource-info"><h4>{item.title || 'Untitled resource'}</h4><p>{item.size || 'Size unavailable'}{item.status === 'pending' && ' · Pending'}</p></div>{item.fileUrl ? <a className="download-btn" href={item.fileUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.title || 'resource'}`}><LinkIcon size={16} /></a> : item.url ? <a className="download-btn" href={item.url} target="_blank" rel="noreferrer" aria-label={`Download ${item.title || 'resource'}`}><Download size={16} /></a> : <span className="resource-unavailable">Unavailable</span>}</div>)}</div>}
      </section>

      <section className="detail-section posts-section">
        <div className="section-header"><div><h3>Group Posts</h3><p className="section-subtitle">Keep the conversation moving</p></div><span className="section-count">{posts.length}</span></div>
        {posts.length === 0 ? <div className="empty-resources">No posts yet. Start the conversation.</div> : <div className="group-posts">{posts.map((post, index) => <article key={post.id || index} className="group-post"><div className="post-avatar">{getInitials(post.author || 'User')}</div><div className="post-content"><div className="post-heading"><strong>{post.author || 'Unknown member'}</strong><span>{post.time || 'Recently'}{post.status === 'pending' && ' · Pending'}</span></div><p>{post.content || 'No content.'}</p></div></article>)}</div>}
        <form className="post-form" onSubmit={handlePost}><input value={postText} onChange={(event) => setPostText(event.target.value)} placeholder={isMember ? 'Write a group post...' : 'Join the group to post'} aria-label="Write a group post" disabled={!isMember} /><button type="submit" aria-label="Send group post" disabled={!isMember || !postText.trim()}><Send size={17} /></button></form>
      </section>
    </div>
  )
}

export default GroupDetail
