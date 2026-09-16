import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Clock, Download, Search } from 'lucide-react'
import useCourseStore from '../../stores/useCourseStore'
import './Courses.css'

function StudentCourses() {
  const [search, setSearch] = useState('')
  const courses = useCourseStore((state) => state.courses)
  const filteredCourses = courses.filter((course) =>
    `${course.code} ${course.title}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div>
          <h1>My Courses</h1>
          <p>{courses.length} enrolled courses</p>
        </div>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses..." />
      </div>

      <div className="courses-list">
        {filteredCourses.map((course) => (
          <Link to={`/courses/${course.id}`} key={course.id} className="course-item">
            <div className={`course-badge ${course.color || 'blue'}`}><BookOpen size={20} /></div>
            <div className="course-details">
              <div className="course-top">
                <span className="course-code">{course.code}</span>
                {course.status === 'pending' ? <span className="status pending"><Clock size={14} />Pending</span> : course.downloaded ? <span className="status downloaded"><CheckCircle2 size={14} />Available offline</span> : <span className="status not-downloaded"><Download size={14} />Download materials</span>}
              </div>
              <h3>{course.title}</h3>
              <p className="lecturer">{course.lecturer} · {course.materials} materials</p>
              <div className="progress-section">
                <div className="progress-track"><div className="progress-bar" style={{ width: `${course.progress || 0}%` }} /></div>
                <span>{course.progress || 0}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCourses.length === 0 && <div className="empty-state"><BookOpen size={40} /><p>No courses found</p></div>}
    </div>
  )
}

export default StudentCourses
