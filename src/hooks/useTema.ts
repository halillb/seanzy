import { useEffect, useState } from 'react'

/** Aktif tema (gece=true). Tema değişince yeniden render olur. */
export function useTema(): boolean {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') !== 'light')
  useEffect(() => {
    const h = () => setDark(document.documentElement.getAttribute('data-theme') !== 'light')
    window.addEventListener('estetix-theme-change', h)
    return () => window.removeEventListener('estetix-theme-change', h)
  }, [])
  return dark
}
