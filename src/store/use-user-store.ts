import { create } from 'zustand'
import { User } from '@prisma/client'

interface UserState {
  user: User | null
  setUser: (user: User | null) => void
  updateUser: (userData: Partial<User>) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (userData) => set((state) => ({
    user: state.user ? { ...state.user, ...userData } : null
  }))
}))