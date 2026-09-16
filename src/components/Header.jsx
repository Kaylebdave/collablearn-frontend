import useConnectivityStore from '../stores/useConnectivityStore'
import './Header.css'

function Header() {
  const { isOnline } = useConnectivityStore()

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <div className="logo-icon">O</div>
          <h1 className="logo-text">CollabLearn</h1>
        </div>

        <div className="status-section">
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </header>
  )
}

export default Header