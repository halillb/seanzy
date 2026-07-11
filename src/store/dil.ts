import { create } from 'zustand'

export type Dil = 'tr' | 'en' | 'ar'
export const DILLER: { kod: Dil; ad: string; bayrak: string }[] = [
  { kod: 'tr', ad: 'Türkçe', bayrak: 'tr' },
  { kod: 'en', ad: 'English', bayrak: 'gb' },
  { kod: 'ar', ad: 'العربية', bayrak: 'sa' },
]

interface DilState { dil: Dil; setDil: (d: Dil) => void }

function oku(): Dil {
  const d = localStorage.getItem('estetix-dil') as Dil | null
  return d === 'en' || d === 'ar' || d === 'tr' ? d : 'tr'
}

export const useDil = create<DilState>((set) => ({
  dil: oku(),
  setDil: (d) => {
    localStorage.setItem('estetix-dil', d)
    document.documentElement.setAttribute('dir', d === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', d)
    set({ dil: d })
  },
}))

// İlk yüklemede yön/dil özniteliği
document.documentElement.setAttribute('dir', oku() === 'ar' ? 'rtl' : 'ltr')
document.documentElement.setAttribute('lang', oku())
