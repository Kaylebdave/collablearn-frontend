import { useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare, Users, WifiOff } from 'lucide-react'
import useAuthStore from '../stores/useAuthStore'
import './Welcome.css'

function Welcome() {
  const user = useAuthStore((state) => state.user)
  const clearJustSignedUp = useAuthStore((state) => state.clearJustSignedUp)
  const navigate = useNavigate()

  const handleGetStarted = () => {
    clearJustSignedUp()          // Important: clear the flag first
    setTimeout(() => {
      navigate('/')              // Then go to Home
    }, 50)
  }

  return (
    <div className="welcome-page">
      <div className="welcome-card">
        {/* Top Section */}
        <div className="welcome-top">
          <div className="welcome-logo">O</div>
          <h1>Welcome, {user?.name?.split(' ')[0] || 'Student'}!</h1>
          <p>
            Your account has been created successfully.  
            Start learning and collaborating with your classmates — even without internet.
          </p>
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
        <button className="welcome-btn" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  )
}

export default Welcome