import { useCallback, useState } from 'react'

/** Tablo sütun görünürlüğü — seçim localStorage'da saklanır. */
export function useKolonlar(anahtar: string, varsayilan: string[]) {
  const [gorunur, setGorunur] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('estetix-kol-' + anahtar)
      if (s) return JSON.parse(s)
    } catch { /* ignore */ }
    return varsayilan
  })

  const toggle = useCallback((key: string) => {
    setGorunur((g) => {
      const yeni = g.includes(key) ? g.filter((k) => k !== key) : [...g, key]
      try { localStorage.setItem('estetix-kol-' + anahtar, JSON.stringify(yeni)) } catch { /* ignore */ }
      return yeni
    })
  }, [anahtar])

  return { gorunur, toggle }
}
