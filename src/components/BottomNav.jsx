import { NavLink } from 'react-router-dom'
import { Home, BookOpen, MessageSquare, Users, User } from 'lucide-react'
import './BottomNav.css'

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className="nav-item" end>
        <Home size={22} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/courses" className="nav-item">
        <BookOpen size={22} />
        <span>Courses</span>
      </NavLink>

      <NavLink to="/discussions" className="nav-item">
        <MessageSquare size={22} />
        <span>Discussions</span>
      </NavLink>

      <NavLink to="/groups" className="nav-item">
        <Users size={22} />
        <span>Groups</span>
      </NavLink>

      <NavLink to="/profile" className="nav-item">
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  )
}

export default BottomNav