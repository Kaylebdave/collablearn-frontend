import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, MessageSquare, Search, ShieldCheck } from 'lucide-react'
import useDiscussionStore from '../../stores/useDiscussionStore'
import './Discussions.css'

function TutorDiscussions() {
  const [search, setSearch] = useState('')
  const posts = useDiscussionStore((state) => state.posts)
  const pendingPosts = posts.filter((post) => post.status === 'pending').length
  const filteredPosts = posts.filter((post) => `${post.title} ${post.course}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="discussions-page">
    <div className="discussions-header"><div><h1>Discussion Moderation</h1><p>{posts.length} threads · {pendingPosts} awaiting sync</p></div><div className="new-post-btn"><ShieldCheck size={18} />Moderation view</div></div>
    <div className="search-bar"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a thread to moderate..." /></div>
    <div className="posts-list">{filteredPosts.map((post) => <Link to={`/discussions/${post.id}`} key={post.id} className="post-card"><div className="post-top"><span className="post-course">{post.course}</span>{post.status === 'pending' ? <span className="pending-badge"><Clock size={12} />Pending sync</span> : <span className="status downloaded"><CheckCircle2 size={14} />Active</span>}</div><h3>{post.title}</h3><p className="post-content">{post.content}</p><div className="post-footer"><span>{post.author}</span><span className="dot">·</span><span>{post.replies?.length || 0} replies to review</span><span className="dot">·</span><span className="replies"><MessageSquare size={14} />Open thread</span></div></Link>)}</div>
    {filteredPosts.length === 0 && <div className="empty-state"><MessageSquare size={40} /><p>No discussions found</p></div>}
  </div>
}

export default TutorDiscussions
