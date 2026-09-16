import { create } from 'zustand'

const useConflictStore = create((set) => ({
  conflicts: [
    {
      id: 1,
      type: 'Discussion',
      title: 'How to normalize a database?',
      localChange: 'You edited this post while offline.',
      serverChange: 'Another student also edited this post.',
      time: '10 mins ago',
      status: 'unresolved'
    },
    {
      id: 2,
      type: 'Study Group',
      title: 'Database Study Group',
      localChange: 'You updated the group description offline.',
      serverChange: 'The group admin also changed the description.',
      time: '25 mins ago',
      status: 'unresolved'
    }
  ],

  resolveConflict: (id, resolution) => {
    set((state) => ({
      conflicts: state.conflicts.map((item) =>
        item.id === id
          ? { ...item, status: 'resolved', resolution }
          : item
      )
    }))
  }
}))

export default useConflictStore