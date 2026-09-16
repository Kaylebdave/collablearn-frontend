import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Clock, Send } from 'lucide-react'
import useDiscussionStore from '../stores/useDiscussionStore'
import useConnectivityStore from '../stores/useConnectivityStore'
import './DiscussionDetail.css'

function DiscussionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [replyText, setReplyText] = useState('')

  const isOnline = useConnectivityStore((state) => state.isOnline)
  const posts = useDiscussionStore((state) => state.posts)
  const addReply = useDiscussionStore((state) => state.addReply)

  const post = posts.find((p) => String(p.id) === String(id))

  const handleReply = (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    addReply(Number(id), { content: replyText.trim() }, isOnline)
    setReplyText('')
  }

  if (!post) {
    return (
      <div className="discussion-detail-page">
        <div className="not-found">
          <h2>Discussion not found</h2>
          <button onClick={() => navigate('/discussions')}>
            ← Back to Discussions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="discussion-detail-page">
      {/* Top Bar */}
      <div className="detail-top">
        <button className="back-btn" onClick={() => navigate('/discussions')}>
          <ArrowLeft size={20} />
        </button>
        <h1>Discussion</h1>
      </div>

      {/* Main Post */}
      <div className="main-post">
        <div className="post-meta">
          <span className="post-course">{post.course}</span>
          {post.status === 'pending' && (
            <span className="pending-badge">
              <Clock size={12} />
              Pending
            </span>
          )}
        </div>

        <h2>{post.title}</h2>
        <p className="post-body">{post.content}</p>

        <div className="post-footer">
          <span>{post.author}</span>
          <span>•</span>
          <span>{post.time}</span>
        </div>
      </div>

      {/* Replies */}
      <div className="replies-section">
        <h3>
          <MessageSquare size={18} />
          Replies ({post.replies?.length || 0})
        </h3>

        <div className="replies-list">
          {(post.replies || []).length === 0 ? (
            <div className="no-replies">
              No replies yet. Be the first to reply.
            </div>
          ) : (
            post.replies.map((reply) => (
              <div key={reply.id} className="reply-card">
                <div className="reply-header">
                  <strong>{reply.author}</strong>
                  <span>{reply.time}</span>
                  {reply.status === 'pending' && (
                    <span className="pending-badge small">
                      <Clock size={11} />
                      Pending
                    </span>
                  )}
                </div>
                <p>{reply.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Form */}
      <form className="reply-form" onSubmit={handleReply}>
        {!isOnline && (
          <div className="offline-note">
            You are offline. Your reply will be saved and synced later.
          </div>
        )}

        <div className="reply-input-row">
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button type="submit">
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}

export default DiscussionDetail