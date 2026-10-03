import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, User } from 'lucide-react'
import { signup } from '../api/auth'
import './Signup.css'

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError('')
    try {
      await signup({ name, email, password, role: role === 'tutor' ? 'tutor' : 'student' })
      navigate('/verify-otp', { state: { email, name, role } })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        requestError.response?.data?.error ||
        'Unable to reach CollabLearn. Check your connection and try again.'
      )
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Form */}
        <div className="auth-form-side">
          <div className="auth-form-wrapper">
            <div className="brand">
              <div className="brand-logo">O</div>
              <span>CollabLearn</span>
            </div>

            <h1>Create Account</h1>
            <p className="subtitle">
              Join as a student or tutor and start learning together — even offline.
            </p>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

              {/* Role Selection */}
              <div className="role-selection">
                <label className="role-label">I am a</label>
                <div className="role-options">
                  <button
                    type="button"
                    className={`role-card ${role === 'student' ? 'active' : ''}`}
                    onClick={() => setRole('student')}
                  >
                    <User size={22} />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    className={`role-card ${role === 'tutor' ? 'active' : ''}`}
                    onClick={() => setRole('tutor')}
                  >
                    <GraduationCap size={22} />
                    <span>Tutor</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-button">
                Create Account
              </button>
            </form>

            <p className="auth-footer">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="auth-illustration-side">
          <div className="illustration-content">
            <h2>Learn Together.<br />Even Offline.</h2>
            <p>
              Access course materials, join discussions, and collaborate with classmates without worrying about internet connection.
            </p>

            <div className="features">
              <div className="feature-item">
                <span className="feature-icon">1</span>
                <span>Offline Course Access</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">2</span>
                <span>Discussion Forums</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">3</span>
                <span>Study Groups</span>
              </div>
            </div>
          </div>

          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
      </div>
    </div>
  )
}

export default Signup
