import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  FileText,
  Download,
  Clock,
  User
} from 'lucide-react'
import useGroupStore from '../stores/useGroupStore'
import './GroupDetail.css'

function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const groups = useGroupStore((state) => state.groups) || []
  const group = groups.find((g) => String(g.id) === String(id))

  if (!group) {
    return (
      <div className="group-detail-page">
        <div className="not-found">
          <h2>Study Group not found</h2>
          <button onClick={() => navigate('/groups')}>
            ← Back to Groups
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group-detail-page">
      {/* Top Bar */}
      <div className="detail-top">
        <button className="back-btn" onClick={() => navigate('/groups')}>
          <ArrowLeft size={20} />
        </button>
        <h1>Study Group</h1>
      </div>

      {/* Group Header */}
      <div className="group-hero">
        <div className="hero-icon">
          <Users size={28} />
        </div>
        <div className="hero-content">
          <div className="hero-top">
            <span className="group-course">{group.course}</span>
            {group.status === 'pending' && (
              <span className="pending-badge">
                <Clock size={12} />
                Pending
              </span>
            )}
          </div>
          <h2>{group.name}</h2>
          <p>{group.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="group-stats">
        <div className="stat-box">
          <Users size={18} />
          <div>
            <strong>{group.members?.length || 0}</strong>
            <span>Members</span>
          </div>
        </div>
        <div className="stat-box">
          <FileText size={18} />
          <div>
            <strong>{group.resources?.length || 0}</strong>
            <span>Resources</span>
          </div>
        </div>
      </div>

      {/* Members */}
      <section className="detail-section">
        <h3>Members</h3>
        <div className="members-list">
          {(group.members || []).map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-avatar">
                <User size={16} />
              </div>
              <div className="member-info">
                <h4>{member.name}</h4>
                <span>{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="detail-section">
        <div className="section-header">
          <h3>Shared Resources</h3>
        </div>

        {(group.resources || []).length === 0 ? (
          <div className="empty-resources">
            No resources shared yet.
          </div>
        ) : (
          <div className="resources-list">
            {group.resources.map((item) => (
              <div key={item.id} className="resource-item">
                <div className="resource-icon">
                  <FileText size={18} />
                </div>
                <div className="resource-info">
                  <h4>{item.title}</h4>
                  <p>{item.size}</p>
                </div>
                <button className="download-btn">
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default GroupDetail