import { create } from 'zustand'
import { Match, User } from '@prisma/client'

interface MatchWithCreator extends Match {
  creator: User
  players: { player: User }[]
  _count: { players: number }
}

interface MatchState {
  matches: MatchWithCreator[]
  setMatches: (matches: MatchWithCreator[]) => void
  addMatch: (match: MatchWithCreator) => void
  updateMatch: (id: string, updates: Partial<Match>) => void
  removeMatch: (id: string) => void
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  setMatches: (matches) => set({ matches }),
  addMatch: (match) => set((state) => ({ 
    matches: [match, ...state.matches] 
  })),
  updateMatch: (id, updates) => set((state) => ({
    matches: state.matches.map(match =>
      match.id === id ? { ...match, ...updates } : match
    )
  })),
  removeMatch: (id) => set((state) => ({
    matches: state.matches.filter(match => match.id !== id)
  }))
}))