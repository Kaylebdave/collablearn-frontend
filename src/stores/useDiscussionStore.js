import { create } from 'zustand'

const useDiscussionStore = create((set) => ({
  posts: [
    {
      id: 1,
      title: 'How to normalize a database?',
      content: 'Can someone explain the difference between 2NF and 3NF with examples?',
      author: 'Chioma Okeke',
      course: 'CSC 301',
      replies: [
        {
          id: 101,
          author: 'Ibrahim Musa',
          content: '2NF removes partial dependency while 3NF removes transitive dependency.',
          time: '1 hour ago',
          status: 'synced'
        },
        {
          id: 102,
          author: 'Aisha Bello',
          content: 'I recommend watching the lecture on normalization first.',
          time: '45 mins ago',
          status: 'synced'
        }
      ],
      time: '2 hours ago',
      status: 'synced'
    },
    {
      id: 2,
      title: 'Operating System Scheduling',
      content: 'What is the difference between preemptive and non-preemptive scheduling?',
      author: 'Ibrahim Musa',
      course: 'CSC 205',
      replies: [
        {
          id: 201,
          author: 'Chioma Okeke',
          content: 'Preemptive can interrupt a running process, non-preemptive cannot.',
          time: '3 hours ago',
          status: 'synced'
        }
      ],
      time: '5 hours ago',
      status: 'synced'
    },
    {
      id: 3,
      title: 'Help with Linear Algebra assignment',
      content: 'I’m stuck on question 4 about eigenvalues. Any tips?',
      author: 'Aisha Bello',
      course: 'MTH 201',
      replies: [],
      time: '1 day ago',
      status: 'synced'
    }
  ],

  addPost: (postData, isOnline) => {
    const newPost = {
      id: Date.now(),
      ...postData,
      author: 'You',
      replies: [],
      time: 'Just now',
      status: isOnline ? 'synced' : 'pending'
    }

    set((state) => ({
      posts: [newPost, ...state.posts]
    }))
  },

  addReply: (postId, replyData, isOnline) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          const newReply = {
            id: Date.now(),
            author: 'You',
            content: replyData.content,
            time: 'Just now',
            status: isOnline ? 'synced' : 'pending'
          }
          return {
            ...post,
            replies: [...(post.replies || []), newReply]
          }
        }
        return post
      })
    }))
  }
}))

export default useDiscussionStore
