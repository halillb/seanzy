import { create } from 'zustand'

interface MobileNavState {
  sbAcik: boolean
  toggle: () => void
  kapat: () => void
}

export const useMobileNav = create<MobileNavState>((set) => ({
  sbAcik: false,
  toggle: () => set((s) => ({ sbAcik: !s.sbAcik })),
  kapat: () => set({ sbAcik: false }),
}))
