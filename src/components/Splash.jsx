import './Splash.css'

function Splash() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        {/* Logo */}
        <div className="splash-logo">
          <span>O</span>
        </div>

        {/* App Name */}
        <h1 className="splash-title">CollabLearn</h1>

        {/* Tagline */}
        <p className="splash-tagline">Learn Together. Even Offline.</p>

        {/* Loading dots */}
        <div className="splash-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="splash-circle circle-1"></div>
      <div className="splash-circle circle-2"></div>
      <div className="splash-circle circle-3"></div>
    </div>
  )
}

export default Splash