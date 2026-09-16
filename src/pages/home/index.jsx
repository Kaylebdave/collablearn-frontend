import useAuthStore from '../../stores/useAuthStore'
import StudentHome from './StudentHome'
import TutorHome from './TutorHome'

function Home() {
  const user = useAuthStore((state) => state.user)
  const isTutor = user?.role === 'tutor'

  return isTutor ? <TutorHome /> : <StudentHome />
}

export default Home