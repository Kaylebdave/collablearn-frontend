import { AlertTriangle, CheckCircle2, MessageSquare, Users } from 'lucide-react'
import useConflictStore from '../stores/useConflictStore'
import './ConflictResolution.css'

function ConflictResolution() {
  const { conflicts, resolveConflict } = useConflictStore()

  const unresolved = conflicts.filter((c) => c.status === 'unresolved')
  const resolved = conflicts.filter((c) => c.status === 'resolved')

  return (
    <div className="conflict-page">
      {/* Header */}
      <div className="conflict-header">
        <h1>Conflict Resolution</h1>
        <p>
          {unresolved.length === 0
            ? 'No conflicts at the moment'
            : `${unresolved.length} item(s) need your attention`}
        </p>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <AlertTriangle size={20} />
        <div>
          <h3>What are conflicts?</h3>
          <p>
            Conflicts happen when you make changes offline and the same item was also changed by someone else. Choose which version to keep.
          </p>
        </div>
      </div>

      {/* Unresolved Conflicts */}
      <section className="conflict-section">
        <h2>Pending Conflicts</h2>

        {unresolved.length === 0 ? (
          <div className="empty-conflict">
            <CheckCircle2 size={40} />
            <p>All conflicts resolved</p>
            <span>Your data is fully synced</span>
          </div>
        ) : (
          <div className="conflict-list">
            {unresolved.map((item) => (
              <div key={item.id} className="conflict-card">
                <div className="conflict-top">
                  <div className="conflict-type">
                    {item.type === 'Discussion' ? (
                      <MessageSquare size={16} />
                    ) : (
                      <Users size={16} />
                    )}
                    <span>{item.type}</span>
                  </div>
                  <span className="conflict-time">{item.time}</span>
                </div>

                <h3>{item.title}</h3>

                <div className="change-boxes">
                  <div className="change-box local">
                    <span className="label">Your Version (Local)</span>
                    <p>{item.localChange}</p>
                  </div>
                  <div className="change-box server">
                    <span className="label">Server Version</span>
                    <p>{item.serverChange}</p>
                  </div>
                </div>

                <div className="resolve-actions">
                  <button
                    className="btn-local"
                    onClick={() => resolveConflict(item.id, 'local')}
                  >
                    Keep My Version
                  </button>
                  <button
                    className="btn-server"
                    onClick={() => resolveConflict(item.id, 'server')}
                  >
                    Keep Server Version
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section className="conflict-section">
          <h2>Resolved</h2>
          <div className="resolved-list">
            {resolved.map((item) => (
              <div key={item.id} className="resolved-item">
                <CheckCircle2 size={18} />
                <div>
                  <h4>{item.title}</h4>
                  <p>
                    Kept {item.resolution === 'local' ? 'your version' : 'server version'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ConflictResolution