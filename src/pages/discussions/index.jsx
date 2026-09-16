import useAuthStore from '../../stores/useAuthStore'
import StudentDiscussions from './StudentDiscussions'
import TutorDiscussions from './TutorDiscussions'

function Discussions() {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'tutor' ? <TutorDiscussions /> : <StudentDiscussions />
}

export default Discussions
