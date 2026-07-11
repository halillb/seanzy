import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Select from './Select'

const SAYFA_BOYUTU_SECENEK = [20, 30, 40, 50]

interface Props {
  toplam: number
  sayfaBoyutu: number
  setSayfaBoyutu: (n: number) => void
  sayfa: number
  setSayfa: (n: number) => void
  tumunuGor: boolean
  setTumunuGor: (v: boolean) => void
}

/** Sayfa boyutu + sayfa numarası state'ini yönetir; use listeyi dilimlemek için `usePagination(liste)` kullan. */
export function usePagination<T>(liste: T[]) {
  const [sayfaBoyutu, setSayfaBoyutu] = useState(20)
  const [sayfa, setSayfa] = useState(1)
  const [tumunuGor, setTumunuGor] = useState(false)

  const toplam = liste.length
  const toplamSayfa = Math.max(1, Math.ceil(toplam / sayfaBoyutu))
  const guvenliSayfa = Math.min(sayfa, toplamSayfa)

  const sayfalanan = useMemo(() => {
    if (tumunuGor) return liste
    const bas = (guvenliSayfa - 1) * sayfaBoyutu
    return liste.slice(bas, bas + sayfaBoyutu)
  }, [liste, tumunuGor, guvenliSayfa, sayfaBoyutu])

  return {
    sayfalanan, toplam, toplamSayfa, sayfa: guvenliSayfa,
    props: {
      toplam, sayfaBoyutu, setSayfaBoyutu: (n: number) => { setSayfaBoyutu(n); setSayfa(1) },
      sayfa: guvenliSayfa, setSayfa,
      tumunuGor, setTumunuGor,
    } satisfies Props,
  }
}

export default function Pagination({ toplam, sayfaBoyutu, setSayfaBoyutu, sayfa, setSayfa, tumunuGor, setTumunuGor }: Props) {
  const toplamSayfa = Math.max(1, Math.ceil(toplam / sayfaBoyutu))
  if (toplam === 0) return null

  const basIdx = tumunuGor ? 1 : (sayfa - 1) * sayfaBoyutu + 1
  const bitIdx = tumunuGor ? toplam : Math.min(sayfa * sayfaBoyutu, toplam)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '10px 4px' }}>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
        {basIdx}–{bitIdx} / {toplam} kayıt
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!tumunuGor && (
          <>
            <Select className="input" style={{ padding: '6px 10px', fontSize: 12, width: 'auto' }}
              value={String(sayfaBoyutu)} onChange={(e) => setSayfaBoyutu(Number(e.target.value))}>
              {SAYFA_BOYUTU_SECENEK.map((n) => <option key={n} value={n}>{n} / sayfa</option>)}
            </Select>
            <button className="btn btn-sm btn-ghost" style={{ padding: '6px 9px' }} disabled={sayfa <= 1} onClick={() => setSayfa(sayfa - 1)}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 50, textAlign: 'center' }}>{sayfa} / {toplamSayfa}</span>
            <button className="btn btn-sm btn-ghost" style={{ padding: '6px 9px' }} disabled={sayfa >= toplamSayfa} onClick={() => setSayfa(sayfa + 1)}><ChevronRight size={14} /></button>
          </>
        )}
        <button className="btn btn-sm btn-ghost" onClick={() => setTumunuGor(!tumunuGor)}>
          {tumunuGor ? 'Sayfalara Böl' : 'Tümünü Gör'}
        </button>
      </div>
    </div>
  )
}
