import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Clock, Send } from 'lucide-react'
import { getDiscussionById } from '../api/discussions'
import useAuthStore from '../stores/useAuthStore'
import useDiscussionStore from '../stores/useDiscussionStore'
import useConnectivityStore from '../stores/useConnectivityStore'
import useSyncStore from '../stores/useSyncStore'
import './DiscussionDetail.css'

const getDiscussion = (response) => response?.discussion || response?.data?.discussion || response?.data || response

const getResponseMessage = (requestError, fallback) => {
  const responseData = requestError?.response?.data
  if (typeof responseData === 'string') return responseData
  return responseData?.message || responseData?.error || requestError?.message || fallback
}

const mergeVisibleReplies = (serverReplies, localReplies) => {
  const visibleReplies = [...serverReplies]
  localReplies.forEach((localReply) => {
    const localId = localReply.id ?? localReply._id
    const serverIndex = localId == null ? -1 : visibleReplies.findIndex((serverReply) =>
      String(serverReply.id ?? serverReply._id) === String(localId)
    )
    if (serverIndex < 0) {
      visibleReplies.push(localReply)
    } else {
      visibleReplies[serverIndex] = { ...visibleReplies[serverIndex], ...localReply }
    }
  })
  return visibleReplies
}

const createLocalId = () => globalThis.crypto?.randomUUID?.() || `reply-${Date.now()}-${Math.random().toString(36).slice(2)}`

function DiscussionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyError, setReplyError] = useState('')
  const [sending, setSending] = useState(false)

  const user = useAuthStore((state) => state.user)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const enqueue = useSyncStore((state) => state.enqueue)
  const syncNow = useSyncStore((state) => state.syncNow)
  const posts = useDiscussionStore((state) => state.posts)
  const updatePost = useDiscussionStore((state) => state.updatePost)
  const localReplies = useDiscussionStore((state) => state.localReplies)
  const addLocalReply = useDiscussionStore((state) => state.addLocalReply)
  const setReplySyncStatus = useDiscussionStore((state) => state.setReplySyncStatus)

  const post = posts.find((candidate) => String(candidate.id) === String(id))
  const displayedReplies = mergeVisibleReplies(
    post?.replies || [],
    localReplies.filter((reply) => String(reply.discussionId) === String(id))
  )

  useEffect(() => {
    if (!isOnline) return undefined

    let active = true
    Promise.resolve().then(() => {
      if (!active) return null
      setLoading(true)
      setError('')
      return getDiscussionById(id)
        .then((response) => {
          const remotePost = getDiscussion(response)
          if (!remotePost || typeof remotePost !== 'object') throw new Error('Invalid discussion response')
          if (active) {
            updatePost({
              ...remotePost,
              id: remotePost.id ?? remotePost._id ?? id
            })
          }
        })
        .catch((requestError) => {
          if (active) setError(getResponseMessage(requestError, 'Unable to load this discussion.'))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    })

    return () => {
      active = false
    }
  }, [id, isOnline, updatePost])

  const handleReply = async (event) => {
    event.preventDefault()
    if (!replyText.trim() || sending || !post) return

    const createdAt = new Date().toISOString()
    const localId = createLocalId()
    const requestPayload = {
      content: replyText,
      author: user?.name?.trim() || ''
    }
    const optimisticReply = {
      id: localId,
      localId,
      discussionId: id,
      content: requestPayload.content,
      author: requestPayload.author,
      status: 'pending',
      createdAt,
      time: 'Just now'
    }
    if (!optimisticReply.author) {
      setReplyError('You must be signed in to reply.')
      return
    }
    setReplyError('')
    setSending(true)
    addLocalReply(optimisticReply)
    setReplyText('')
    try {
      enqueue('CREATE_REPLY', {
        discussionId: id,
        ...requestPayload,
        createdAt
      }, localId)
      if (isOnline) await syncNow()
    } catch (queueError) {
      setReplySyncStatus(id, localId, 'failed')
      setReplyError(getResponseMessage(queueError, 'Unable to save reply for sync.'))
    } finally {
      setSending(false)
    }
  }

  if (isOnline && loading && !post) {
    return <div className="discussion-detail-page"><div className="course-message">Loading discussion...</div></div>
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
        {error && <div className="courses-message error">{error}</div>}
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
          Replies ({displayedReplies.length})
        </h3>

        <div className="replies-list">
          {displayedReplies.length === 0 ? (
            <div className="no-replies">
              No replies yet. Be the first to reply.
            </div>
          ) : (
            displayedReplies.map((reply, index) => {
              const keyBase = String(reply.id ?? reply._id ?? reply.localId ?? `${reply.author || 'reply'}-${reply.createdAt || reply.time || 'unknown'}`)
              return (
              <div key={`${keyBase}-${index}`} className="reply-card">
                <div className="reply-header">
                  <strong>{reply.author}</strong>
                  <span>{reply.time}</span>
                  {['pending', 'syncing', 'failed'].includes(reply.status) && (
                    <span className="pending-badge small">
                      <Clock size={11} />
                      {reply.status === 'pending' ? 'Pending' : reply.status === 'syncing' ? 'Syncing' : 'Failed'}
                    </span>
                  )}
                </div>
                <p>{reply.content}</p>
              </div>
              )
            })
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
            onChange={(event) => setReplyText(event.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={sending}>
            <Send size={18} />
          </button>
        </div>
        {replyError && <p className="form-error">{replyError}</p>}
      </form>
    </div>
  )
}

export default DiscussionDetail