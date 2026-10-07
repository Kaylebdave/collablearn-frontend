import { create } from 'zustand'

const sortReplies = (replies) => [...replies].sort((first, second) => {
  const firstCreatedAt = Date.parse(first.createdAt || '') || 0
  const secondCreatedAt = Date.parse(second.createdAt || '') || 0
  return firstCreatedAt - secondCreatedAt
})

const sameReply = (first, second) => {
  const firstId = first.id ?? first._id
  const secondId = second.id ?? second._id
  const sameId = firstId != null && secondId != null && String(firstId) === String(secondId)
  const sameLocalId = first.localId != null && second.localId != null && String(first.localId) === String(second.localId)
  return sameId || sameLocalId
}

const uniqueReplies = (replies) => replies
  .map((reply) => ({ ...reply, id: reply.id ?? reply._id }))
  .reduce((unique, reply) => {
    const existingIndex = unique.findIndex((candidate) => sameReply(candidate, reply))
    if (existingIndex < 0) return [...unique, reply]
    return unique.map((candidate, index) => index === existingIndex ? { ...candidate, ...reply } : candidate)
  }, [])

const upsertLocalReply = (localReplies, localId, reply) => {
  const index = localReplies.findIndex((candidate) => String(candidate.localId) === String(localId))
  return index < 0
    ? [...localReplies, { ...reply, localId }]
    : localReplies.map((candidate, candidateIndex) => candidateIndex === index
        ? { ...candidate, ...reply, localId }
        : candidate)
}

const useDiscussionStore = create((set, get) => ({
  localReplies: [],
  posts: [],

  clearUserData: () => set({ localReplies: [], posts: [] }),

  setPosts: (posts) => set((state) => {
    const normalizedPosts = posts.map((post) => ({ ...post, id: post.id ?? post._id }))
    const remoteIds = new Set(normalizedPosts.map((post) => String(post.id)))
    const mergedPosts = normalizedPosts.map((post) => {
      const serverReplies = uniqueReplies(post.replies || [])
      return {
        ...post,
        status: 'synced',
        replies: sortReplies(serverReplies)
      }
    })
    const pendingPosts = state.posts.filter((post) =>
      (post.status === 'pending' || post.localOnly) && !remoteIds.has(String(post.id))
    )
    return {
      posts: [
        ...mergedPosts.map((post) => ({ ...post, localOnly: false })),
        ...pendingPosts
      ]
    }
  }),

  updatePost: (updatedPost) => set((state) => {
    const normalizedPost = { ...updatedPost, id: updatedPost.id ?? updatedPost._id }
    const existingPost = state.posts.find((post) => String(post.id) === String(normalizedPost.id))
    const serverReplies = uniqueReplies([
      ...(existingPost?.replies || []),
      ...(normalizedPost.replies || [])
    ])
    const nextPost = {
      ...existingPost,
      ...normalizedPost,
      replies: sortReplies(serverReplies)
    }
    return {
      posts: existingPost
        ? state.posts.map((post) => String(post.id) === String(normalizedPost.id) ? nextPost : post)
        : [nextPost, ...state.posts]
    }
  }),

  addLocalReply: (reply) => set((state) => ({
    localReplies: upsertLocalReply(state.localReplies, reply.localId, reply)
  })),

  markReplySynced: (localId, serverReply = {}) => set((state) => {
    const existing = state.localReplies.find((reply) => String(reply.localId) === String(localId))
    if (!existing) return state
    const serverId = serverReply.id ?? serverReply._id
    return {
      localReplies: state.localReplies.map((reply) => String(reply.localId) === String(localId)
        ? { ...reply, ...(serverId == null ? {} : { id: serverId }), status: 'synced' }
        : reply)
    }
  }),

  addPost: (postData, isOnline = false) => {
    const newPost = {
      ...postData,
      id: postData.id ?? postData._id ?? Date.now(),
      author: postData.author || 'You',
      replies: uniqueReplies(postData.replies || []),
      time: postData.time || 'Just now',
      status: isOnline ? 'synced' : 'pending',
      localOnly: true
    }
    set((state) => ({ posts: [newPost, ...state.posts] }))
    return newPost
  },

  updateSyncedPost: (localId, backendPost) => set((state) => {
    const id = backendPost.id ?? backendPost._id ?? localId
    const existingPost = state.posts.find((post) => String(post.id) === String(localId))
    const syncedPost = {
      ...existingPost,
      ...backendPost,
      id,
      replies: uniqueReplies([...(existingPost?.replies || []), ...(backendPost.replies || [])]),
      status: 'synced',
      localOnly: false
    }
    return {
      posts: existingPost
        ? state.posts.map((post) => String(post.id) === String(localId) ? syncedPost : post)
        : [syncedPost, ...state.posts]
    }
  }),

  setPostSyncStatus: (localId, status) => set((state) => ({
    posts: state.posts.map((post) => String(post.id) === String(localId) ? { ...post, status } : post)
  })),

  updateSyncedReply: (postId, localId, serverReply) => get().markReplySynced(localId, {
    ...serverReply,
    discussionId: postId
  }),

  setReplySyncStatus: (postId, localId, status) => set((state) => ({
    localReplies: state.localReplies.map((reply) => String(reply.localId) === String(localId)
      ? { ...reply, discussionId: postId, status }
      : reply)
  }))
}))

export default useDiscussionStore
