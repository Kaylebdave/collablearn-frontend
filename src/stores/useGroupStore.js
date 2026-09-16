import { create } from 'zustand'

const useGroupStore = create((set) => ({
  groups: [
    {
      id: 1,
      name: 'Database Study Group',
      course: 'CSC 301',
      members: [
        { id: 1, name: 'Chioma Okeke', role: 'Admin' },
        { id: 2, name: 'Ibrahim Musa', role: 'Member' },
        { id: 3, name: 'Aisha Bello', role: 'Member' },
        { id: 4, name: 'You', role: 'Member' }
      ],
      description: 'Weekly discussions on normalization, SQL and ER diagrams.',
      resources: [
        { id: 1, title: 'Normalization Notes.pdf', size: '1.8 MB' },
        { id: 2, title: 'SQL Practice Questions.pdf', size: '2.3 MB' }
      ],
      status: 'synced'
    },
    {
      id: 2,
      name: 'OS Concepts Team',
      course: 'CSC 205',
      members: [
        { id: 1, name: 'Ibrahim Musa', role: 'Admin' },
        { id: 2, name: 'You', role: 'Member' }
      ],
      description: 'Helping each other with process scheduling and memory management.',
      resources: [
        { id: 1, title: 'Scheduling Algorithms.pdf', size: '3.1 MB' }
      ],
      status: 'synced'
    },
    {
      id: 3,
      name: 'Linear Algebra Squad',
      course: 'MTH 201',
      members: [
        { id: 1, name: 'Aisha Bello', role: 'Admin' },
        { id: 2, name: 'Chioma Okeke', role: 'Member' },
        { id: 3, name: 'You', role: 'Member' }
      ],
      description: 'Solving past questions and sharing notes.',
      resources: [],
      status: 'synced'
    }
  ],

  addGroup: (groupData, isOnline) => {
    const newGroup = {
      id: Date.now(),
      ...groupData,
      members: [{ id: Date.now(), name: 'You', role: 'Admin' }],
      resources: [],
      status: isOnline ? 'synced' : 'pending'
    }

    set((state) => ({
      groups: [newGroup, ...state.groups]
    }))
  }
}))

export default useGroupStore