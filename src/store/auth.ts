import { create } from 'zustand'

export interface Kullanici {
  id: number
  ad: string
  soyad?: string
  rol: string
  tenant_id: number
  isletme_adi?: string
  erisim?: string
  paket_turu?: string
  [k: string]: unknown
}

interface AuthState {
  token: string | null
  user: Kullanici | null
  setAuth: (token: string, user: Kullanici) => void
  patchUser: (partial: Partial<Kullanici>) => void
  logout: () => void
}

function readUser(): Kullanici | null {
  try {
    return JSON.parse(localStorage.getItem('estetix-user') || 'null')
  } catch {
    return null
  }
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('estetix-token'),
  user: readUser(),
  setAuth: (token, user) => {
    localStorage.setItem('estetix-token', token)
    localStorage.setItem('estetix-user', JSON.stringify(user))
    set({ token, user })
  },
  patchUser: (partial) => set((s) => {
    if (!s.user) return {}
    const updated = { ...s.user, ...partial }
    localStorage.setItem('estetix-user', JSON.stringify(updated))
    return { user: updated }
  }),
  logout: () => {
    localStorage.removeItem('estetix-token')
    localStorage.removeItem('estetix-user')
    set({ token: null, user: null })
  },
}))
