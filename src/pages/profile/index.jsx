import useAuthStore from '../../stores/useAuthStore'
import StudentProfile from './StudentProfile'
import TutorProfile from './TutorProfile'

function Profile() {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'tutor' ? <TutorProfile /> : <StudentProfile />
}

export default Profile
