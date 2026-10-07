import { Link } from 'react-router-dom'
import {
  BookOpen,
  MessageSquare,
  Users,
  Clock,
  Search,
  Bell,
  PlusCircle,
  BarChart3,
  FileText,
  GraduationCap
} from 'lucide-react'
import useAuthStore from '../../stores/useAuthStore'
import './Home.css'

function TutorHome() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="home-page">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search your courses..." />
        </div>
        <button className="notification-btn">
          <Bell size={20} />
        </button>
      </div>

      {/* Welcome Banner */}
      <section className="welcome-banner tutor-banner">
        <div className="welcome-left">
          <h1>Welcome, {user?.name?.split(' ')[0] || 'Tutor'}!</h1>
          <p>
            Manage your courses, track student engagement, and support learning — even offline.
          </p>
          <div className="banner-actions">
            <Link to="/courses" className="banner-btn primary">
              <PlusCircle size={18} />
              Create Course
            </Link>
            <Link to="/discussions" className="banner-btn secondary">
              View Discussions
            </Link>
          </div>
        </div>
        <div className="welcome-right">
          <div className="tutor-badge">
            <GraduationCap size={32} />
            <span>Tutor</span>
          </div>
        </div>
      </section>

      {/* Tutor Stats */}
      <section className="stats-row">
        <Link to="/courses" className="stat-item">
          <div className="stat-icon blue">
            <BookOpen size={18} />
          </div>
          <div>
            <strong>3</strong>
            <span>My Courses</span>
          </div>
        </Link>
        <Link to="/groups" className="stat-item">
          <div className="stat-icon indigo">
            <Users size={18} />
          </div>
          <div>
            <strong>48</strong>
            <span>Students</span>
          </div>
        </Link>
        <Link to="/discussions" className="stat-item">
          <div className="stat-icon violet">
            <MessageSquare size={18} />
          </div>
          <div>
            <strong>15</strong>
            <span>Discussions</span>
          </div>
        </Link>
        <Link to="/sync" className="stat-item">
          <div className="stat-icon amber">
            <Clock size={18} />
          </div>
          <div>
            <strong>2</strong>
            <span>Pending Sync</span>
          </div>
        </Link>
      </section>

      {/* Quick Actions */}
      <section className="section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="tutor-actions">
          <Link to="/courses" className="tutor-action-card">
            <PlusCircle size={24} />
            <span>Create New Course</span>
          </Link>
          <Link to="/discussions" className="tutor-action-card">
            <MessageSquare size={24} />
            <span>Moderate Discussions</span>
          </Link>
          <Link to="/groups" className="tutor-action-card">
            <Users size={24} />
            <span>View Study Groups</span>
          </Link>
          <Link to="/sync" className="tutor-action-card">
            <BarChart3 size={24} />
            <span>Sync Status</span>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="section">
        <div className="section-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="activity-card">
          <div className="activity-row">
            <div className="activity-icon blue">
              <FileText size={16} />
            </div>
            <div className="activity-text">
              <h4>New material uploaded to Database Systems</h4>
              <p>1 hour ago</p>
            </div>
          </div>
          <div className="activity-row">
            <div className="activity-icon green">
              <MessageSquare size={16} />
            </div>
            <div className="activity-text">
              <h4>3 new replies in Operating Systems forum</h4>
              <p>3 hours ago</p>
            </div>
          </div>
          <div className="activity-row">
            <div className="activity-icon violet">
              <Users size={16} />
            </div>
            <div className="activity-text">
              <h4>New students joined your course</h4>
              <p>Yesterday</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TutorHome
