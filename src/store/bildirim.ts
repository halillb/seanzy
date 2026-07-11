import { create } from 'zustand'
import { sesCal, seciliSes } from '../lib/sounds'
export { sesCal, seciliSes }

export type BildirimTip = 'randevu' | 'musteri' | 'finans' | 'sistem'

export interface Bildirim {
  id: number
  serverId?: number   // DB'deki id (yoksa lokal)
  baslik: string
  mesaj: string
  ts: number
  okundu: boolean
  tip: BildirimTip
  link?: string
}

interface State {
  liste: Bildirim[]
  yuklendiServerIdler: Set<number>
  ekle: (b: { baslik: string; mesaj: string; tip?: BildirimTip; link?: string; ts?: number }) => void
  ekleServer: (items: Bildirim[]) => void
  oku: (id: number) => void
  tumunuOku: () => void
}

const DK = 60 * 1000, SAAT = 60 * DK
let sayac = 100

export const useBildirim = create<State>((set) => ({
  liste: [],
  yuklendiServerIdler: new Set(),
  ekle: (b) =>
    set((s) => {
      sesCal(seciliSes())
      const yeni: Bildirim = { id: ++sayac, okundu: false, ts: b.ts ?? Date.now(), tip: b.tip || 'sistem', baslik: b.baslik, mesaj: b.mesaj, link: b.link }
      return { liste: [yeni, ...s.liste] }
    }),
  ekleServer: (items) =>
    set((s) => {
      const yeniIdler = new Set(s.yuklendiServerIdler)
      const yeniListe = [...s.liste]
      for (const item of items) {
        if (item.serverId && yeniIdler.has(item.serverId)) continue
        if (item.serverId) yeniIdler.add(item.serverId)
        yeniListe.unshift(item)
      }
      yeniListe.sort((a, b) => b.ts - a.ts)
      return { liste: yeniListe, yuklendiServerIdler: yeniIdler }
    }),
  oku: (id) => set((s) => ({ liste: s.liste.map((x) => (x.id === id ? { ...x, okundu: true } : x)) })),
  tumunuOku: () => set((s) => ({ liste: s.liste.map((x) => ({ ...x, okundu: true })) })),
}))

/** Canlı zaman gösterimi: yeni → "X dk/saat önce", 24 saatten eski → tarih + saat. */
export function zamanGoster(ts: number): string {
  const fark = Date.now() - ts
  if (fark < DK) return 'şimdi'
  if (fark < SAAT) return `${Math.floor(fark / DK)} dk önce`
  if (fark < 24 * SAAT) return `${Math.floor(fark / SAAT)} saat önce`
  const d = new Date(ts)
  const bugun = new Date()
  const dun = fark < 48 * SAAT && d.getDate() !== bugun.getDate()
  const saat = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  if (dun) return `Dün ${saat}`
  return `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${saat}`
}
