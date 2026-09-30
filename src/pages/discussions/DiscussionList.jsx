import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, MessageSquare, Plus, Search, ShieldCheck } from 'lucide-react'
import { getDiscussions } from '../../api/discussions'
import useAuthStore from '../../stores/useAuthStore'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useDiscussionStore from '../../stores/useDiscussionStore'
import DiscussionComposer from './DiscussionComposer'
import './Discussions.css'

const getDiscussionList = (response) => {
  const discussions = Array.isArray(response)
    ? response
    : response?.discussions || response?.data?.discussions || response?.data
  return Array.isArray(discussions) ? discussions : null
}

const getReplyCount = (post) => post.replies?.length ?? post.repliesCount ?? post.replyCount ?? 0

function DiscussionList() {
  const user = useAuthStore((state) => state.user)
  const connectivityOnline = useConnectivityStore((state) => state.isOnline)
  const isOnline = connectivityOnline || (typeof navigator !== 'undefined' && navigator.onLine)
  const posts = useDiscussionStore((state) => state.posts)
  const setPosts = useDiscussionStore((state) => state.setPosts)
  const [search, setSearch] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOnline) return

    let active = true

    Promise.resolve().then(() => {
      if (!active) return null
      setLoading(true)
      setError('')
      return getDiscussions()
        .then((response) => {
          const remotePosts = getDiscussionList(response)
          if (!remotePosts) throw new Error('Invalid discussions response')
          if (active) setPosts(remotePosts)
        })
        .catch((requestError) => {
          console.warn('Failed to load discussions', {
            status: requestError?.response?.status,
            message: requestError?.response?.data?.message || requestError?.message
          })
          if (active) setError('Unable to load discussions from the server. Showing saved discussions.')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    })

    return () => {
      active = false
    }
  }, [isOnline, setPosts])

  const filteredPosts = posts.filter((post) =>
    `${post.title || ''} ${post.course || ''} ${post.author || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const pendingPosts = posts.filter((post) => post.status === 'pending').length
  const isTutor = user?.role === 'tutor'

  return (
    <div className="discussions-page">
      <div className="discussions-header">
        <div>
          <h1>{isTutor ? 'Discussion Moderation' : 'Course Discussions'}</h1>
          <p>{posts.length} threads{isTutor && ` · ${pendingPosts} awaiting sync`}</p>
        </div>
        <button className="new-post-btn" type="button" onClick={() => setShowComposer(true)}>
          {isTutor ? <ShieldCheck size={18} /> : <Plus size={18} />}
          {isTutor ? 'New discussion' : 'New discussion'}
        </button>
      </div>

      <div className="search-bar"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search discussions..." /></div>
      {loading && <div className="courses-message">Loading discussions...</div>}
      {error && <div className="courses-message error">{error}</div>}

      <div className="posts-list">
        {filteredPosts.map((post) => (
          <Link to={`/discussions/${post.id}`} key={post.id} className="post-card">
            <div className="post-top">
              <span className="post-course">{post.course || 'Course discussion'}</span>
              {post.status === 'pending' ? <span className="pending-badge"><Clock size={12} />Pending sync</span> : <span className="status downloaded"><CheckCircle2 size={14} />Active</span>}
            </div>
            <h3>{post.title || 'Untitled discussion'}</h3>
            <p className="post-content">{post.content || 'No discussion content.'}</p>
            <div className="post-footer"><span>{post.author || 'Unknown author'}</span><span className="dot">·</span><span>{post.time || 'Recently'}</span><span className="dot">·</span><span className="replies"><MessageSquare size={14} />{getReplyCount(post)} replies</span></div>
          </Link>
        ))}
      </div>

      {!loading && filteredPosts.length === 0 && <div className="empty-state"><MessageSquare size={40} /><p>{search ? 'No discussions match your search.' : 'No discussions yet. Start the first thread.'}</p></div>}
      {showComposer && <DiscussionComposer onClose={() => setShowComposer(false)} />}
    </div>
  )
}

export default DiscussionList