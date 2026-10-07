import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/useAuthStore'
import { login } from '../api/auth'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const data = await login({ email, password })
      const user = data?.user || data?.data?.user || { ...data, email }
      const token = data?.token ?? data?.accessToken ?? data?.data?.token ?? data?.data?.accessToken
      setAuthenticatedUser(user, true, token)
      navigate('/welcome')
    } catch (requestError) {
      if (!requestError.response) {
        setError('Unable to reach CollabLearn. Check your connection and try again.')
      } else {
        setError(requestError.response.data?.message || requestError.response.data?.error || 'Invalid email or password.')
      }
    } finally {
      setIsSubmitting(false)
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

            <h1>Welcome Back</h1>
            <p className="subtitle">
              Login to continue learning and collaborating with your classmates.
            </p>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-options">
                <label className="remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot">Forgot password?</a>
              </div>

              <button type="submit" className="auth-button" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
              {isSubmitting && (
                <p className="text-sm text-slate-500 mt-3" role="status">
                  Waking server... first request may take 1-2 minutes
                </p>
              )}
            </form>

            <p className="auth-footer">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="auth-illustration-side">
          <div className="illustration-content">
            <h2>Continue Your<br />Learning Journey</h2>
            <p>
              Access your courses, discussions, and study groups anytime — even without internet.
            </p>

            <div className="features">
              <div className="feature-item">
                <span className="feature-icon">📡</span>
                <span>Works Offline</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Fast Sync When Online</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Secure & Private</span>
              </div>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
      </div>
    </div>
  )
}

export default Login
