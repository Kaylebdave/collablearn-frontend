import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Search, Clock } from 'lucide-react'
import useDiscussionStore from '../../stores/useDiscussionStore'
import './Discussions.css'

function StudentDiscussions() {
  const [search, setSearch] = useState('')
  const posts = useDiscussionStore((state) => state.posts)
  const filteredPosts = posts.filter((post) => `${post.title} ${post.course}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="discussions-page">
    <div className="discussions-header"><div><h1>Course Discussions</h1><p>Join {posts.length} active learning conversations</p></div></div>
    <div className="search-bar"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search discussions..." /></div>
    <div className="posts-list">{filteredPosts.map((post) => <Link to={`/discussions/${post.id}`} key={post.id} className="post-card"><div className="post-top"><span className="post-course">{post.course}</span>{post.status === 'pending' && <span className="pending-badge"><Clock size={12} />Pending</span>}</div><h3>{post.title}</h3><p className="post-content">{post.content}</p><div className="post-footer"><span className="author">{post.author}</span><span className="dot">·</span><span>{post.time}</span><span className="dot">·</span><span className="replies"><MessageSquare size={14} />{post.replies?.length || 0} replies</span></div></Link>)}</div>
    {filteredPosts.length === 0 && <div className="empty-state"><MessageSquare size={40} /><p>No discussions found</p></div>}
  </div>
}

export default StudentDiscussions
