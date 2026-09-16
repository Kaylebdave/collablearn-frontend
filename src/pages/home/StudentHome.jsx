import { Link } from 'react-router-dom'
import {
  BookOpen,
  MessageSquare,
  Users,
  Clock,
  ArrowRight,
  Search,
  Bell
} from 'lucide-react'
import useAuthStore from '../../stores/useAuthStore'
import './Home.css'

function StudentHome() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="home-page">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search courses, discussions..." />
        </div>
        <button className="notification-btn">
          <Bell size={20} />
        </button>
      </div>

      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-left">
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
          <p>
            Continue your learning journey. Access courses, join discussions, and collaborate with classmates.
          </p>
          <div className="banner-actions">
            <Link to="/courses" className="banner-btn primary">
              Continue Learning
            </Link>
            <Link to="/groups" className="banner-btn secondary">
              Join Study Group
            </Link>
          </div>
        </div>
        <div className="welcome-right">
          <div className="illustration-card">
            <div className="book book-1"></div>
            <div className="book book-2"></div>
            <div className="book book-3"></div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-row">
        <div className="stat-item">
          <div className="stat-icon blue">
            <BookOpen size={18} />
          </div>
          <div>
            <strong>4</strong>
            <span>Courses</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon indigo">
            <MessageSquare size={18} />
          </div>
          <div>
            <strong>12</strong>
            <span>Discussions</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon violet">
            <Users size={18} />
          </div>
          <div>
            <strong>3</strong>
            <span>Groups</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon amber">
            <Clock size={18} />
          </div>
          <div>
            <strong>2</strong>
            <span>Pending</span>
          </div>
        </div>
      </section>

      {/* My Courses Preview */}
      <section className="section">
        <div className="section-header">
          <h2>My Courses</h2>
          <Link to="/courses" className="view-all">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="courses-grid">
          <div className="course-card blue">
            <div className="course-top">
              <span className="course-code">CSC 301</span>
              <h3>Database Systems</h3>
            </div>
            <div className="course-meta">
              <span>12 Materials</span>
              <span>•</span>
              <span>8 Discussions</span>
            </div>
            <div className="course-progress">
              <div className="progress-track">
                <div className="progress-bar" style={{ width: '65%' }}></div>
              </div>
              <span>65%</span>
            </div>
          </div>

          <div className="course-card indigo">
            <div className="course-top">
              <span className="course-code">CSC 205</span>
              <h3>Operating Systems</h3>
            </div>
            <div className="course-meta">
              <span>9 Materials</span>
              <span>•</span>
              <span>5 Discussions</span>
            </div>
            <div className="course-progress">
              <div className="progress-track">
                <div className="progress-bar" style={{ width: '40%' }}></div>
              </div>
              <span>40%</span>
            </div>
          </div>

          <div className="course-card violet">
            <div className="course-top">
              <span className="course-code">MTH 201</span>
              <h3>Linear Algebra</h3>
            </div>
            <div className="course-meta">
              <span>7 Materials</span>
              <span>•</span>
              <span>3 Discussions</span>
            </div>
            <div className="course-progress">
              <div className="progress-track">
                <div className="progress-bar" style={{ width: '80%' }}></div>
              </div>
              <span>80%</span>
            </div>
          </div>
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
              <MessageSquare size={16} />
            </div>
            <div className="activity-text">
              <h4>New reply in “Database Systems”</h4>
              <p>2 hours ago</p>
            </div>
          </div>
          <div className="activity-row">
            <div className="activity-icon green">
              <BookOpen size={16} />
            </div>
            <div className="activity-text">
              <h4>Course material downloaded</h4>
              <p>Yesterday</p>
            </div>
          </div>
          <div className="activity-row">
            <div className="activity-icon violet">
              <Users size={16} />
            </div>
            <div className="activity-text">
              <h4>You joined “CSC 301 Study Group”</h4>
              <p>2 days ago</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default StudentHome
