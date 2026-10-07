import { Link } from 'react-router-dom'
import {
  BookOpen,
  MessageSquare,
  Users,
  Clock,
  Search,
  Bell,
  ArrowRight,
  PlusCircle,
  BarChart3,
  GraduationCap
} from 'lucide-react'
import useAuthStore from '../../stores/useAuthStore'
import useCourseStore from '../../stores/useCourseStore'
import useDiscussionStore from '../../stores/useDiscussionStore'
import useSyncStore from '../../stores/useSyncStore'
import './Home.css'

const getCourseStudents = (course) => Array.isArray(course.students)
  ? course.students.length
  : Number(course.studentsCount ?? course.studentCount ?? course.enrollmentCount) || 0

const getMaterialCount = (course) => Array.isArray(course.materials)
  ? course.materials.length
  : Number(course.materialsCount ?? course.materialCount ?? course.materials) || 0

function TutorHome() {
  const user = useAuthStore((state) => state.user)
  const courses = useCourseStore((state) => state.courses)
  const discussions = useDiscussionStore((state) => state.posts)
  const pendingCount = useSyncStore((state) => state.queue.filter((item) => item.status !== 'synced').length)
  const studentCount = courses.reduce((total, course) => total + getCourseStudents(course), 0)

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
            <Link to="/courses?action=create" className="banner-btn primary">
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
            <strong>{courses.length}</strong>
            <span>My Courses</span>
          </div>
        </Link>
        <Link to="/groups" className="stat-item">
          <div className="stat-icon indigo">
            <Users size={18} />
          </div>
          <div>
            <strong>{studentCount}</strong>
            <span>Students</span>
          </div>
        </Link>
        <Link to="/discussions" className="stat-item">
          <div className="stat-icon violet">
            <MessageSquare size={18} />
          </div>
          <div>
            <strong>{discussions.length}</strong>
            <span>Discussions</span>
          </div>
        </Link>
        <Link to="/sync" className="stat-item">
          <div className="stat-icon amber">
            <Clock size={18} />
          </div>
          <div>
            <strong>{pendingCount}</strong>
            <span>Pending Sync</span>
          </div>
        </Link>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>My Classes</h2>
          <Link to="/courses" className="view-all">View all</Link>
        </div>
        {courses.length ? <div className="courses-grid">
          {courses.map((course) => <Link to={`/courses/${course.id ?? course._id}`} className="course-card blue" key={course.id ?? course._id}>
            <div className="course-top"><span className="course-code">{course.code || 'COURSE'}</span><h3>{course.title || course.name || 'Untitled course'}</h3></div>
            <div className="course-meta"><span>{getCourseStudents(course)} students</span><span>{getMaterialCount(course)} materials</span></div>
            <div className="course-progress"><span>Manage class</span><ArrowRight size={16} /></div>
          </Link>)}
        </div> : <div className="empty-state"><BookOpen size={34} /><p>Create your first course</p><Link to="/courses?action=create" className="banner-btn primary"><PlusCircle size={17} />Create Course</Link></div>}
      </section>

      {/* Quick Actions */}
      <section className="section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="tutor-actions">
          <Link to="/courses?action=create" className="tutor-action-card">
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
          <div className="activity-row"><div className="activity-text"><p>No recent activity.</p></div></div>
        </div>
      </section>
    </div>
  )
}

export default TutorHome
