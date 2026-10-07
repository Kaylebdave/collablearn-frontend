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
import useCourseStore from '../../stores/useCourseStore'
import useDiscussionStore from '../../stores/useDiscussionStore'
import useGroupStore from '../../stores/useGroupStore'
import useSyncStore from '../../stores/useSyncStore'
import './Home.css'

function StudentHome() {
  const user = useAuthStore((state) => state.user)
  const courses = useCourseStore((state) => state.courses)
  const discussions = useDiscussionStore((state) => state.posts)
  const groups = useGroupStore((state) => state.groups)
  const pendingCount = useSyncStore((state) => state.queue.filter((item) => item.status !== 'synced').length)

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
            <Link to={courses.length ? '/courses' : '/courses?view=browse'} className="banner-btn primary">
              {courses.length ? 'Continue Learning' : 'Browse Courses'}
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
        <Link to="/courses" className="stat-item">
          <div className="stat-icon blue">
            <BookOpen size={18} />
          </div>
          <div>
            <strong>{courses.length}</strong>
            <span>Courses</span>
          </div>
        </Link>
        <Link to="/discussions" className="stat-item">
          <div className="stat-icon indigo">
            <MessageSquare size={18} />
          </div>
          <div>
            <strong>{discussions.length}</strong>
            <span>Discussions</span>
          </div>
        </Link>
        <Link to="/groups" className="stat-item">
          <div className="stat-icon violet">
            <Users size={18} />
          </div>
          <div>
            <strong>{groups.length}</strong>
            <span>Groups</span>
          </div>
        </Link>
        <Link to="/sync" className="stat-item">
          <div className="stat-icon amber">
            <Clock size={18} />
          </div>
          <div>
            <strong>{pendingCount}</strong>
            <span>Pending</span>
          </div>
        </Link>
      </section>

      {/* My Courses Preview */}
      <section className="section">
        <div className="section-header">
          <h2>My Courses</h2>
          <Link to="/courses" className="view-all">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="courses-grid">
            {courses.map((course, index) => {
              const materialsCount = Array.isArray(course.materials)
                ? course.materials.length
                : Number(course.materials) || 0
              const discussionsCount = Number(course.discussionsCount ?? course.discussionCount) || 0
              const color = course.color || ['blue', 'indigo', 'violet'][index % 3]

              return (
                <Link to={`/courses/${course.id ?? course._id}`} className={`course-card ${color}`} key={course.id ?? course._id}>
                  <div className="course-top">
                    <span className="course-code">{course.code || ''}</span>
                    <h3>{course.title || course.name || 'Untitled course'}</h3>
                  </div>
                  <div className="course-meta">
                    <span>{course.tutor?.name || course.tutorName || course.lecturer || 'Tutor not listed'}</span>
                  </div>
                  <div className="course-meta">
                    <span>{materialsCount} materials</span>
                    <span>{Number(course.studentsCount ?? course.studentCount ?? course.students?.length) || 0} students</span>
                  </div>
                  <div className="course-progress"><span>{discussionsCount} discussions</span><ArrowRight size={16} /></div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="empty-state"><BookOpen size={34} /><p>You haven’t joined any course yet</p><Link to="/courses?view=browse" className="banner-btn primary">Browse Courses</Link></div>
        )}
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

export default StudentHome
