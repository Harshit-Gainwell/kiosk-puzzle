import { create } from 'zustand'

type Screen = 'admin' | 'game'

interface AppState {
  currentScreen: Screen
  setScreen: (screen: Screen) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'admin',
  setScreen: (screen) => set({ currentScreen: screen }),
}))
