import { useMemo, useState } from 'react'

export type SiraDurum = { key: string; dir: 1 | -1 } | null
type Deger = string | number | null | undefined

/** Tablo sıralaması: başlığa tıkla → artan → azalan → kapalı döngüsü. */
export function useSiralama<T>(rows: T[], deger: (row: T, key: string) => Deger, varsayilan: SiraDurum = null) {
  const [sira, setSira] = useState<SiraDurum>(varsayilan)

  const sirali = useMemo(() => {
    if (!sira) return rows
    const arr = [...rows]
    const { key, dir } = sira
    arr.sort((a, b) => {
      const va = deger(a, key), vb = deger(b, key)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'tr', { numeric: true }) * dir
    })
    return arr
    // deger pure kabul edilir; rows/sira değişince yeniden hesaplanır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sira])

  const sirala = (key: string) =>
    setSira((s) => (s && s.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))

  return { sira, sirala, sirali }
}
