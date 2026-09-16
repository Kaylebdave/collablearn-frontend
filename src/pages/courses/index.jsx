import useAuthStore from '../../stores/useAuthStore'
import StudentCourses from './StudentCourses'
import TutorCourses from './TutorCourses'

function Courses() {
  const user = useAuthStore((state) => state.user)

  return user?.role === 'tutor' ? <TutorCourses /> : <StudentCourses />
}

export default Courses
