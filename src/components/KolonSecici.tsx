import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, Check } from 'lucide-react'
import { useT } from '../lib/ceviri'

interface Props {
  kolonlar: { key: string; label: string }[]
  gorunur: string[]
  toggle: (key: string) => void
}

export default function KolonSecici({ kolonlar, gorunur, toggle }: Props) {
  const t = useT()
  const [acik, setAcik] = useState(false)
  const kok = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!acik) return
    const dis = (e: MouseEvent) => { if (kok.current && !kok.current.contains(e.target as Node)) setAcik(false) }
    document.addEventListener('mousedown', dis)
    return () => document.removeEventListener('mousedown', dis)
  }, [acik])

  return (
    <div className="kol-wrap" ref={kok}>
      <button className="btn btn-sm btn-ghost" onClick={() => setAcik((v) => !v)}>
        <SlidersHorizontal size={15} /> {t('genel.sutunlar')}
      </button>
      {acik && (
        <div className="kol-pop">
          {kolonlar.map((k) => {
            const on = gorunur.includes(k.key)
            return (
              <div className="kol-item" key={k.key} onClick={() => toggle(k.key)}>
                <span className={'kol-check' + (on ? ' on' : '')}>{on && <Check size={12} strokeWidth={3} />}</span>
                {k.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
