import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { ULKELER, type Ulke } from '../data/countries'

interface Props { value: Ulke; onChange: (u: Ulke) => void }

export default function CountrySelect({ value, onChange }: Props) {
  const [acik, setAcik] = useState(false)
  const [q, setQ] = useState('')
  const kok = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!acik) return
    const dis = (e: MouseEvent) => { if (kok.current && !kok.current.contains(e.target as Node)) setAcik(false) }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAcik(false)
    document.addEventListener('mousedown', dis)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', dis); document.removeEventListener('keydown', esc) }
  }, [acik])

  const liste = useMemo(() => {
    const t = q.trim().toLocaleLowerCase('tr')
    if (!t) {
      const tr = ULKELER.find((u) => u.iso2 === 'tr')!
      return [tr, ...ULKELER.filter((u) => u.iso2 !== 'tr')]
    }
    return ULKELER.filter((u) =>
      u.ad.toLocaleLowerCase('tr').includes(t) || u.dial.includes(t) || u.iso2.includes(t),
    )
  }, [q])

  return (
    <div className="cc-sel" ref={kok}>
      <button type="button" className="cc-btn" onClick={() => { setAcik((v) => !v); setQ('') }}>
        <span className={`fi fi-${value.iso2}`} style={{ fontSize: 17 }} />
        <span className="dl">{value.dial}</span>
        <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
      </button>
      {acik && (
        <div className="cc-pop">
          <div className="cc-search">
            <Search size={15} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ülke ara…" />
          </div>
          <div className="cc-list">
            {liste.length === 0 ? (
              <div className="cmb-empty">Ülke bulunamadı.</div>
            ) : liste.map((u) => (
              <div key={u.iso2} className={'cc-item' + (u.iso2 === value.iso2 ? ' aktif' : '')}
                onClick={() => { onChange(u); setAcik(false) }}>
                <span className={`fi fi-${u.iso2}`} style={{ fontSize: 17 }} />
                <span className="nm">{u.ad}</span>
                <span className="dl">{u.dial}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
