import { Link } from 'react-router-dom'
import { BookOpen, MessageSquare, Users, WifiOff } from 'lucide-react'
import useAuthStore from '../stores/useAuthStore'
import './Welcome.css'

function Welcome() {
  const user = useAuthStore((state) => state.user)
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding)
  const isTutor = user?.role === 'tutor'
  const firstName = user?.name?.split(' ')[0] || (isTutor ? 'Tutor' : 'Student')
  const coursePath = isTutor ? '/courses?action=create' : '/courses?view=browse'

  return (
    <div className="welcome-page">
      <main className="welcome-card">
        <section className="welcome-intro">
          <div className="welcome-brand"><div className="welcome-logo">O</div><span>CollabLearn</span></div>
          <span className="welcome-kicker">{isTutor ? 'TUTOR ONBOARDING' : 'STUDENT ONBOARDING'}</span>
          <h1>Welcome, {firstName}.</h1>
          <p>{isTutor ? 'Your classroom starts with a course. Set up your first one and invite learners into a shared space.' : 'Your learning space is ready. Find your course and bring your class materials, discussions, and study groups together.'}</p>
          <div className="welcome-actions">
            <Link className="welcome-btn" to={coursePath} onClick={completeOnboarding}>
              {isTutor ? 'Create Course' : 'Browse Courses'}
            </Link>
            <Link className="welcome-home-btn" to="/home" onClick={completeOnboarding}>Go to Home</Link>
          </div>
        </section>

        <section className="welcome-content" aria-label="Classroom tools">
          <div className="welcome-content-heading">
            <span>YOUR CLASSROOM</span>
            <h2>Everything for learning together</h2>
          </div>
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
          <p className="welcome-note">Your courses and conversations stay organized in one place.</p>
        </section>
      </main>
    </div>
  )
}

export default Welcome