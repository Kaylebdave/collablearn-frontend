import { RefreshCw, Clock, CheckCircle2, MessageSquare, Users, BookOpen } from 'lucide-react'
import useSyncStore from '../stores/useSyncStore'
import useConnectivityStore from '../stores/useConnectivityStore'
import './SyncQueue.css'

function SyncQueue() {
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const { getPendingItems, syncAll, isSyncing, lastSynced } = useSyncStore()
  const pendingItems = getPendingItems()

  const handleSyncNow = () => {
    if (!isOnline || isSyncing) return
    syncAll()
  }

  return (
    <div className="sync-page">
      <div className="sync-header">
        <div>
          <h1>Sync Queue</h1>
          <p>
            {pendingItems.length === 0
              ? 'Everything is synced'
              : `${pendingItems.length} item(s) waiting to sync`}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`status-card ${isOnline ? 'online' : 'offline'}`}>
        <div className="status-icon">
          {isOnline ? <CheckCircle2 size={22} /> : <Clock size={22} />}
        </div>
        <div>
          <h3>{isOnline ? 'You are Online' : 'You are Offline'}</h3>
          <p>
            {isOnline
              ? 'You can sync pending items now.'
              : 'New actions will be saved and synced later.'}
          </p>
          {lastSynced && (
            <span className="last-synced">Last synced at {lastSynced}</span>
          )}
        </div>
      </div>

      {/* Pending Items */}
      <div className="pending-section">
        <h2>Pending Actions</h2>

        {pendingItems.length === 0 ? (
          <div className="empty-sync">
            <CheckCircle2 size={40} />
            <p>No pending actions</p>
            <span>All your data is synced</span>
          </div>
        ) : (
          <div className="pending-list">
            {pendingItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="pending-item">
                <div className="pending-icon">
                  {item.type === 'Discussion' ? (
                    <MessageSquare size={18} />
                  ) : item.type === 'Study Group' ? (
                    <Users size={18} />
                  ) : (
                    <BookOpen size={18} />
                  )}
                </div>
                <div className="pending-info">
                  <h4>{item.title}</h4>
                  <p>{item.type} • Waiting to sync</p>
                </div>
                <span className="pending-badge">Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingItems.length > 0 && (
        <button
          className={`sync-now-btn ${!isOnline || isSyncing ? 'disabled' : ''}`}
          onClick={handleSyncNow}
          disabled={!isOnline || isSyncing}
        >
          <RefreshCw size={18} className={isSyncing ? 'spin' : ''} />
          {isSyncing ? 'Syncing...' : isOnline ? 'Sync Now' : 'Waiting for connection'}
        </button>
      )}
    </div>
  )
}

export default SyncQueue