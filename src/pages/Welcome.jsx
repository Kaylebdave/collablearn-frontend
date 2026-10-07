import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare, Users, WifiOff } from 'lucide-react'
import useAuthStore from '../stores/useAuthStore'
import './Welcome.css'

function Welcome() {
  const user = useAuthStore((state) => state.user)
  const clearJustSignedUp = useAuthStore((state) => state.clearJustSignedUp)
  const isTutor = user?.role === 'tutor'
  const navigate = useNavigate()

  const handleGetStarted = (event) => {
    event.preventDefault()
    clearJustSignedUp()          // Important: clear the flag first
    navigate(isTutor ? '/courses?action=create' : '/courses?view=browse')
  }

  return (
    <div className="welcome-page">
      <div className="welcome-card">
        {/* Top Section */}
        <div className="welcome-top">
          <div className="welcome-logo">O</div>
          <h1>Welcome, {user?.name?.split(' ')[0] || 'Student'}!</h1>
          <p>{isTutor ? 'Your classroom is ready. Create a course to bring your learners together.' : 'Your learning space is ready. Join a course to get started.'}</p>
        </div>

        {/* Features */}
        <div className="welcome-features">
          <div className="feature">
            <div className="feature-icon blue">
              <BookOpen size={20} />
            </div>
            <div>
              <h3>Offline Courses</h3>
              <p>Download and study materials without internet</p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon indigo">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3>Discussions</h3>
              <p>Ask questions and reply anytime</p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon violet">
              <Users size={20} />
            </div>
            <div>
              <h3>Study Groups</h3>
              <p>Collaborate and share resources with peers</p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon amber">
              <WifiOff size={20} />
            </div>
            <div>
              <h3>Auto Sync</h3>
              <p>Your offline work syncs when you are back online</p>
            </div>
          </div>
        </div>

        {/* Button */}
        <Link className="welcome-btn" to={isTutor ? '/courses?action=create' : '/courses?view=browse'} onClick={handleGetStarted}>
          {isTutor ? 'Create Course' : 'Browse Courses'}
        </Link>
      </div>
    </div>
  )
}

export default Welcome