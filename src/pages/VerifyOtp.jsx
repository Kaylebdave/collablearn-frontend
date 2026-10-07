import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { resendOtp, verifyOtp } from '../api/auth'
import useAuthStore from '../stores/useAuthStore'
import './VerifyOtp.css'

const getErrorMessage = (error, fallback) => {
  if (!error.response) {
    return 'Unable to reach CollabLearn. Check your connection and try again.'
  }

  return error.response.data?.message || error.response.data?.error || fallback
}

function VerifyOtp() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const setAuthenticatedUser = useAuthStore((store) => store.setAuthenticatedUser)
  const [email, setEmail] = useState(state?.email || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedOtp = otp.trim()

    if (!email) {
      setError('Enter the email address you used to sign up.')
      return
    }
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const data = await verifyOtp({ email, otp: trimmedOtp })
      const user = data?.user || {
        id: data?.id,
        name: state?.name,
        email,
        role: state?.role || 'student'
      }
      const token = data?.token ?? data?.accessToken ?? data?.data?.token ?? data?.data?.accessToken
      setAuthenticatedUser(user, true, token)
      navigate('/welcome', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'That verification code is invalid or has expired.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Enter your email address before requesting a new code.')
      return
    }

    setError('')
    setMessage('')
    try {
      await resendOtp({ email })
      setMessage('A new verification code has been sent.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not resend the code. Please try again.'))
    }
  }

  return (
    <div className="auth-page">
      <div className="verify-card">
        <div className="brand">
          <div className="brand-logo">O</div>
          <span>CollabLearn</span>
        </div>
        <h1>Verify your email</h1>
        <p className="subtitle">We sent a 6-digit code to your email. Enter it below to finish creating your account.</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label>Verification Code</label>
            <input className="otp-input" inputMode="numeric" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="000000" autoComplete="one-time-code" />
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <p className="resend-copy">Didn't receive a code? <button type="button" onClick={handleResend}>Resend OTP</button></p>
        <p className="auth-footer"><Link to="/signup">Back to sign up</Link></p>
      </div>
    </div>
  )
}

export default VerifyOtp
