import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { apiGet } from '../lib/api'

interface Musteri {
  id: number; ad: string; soyad?: string; ad_soyad?: string
  telefon?: string; email?: string; tc?: string
}
interface Props {
  value: string
  onChange: (id: string, label: string) => void
  placeholder?: string
  haricId?: number
}

const adi = (m: Musteri) => m.ad_soyad || `${m.ad} ${m.soyad || ''}`.trim()

export default function MusteriSecici({ value, onChange, placeholder, haricId }: Props) {
  const { data } = useQuery({ queryKey: ['musteriler'], queryFn: () => apiGet<Musteri[]>('musteri.php', 'liste') })
  const [q, setQ] = useState('')
  const [acik, setAcik] = useState(false)
  const [secili, setSecili] = useState('')
  const kapatT = useRef<number | undefined>(undefined)

  const { sonuc, toplam } = useMemo(() => {
    const arr = (data ?? []).filter((m) => m.id !== haricId)
    const t = q.trim().toLocaleLowerCase('tr')
    const eslesen = t
      ? arr.filter((m) => `${m.ad} ${m.soyad || ''} ${m.telefon || ''} ${m.email || ''} ${m.tc || ''}`.toLocaleLowerCase('tr').includes(t))
      : arr
    return { sonuc: eslesen.slice(0, 200), toplam: eslesen.length }
  }, [data, q, haricId])

  function sec(m: Musteri) {
    setSecili(adi(m)); setQ(''); setAcik(false)
    onChange(String(m.id), adi(m))
  }
  function temizle() { setSecili(''); setQ(''); onChange('', '') }

  return (
    <div className="cmb">
      <div className="top-search" style={{ minWidth: 0, margin: 0, background: 'var(--input-bg)' }}>
        <Search size={15} />
        <input
          value={acik ? q : secili}
          placeholder={secili ? '' : placeholder || 'İsim, telefon, e-posta ara…'}
          onFocus={() => { window.clearTimeout(kapatT.current); setAcik(true) }}
          onBlur={() => { kapatT.current = window.setTimeout(() => setAcik(false), 150) }}
          onChange={(e) => { setQ(e.target.value); setAcik(true) }}
        />
        {secili && !acik && (
          <button type="button" onMouseDown={temizle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={15} /></button>
        )}
      </div>
      {acik && (
        <div className="cmb-list">
          {sonuc.length === 0 ? (
            <div className="cmb-empty">Eşleşen müşteri yok.</div>
          ) : <>
            {sonuc.map((m) => (
              <div key={m.id} className={'cmb-item' + (String(m.id) === value ? ' aktif' : '')} onMouseDown={() => sec(m)}>
                {adi(m)}
                <div className="s">{m.telefon || m.email || ''}</div>
              </div>
            ))}
            {toplam > sonuc.length && <div className="cmb-empty" style={{ fontSize: 11 }}>{toplam} sonuçtan ilk {sonuc.length}’i · aramayı daraltın</div>}
          </>}
        </div>
      )}
    </div>
  )
}
