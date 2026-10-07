import { create } from 'zustand'

const mergePendingItems = (existingItems = [], incomingItems = []) => {
  const merged = Array.isArray(incomingItems) ? [...incomingItems] : []
  existingItems
    .filter((item) => item.status === 'pending')
    .forEach((localItem) => {
      const localId = localItem.id ?? localItem._id
      const existingIndex = localId == null ? -1 : merged.findIndex((item) =>
        String(item.id ?? item._id) === String(localId)
      )
      if (existingIndex < 0) {
        merged.push(localItem)
      } else {
        merged[existingIndex] = { ...merged[existingIndex], ...localItem }
      }
    })
  return merged
}

const useGroupStore = create((set) => ({
  groups: [],

  resetGroups: () => set({ groups: [] }),

  setGroups: (groups) => set((state) => {
    const normalizedGroups = groups.map((group) => ({ ...group, id: group.id ?? group._id }))
    const remoteIds = new Set(normalizedGroups.map((group) => String(group.id)))
    const pendingGroups = state.groups.filter((group) =>
      (group.status === 'pending' || group.localOnly) && !remoteIds.has(String(group.id))
    )
    return {
      groups: [
        ...normalizedGroups.map((group) => ({ ...group, status: 'synced', localOnly: false })),
        ...pendingGroups
      ]
    }
  }),

  updateGroup: (updatedGroup) => set((state) => {
    const normalizedGroup = { ...updatedGroup, id: updatedGroup.id ?? updatedGroup._id }
    return {
      groups: state.groups.map((group) => {
        if (String(group.id ?? group._id) !== String(normalizedGroup.id)) return group
        return {
          ...group,
          ...normalizedGroup,
          members: normalizedGroup.membersPending
            ? normalizedGroup.members ?? group.members ?? []
            : group.membersPending ? group.members : normalizedGroup.members ?? group.members ?? [],
          membersPending: normalizedGroup.membersPending ?? group.membersPending,
          resources: mergePendingItems(group.resources, normalizedGroup.resources),
          posts: mergePendingItems(group.posts, normalizedGroup.posts)
        }
      })
    }
  }),

  addGroup: (groupData, isOnline) => {
    const newGroup = {
      ...groupData,
      id: groupData.id ?? groupData._id ?? Date.now(),
      members: groupData.members || [],
      resources: groupData.resources || [],
      status: isOnline ? 'synced' : 'pending',
      localOnly: true
    }

    set((state) => ({
      groups: [newGroup, ...state.groups]
    }))
    return newGroup
  },

  updateSyncedGroup: (localId, backendGroup) => set((state) => {
    const exists = state.groups.some((group) => String(group.id) === String(localId))
    return {
      groups: exists
        ? state.groups.map((group) => String(group.id) === String(localId)
            ? { ...group, ...backendGroup, status: 'synced', localOnly: true }
            : group)
          : [{ ...backendGroup, status: 'synced', localOnly: true }, ...state.groups]
    }
  }),

  setGroupSyncStatus: (localId, status) => set((state) => ({
    groups: state.groups.map((group) => String(group.id) === String(localId) ? { ...group, status } : group)
  })),
}))

export default useGroupStore