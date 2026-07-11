import { useEffect, useRef, useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { useDil, DILLER } from '../store/dil'

export default function DilSecici({ kompakt }: { kompakt?: boolean }) {
  const { dil, setDil } = useDil()
  const [acik, setAcik] = useState(false)
  const kok = useRef<HTMLDivElement>(null)
  const aktif = DILLER.find((d) => d.kod === dil)
  useEffect(() => {
    if (!acik) return
    const dis = (e: MouseEvent) => { if (kok.current && !kok.current.contains(e.target as Node)) setAcik(false) }
    document.addEventListener('mousedown', dis)
    return () => document.removeEventListener('mousedown', dis)
  }, [acik])

  return (
    <div ref={kok} style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={() => setAcik((v) => !v)} title="Dil / Language" aria-label="Dil"
        style={kompakt ? { width: 36, height: 36 } : { display: 'inline-flex', alignItems: 'center', gap: 7, width: 'auto', padding: '0 12px', height: 38 }}>
        <Globe size={17} />
        {!kompakt && <span style={{ fontSize: 12.5, fontWeight: 500 }}>{aktif?.kod.toUpperCase()}</span>}
      </button>
      {acik && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60, minWidth: 160, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 11, boxShadow: 'var(--shadow-lg)', padding: 6 }}>
          {DILLER.map((d) => {
            const on = d.kod === dil
            return (
              <div key={d.kod} onClick={() => { setDil(d.kod); setAcik(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 13, background: on ? 'rgba(201,169,110,.12)' : 'transparent', color: on ? 'var(--gold-text)' : 'var(--text)' }}>
                <span className={`fi fi-${d.bayrak}`} style={{ width: 18, height: 13, borderRadius: 2, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{d.ad}</span>
                {on && <Check size={14} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
