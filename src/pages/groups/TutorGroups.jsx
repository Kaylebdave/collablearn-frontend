import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Search, Users } from 'lucide-react'
import useGroupStore from '../../stores/useGroupStore'
import './Groups.css'

function TutorGroups() {
  const [search, setSearch] = useState('')
  const groups = useGroupStore((state) => state.groups)
  const totalMembers = groups.reduce((total, group) => total + (group.members?.length || 0), 0)
  const filteredGroups = groups.filter((group) => `${group.name} ${group.course}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="groups-page">
    <div className="groups-header"><div><h1>Study Group Monitor</h1><p>{groups.length} active groups · {totalMembers} student memberships</p></div></div>
    <div className="search-bar"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a study group..." /></div>
    <div className="groups-list">{filteredGroups.map((group) => <Link to={`/groups/${group.id}`} key={group.id} className="group-card"><div className="group-top"><div className="group-icon"><Users size={20} /></div><div className="group-info"><div className="group-title-row"><h3>{group.name}</h3>{group.status === 'pending' && <span className="pending-badge"><Clock size={12} />Pending sync</span>}</div><span className="group-course">{group.course}</span></div></div><p className="group-description">{group.description}</p><div className="group-footer"><span className="members"><Users size={14} />{group.members?.length || 0} members</span><span className="members"><BookOpen size={14} />{group.resources?.length || 0} resources</span><span className="view-text">Monitor group</span></div></Link>)}</div>
    {filteredGroups.length === 0 && <div className="empty-state"><Users size={40} /><p>No study groups found</p></div>}
  </div>
}

export default TutorGroups
