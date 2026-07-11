const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

/** ISO (2026-05-24 / 2026-05-24T..) → "24.05.2026". Boş/geçersizse "—". */
export function trTarih(iso?: string | null): string {
  if (!iso) return '—'
  const s = String(iso).slice(0, 10)
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return String(iso)
  return `${d}.${m}.${y}`
}

/** "24.05.2026 Pazartesi" — önemli yerlerde. */
export function trTarihGun(iso?: string | null): string {
  if (!iso) return '—'
  const s = String(iso).slice(0, 10)
  const dt = new Date(s + 'T00:00')
  if (isNaN(dt.getTime())) return trTarih(iso)
  return `${trTarih(s)} ${GUNLER[dt.getDay()]}`
}

/** Saat dilimi: "14:30" (HH:MM:SS → HH:MM). */
export function trSaat(s?: string | null): string {
  return s ? String(s).slice(0, 5) : ''
}
