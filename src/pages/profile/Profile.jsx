import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  FileText,
  GitBranch,
  GraduationCap,
  LogOut,
  Mail,
  MessageSquare,
  Save,
  Settings,
  Shield,
  Users,
  X
} from 'lucide-react'
import { changePassword, updateProfile } from '../../api/auth'
import useAuthStore from '../../stores/useAuthStore'
import useCourseStore from '../../stores/useCourseStore'
import useDiscussionStore from '../../stores/useDiscussionStore'
import useGroupStore from '../../stores/useGroupStore'
import './Profile.css'

const getInitials = (name) => name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'

const getErrorMessage = (requestError, fallback = 'Unable to update your profile.') => {
  const responseData = requestError.response?.data
  return typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error || fallback
}

function Profile() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)
  const courses = useCourseStore((state) => state.courses) || []
  const groups = useGroupStore((state) => state.groups) || []
  const discussions = useDiscussionStore((state) => state.posts) || []
  const [showEditor, setShowEditor] = useState(false)
  const [showPasswordEditor, setShowPasswordEditor] = useState(false)
  const [notice, setNotice] = useState('')

  const isStudent = user?.role === 'student'
  const roleLabel = isStudent ? 'Student' : 'Tutor'
  const materials = courses.reduce((total, course) => total + (Array.isArray(course.materials) ? course.materials.length : Number(course.materials) || 0), 0)
  const stats = isStudent
    ? [{ label: 'Courses', value: courses.length, icon: BookOpen }, { label: 'Groups', value: groups.length, icon: Users }, { label: 'Discussions', value: discussions.length, icon: MessageSquare }]
    : [{ label: 'Courses', value: courses.length, icon: BookOpen }, { label: 'Materials', value: materials, icon: FileText }, { label: 'Groups', value: groups.length, icon: Users }]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSetting = (setting) => {
    if (setting === 'edit') {
      setNotice('')
      setShowEditor(true)
    } else if (setting === 'sync') {
      navigate('/sync')
    } else if (setting === 'password') {
      setNotice('')
      setShowPasswordEditor(true)
    }
  }

  if (!user) {
    return <div className="profile-page"><div className="profile-empty"><Shield size={28} /><h1>Profile unavailable</h1><p>Sign in to view your profile settings.</p></div></div>
  }

  return (
    <div className="profile-page">
      <section className="profile-hero-card">
        <div className="profile-avatar">{getInitials(user.name || 'User')}</div>
        <div className="profile-identity"><h1>{user.name || 'Unnamed user'}</h1><p className="profile-username">@{user.username || 'username-not-set'}</p><span className="role-badge"><GraduationCap size={14} />{roleLabel}</span><p className="profile-bio">{user.bio || 'No bio added yet.'}</p></div>
        <button className="edit-profile-btn" type="button" onClick={() => handleSetting('edit')}><Settings size={16} />Edit Profile</button>
      </section>

      <section className="profile-stats" aria-label="Profile statistics">{stats.map(({ label, value, icon: Icon }) => <div className="profile-stat" key={label}><Icon size={18} /><strong>{value}</strong><span>{label}</span></div>)}</section>

      <section className="profile-panel about-panel"><div className="panel-heading"><div><span className="eyebrow">Your account</span><h2>About</h2></div><Shield size={18} /></div><div className="about-grid"><AboutItem icon={GraduationCap} label="Department" value={user.department} /><AboutItem icon={Mail} label="Email" value={user.email} /><AboutItem icon={Shield} label="Role" value={roleLabel} />{isStudent && <AboutItem icon={BookOpen} label="Level" value={user.level} />}</div></section>

      <section className="profile-panel settings-panel"><div className="panel-heading"><div><span className="eyebrow">Preferences</span><h2>Settings</h2></div><Settings size={18} /></div><SettingButton icon={Settings} label="Edit Profile" onClick={() => handleSetting('edit')} /><SettingButton icon={Shield} label="Change Password" onClick={() => handleSetting('password')} /><SettingButton icon={GitBranch} label="Offline & Sync" description="Manage pending changes" onClick={() => handleSetting('sync')} /><button className="setting-row logout-row" type="button" onClick={handleLogout}><LogOut size={18} /><span>Logout</span><ChevronRight size={17} /></button></section>

      {notice && <div className="profile-notice">{notice}</div>}
      {showEditor && <ProfileEditor user={user} isStudent={isStudent} onClose={() => setShowEditor(false)} onSaved={(message) => { setNotice(message); setShowEditor(false) }} onError={setNotice} updateUser={updateUser} />}
      {showPasswordEditor && <PasswordEditor userId={user.id} onClose={() => setShowPasswordEditor(false)} onSaved={(message) => { setNotice(message); setShowPasswordEditor(false) }} />}
    </div>
  )
}

function AboutItem({ icon: Icon, label, value }) {
  return <div className="about-item"><Icon size={17} /><div><span>{label}</span><strong>{value || 'Not set'}</strong></div></div>
}

function SettingButton({ icon: Icon, label, description, onClick }) {
  return <button className="setting-row" type="button" onClick={onClick}><Icon size={18} /><span className="setting-copy"><strong>{label}</strong>{description && <small>{description}</small>}</span><ChevronRight size={17} /></button>
}

function ProfileEditor({ user, isStudent, onClose, onSaved, onError, updateUser }) {
  const [form, setForm] = useState({ name: user.name || '', username: user.username || '', bio: user.bio || '', department: user.department || '', level: user.level || '', institution: user.institution || '' })
  const [saving, setSaving] = useState(false)

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.username.trim()) {
      onError('Name and username are required.')
      return
    }
    const payload = { name: form.name.trim(), username: form.username.trim(), bio: form.bio.trim(), department: form.department.trim(), level: isStudent ? form.level.trim() : '', institution: form.institution.trim() }
    setSaving(true)
    try {
      const response = await updateProfile(user.id, payload)
      const serverUser = response?.user || response?.data || response
      updateUser({ ...payload, ...(serverUser && typeof serverUser === 'object' ? serverUser : {}) })
      onSaved('Profile updated successfully.')
    } catch (requestError) {
      onError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return <div className="profile-modal-overlay"><div className="profile-editor" role="dialog" aria-modal="true" aria-labelledby="edit-profile-heading"><div className="editor-heading"><div><span className="eyebrow">Account settings</span><h2 id="edit-profile-heading">Edit Profile</h2></div><button type="button" onClick={onClose} aria-label="Close edit profile"><X size={19} /></button></div><form onSubmit={handleSubmit}><div className="editor-grid"><label>Name<input value={form.name} onChange={updateField('name')} disabled={saving} /></label><label>Username<input value={form.username} onChange={updateField('username')} disabled={saving} /></label><label>Email<input value={user.email || ''} readOnly /></label><label>Role<input value={user.role || ''} readOnly /></label><label className="wide-field">Bio<textarea rows="3" value={form.bio} onChange={updateField('bio')} disabled={saving} placeholder="Tell people about yourself" /></label><label>Department<input value={form.department} onChange={updateField('department')} disabled={saving} /></label><label>Institution<input value={form.institution} onChange={updateField('institution')} disabled={saving} /></label>{isStudent && <label>Level<input value={form.level} onChange={updateField('level')} disabled={saving} /></label>}</div><button className="save-profile-btn" type="submit" disabled={saving}><Save size={17} />{saving ? 'Saving...' : 'Save changes'}</button></form></div></div>
}

function PasswordEditor({ userId, onClose, onSaved }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError('All password fields are required.')
      return
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation must match.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await changePassword(userId, { oldPassword: form.oldPassword, newPassword: form.newPassword })
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      onSaved('Password changed successfully')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to change your password.'))
    } finally {
      setSaving(false)
    }
  }

  return <div className="profile-modal-overlay"><div className="profile-editor" role="dialog" aria-modal="true" aria-labelledby="change-password-heading"><div className="editor-heading"><div><span className="eyebrow">Account security</span><h2 id="change-password-heading">Change Password</h2></div><button type="button" onClick={onClose} aria-label="Close change password"><X size={19} /></button></div><form onSubmit={handleSubmit} noValidate><div className="editor-grid password-grid"><label>Current password<input type="password" value={form.oldPassword} onChange={updateField('oldPassword')} disabled={saving} autoComplete="current-password" /></label><label>New password<input type="password" value={form.newPassword} onChange={updateField('newPassword')} disabled={saving} autoComplete="new-password" /></label><label>Confirm new password<input type="password" value={form.confirmPassword} onChange={updateField('confirmPassword')} disabled={saving} autoComplete="new-password" /></label></div>{error && <p className="profile-message error">{error}</p>}<button className="save-profile-btn" type="submit" disabled={saving}><Save size={17} />{saving ? 'Changing...' : 'Change password'}</button></form></div></div>
}

export default Profile