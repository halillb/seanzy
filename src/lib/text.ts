/** İsim standardı — Türkçe duyarlı (i↔İ, ı↔I) */

/** Her kelimenin baş harfi büyük: "ayşe nur" → "Ayşe Nur" */
export function adFormat(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/(^|[\s'-])([a-zçğıiöşü])/g, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('tr'))
}

/** Tamamı büyük: "müşteri" → "MÜŞTERİ" */
export function soyadFormat(s: string): string {
  return s.toLocaleUpperCase('tr')
}

/** Telefonu okunur göster: → "+90 532 123 45 67" (TR), diğerleri olduğu gibi */
export function telGoster(t?: string | null): string {
  if (!t) return '—'
  let d = t.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('90')) d = d.slice(2)
  else if (d.length === 11 && d[0] === '0') d = d.slice(1)
  if (d.length === 10 && d[0] === '5') {
    return '+90 ' + d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6, 8) + ' ' + d.slice(8)
  }
  return t
}
