import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, Shield, User } from 'lucide-react'
import useAuthStore from '../../stores/useAuthStore'
import './Profile.css'

function ProfileDetails({ accountType, description }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return <div className="profile-page"><div className="profile-header"><div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div><h1>{user?.name || accountType}</h1><p>{description}</p></div><div className="profile-card"><div className="profile-item"><User size={18} /><div><span className="label">Full Name</span><p>{user?.name || '—'}</p></div></div><div className="profile-item"><Mail size={18} /><div><span className="label">Email</span><p>{user?.email || '—'}</p></div></div><div className="profile-item"><Shield size={18} /><div><span className="label">Account Type</span><p>{accountType}</p></div></div></div><button className="logout-btn" onClick={handleLogout}><LogOut size={18} />Logout</button></div>
}

export default ProfileDetails
