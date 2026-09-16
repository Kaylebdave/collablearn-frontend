import useAuthStore from '../../stores/useAuthStore'
import StudentGroups from './StudentGroups'
import TutorGroups from './TutorGroups'

function Groups() {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'tutor' ? <TutorGroups /> : <StudentGroups />
}

export default Groups
