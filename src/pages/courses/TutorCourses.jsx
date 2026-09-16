import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Clock, Plus, Search, Users } from 'lucide-react'
import useAuthStore from '../../stores/useAuthStore'
import useConnectivityStore from '../../stores/useConnectivityStore'
import useCourseStore from '../../stores/useCourseStore'
import './Courses.css'

function TutorCourses() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const user = useAuthStore((state) => state.user)
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const { courses, addCourse } = useCourseStore()
  const filteredCourses = courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(search.toLowerCase()))

  const handleCreateCourse = (event) => {
    event.preventDefault()
    if (!code.trim() || !title.trim()) return
    addCourse({ code: code.trim().toUpperCase(), title: title.trim(), lecturer: user?.name || 'Tutor', description: description.trim() }, isOnline)
    setCode('')
    setTitle('')
    setDescription('')
    setShowModal(false)
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div><h1>Course Management</h1><p>{courses.length} courses under your care</p></div>
        <button className="new-course-btn" onClick={() => setShowModal(true)}><Plus size={18} />New Course</button>
      </div>
      <div className="search-bar"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your courses..." /></div>
      <div className="courses-list">
        {filteredCourses.map((course) => (
          <Link to={`/courses/${course.id}`} key={course.id} className="course-item">
            <div className={`course-badge ${course.color || 'blue'}`}><BookOpen size={20} /></div>
            <div className="course-details">
              <div className="course-top"><span className="course-code">{course.code}</span>{course.status === 'pending' ? <span className="status pending"><Clock size={14} />Pending sync</span> : <span className="status downloaded"><CheckCircle2 size={14} />Synced</span>}</div>
              <h3>{course.title}</h3>
              <p className="lecturer">{course.materials} materials · Teaching course</p>
              <div className="progress-section"><Users size={15} className="text-blue-600" /><span>Manage materials and learner activity</span></div>
            </div>
          </Link>
        ))}
      </div>
      {filteredCourses.length === 0 && <div className="empty-state"><BookOpen size={40} /><p>No courses found</p></div>}
      {showModal && <div className="modal-overlay"><div className="modal"><div className="modal-header"><h2>Create New Course</h2><button type="button" aria-label="Close" onClick={() => setShowModal(false)}>×</button></div><form onSubmit={handleCreateCourse}><div className="form-group"><label>Course Code</label><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="e.g. CSC 301" /></div><div className="form-group"><label>Course Title</label><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Database Systems" /></div><div className="form-group"><label>Description (optional)</label><textarea rows="3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description of the course" /></div>{!isOnline && <div className="offline-note">You are offline. This course will be saved and synced later.</div>}<button className="submit-btn" type="submit">{isOnline ? 'Create Course' : 'Save Offline'}</button></form></div></div>}
    </div>
  )
}

export default TutorCourses
