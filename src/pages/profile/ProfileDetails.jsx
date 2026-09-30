import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, Save, Shield, User } from 'lucide-react'
import { updateProfile } from '../../api/auth'
import useAuthStore from '../../stores/useAuthStore'
import './Profile.css'

function ProfileDetails({ accountType }) {
  const { user, logout, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [level, setLevel] = useState(user?.level || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const handleLogout = () => { logout(); navigate('/login') }
  const isStudent = user?.role === 'student'
  const initials = (user?.name || 'User').trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      name: name.trim(),
      username: username.trim(),
      bio: bio.trim(),
      department: department.trim(),
      ...(isStudent ? { level: level.trim() } : {})
    }

    if (!payload.name || !payload.username) {
      setSuccess('')
      setError('Name and username are required.')
      return
    }

    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const response = await updateProfile(payload)
      const updatedUser = response?.user || response?.data || response
      updateUser({ ...payload, ...(updatedUser && typeof updatedUser === 'object' ? updatedUser : {}) })
      setSuccess('Profile updated successfully.')
    } catch (requestError) {
      const responseData = requestError.response?.data
      setError(typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error || 'Unable to update your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar">{initials || 'U'}</div>
        <h1>{user?.name || accountType || 'Profile'}</h1>
        <p>{user?.bio || `${accountType || 'User'} profile`}</p>
      </div>

      <div className="profile-card profile-summary">
        <div className="profile-item"><User size={18} /><div><span className="label">Username</span><p>{user?.username || 'Not set'}</p></div></div>
        <div className="profile-item"><Mail size={18} /><div><span className="label">Email</span><p>{user?.email || 'Not available'}</p></div></div>
        <div className="profile-item"><Shield size={18} /><div><span className="label">Role</span><p>{user?.role || accountType || 'Not specified'}</p></div></div>
      </div>

      <form className="profile-card profile-form" onSubmit={handleSubmit}>
        <div className="profile-form-header"><h2>Edit Profile</h2><p>Keep your learning profile up to date.</p></div>
        {error && <div className="profile-message error">{error}</div>}
        {success && <div className="profile-message success">{success}</div>}
        <label>Full Name<input value={name} onChange={(event) => setName(event.target.value)} disabled={saving} /></label>
        <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} disabled={saving} /></label>
        <label>Email<input value={user?.email || ''} readOnly /></label>
        <label>Role<input value={user?.role || accountType || ''} readOnly /></label>
        <label>Bio<textarea rows="3" value={bio} onChange={(event) => setBio(event.target.value)} disabled={saving} placeholder="Tell your classmates a little about yourself" /></label>
        <label>Department<input value={department} onChange={(event) => setDepartment(event.target.value)} disabled={saving} placeholder="e.g. Computer Science" /></label>
        {isStudent && <label>Level<input value={level} onChange={(event) => setLevel(event.target.value)} disabled={saving} placeholder="e.g. 300 level" /></label>}
        <button className="save-profile-btn" type="submit" disabled={saving}><Save size={17} />{saving ? 'Saving...' : 'Save changes'}</button>
      </form>

      <button className="logout-btn" onClick={handleLogout}><LogOut size={18} />Logout</button>
    </div>
  )
}

export default ProfileDetails
