import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, X } from 'lucide-react'
import { apiGet } from '../lib/api'
import Modal from './Modal'
import InfluencerForm, { type Influencer } from './InfluencerForm'

interface Props {
  value: string
  onChange: (id: string, label: string) => void
}

export default function InfluencerSecici({ value, onChange }: Props) {
  const { data } = useQuery({ queryKey: ['influencerlar'], queryFn: () => apiGet<Influencer[]>('influencer.php', 'liste') })
  const [q, setQ] = useState('')
  const [acik, setAcik] = useState(false)
  const [secili, setSecili] = useState('')
  const [ekleAcik, setEkleAcik] = useState(false)
  const kapatT = useRef<number | undefined>(undefined)

  const sonuc = useMemo(() => {
    const arr = data ?? []
    const t = q.trim().toLocaleLowerCase('tr')
    if (!t) return arr.slice(0, 8)
    return arr.filter((i) => `${i.ad} ${i.kullanici_adi || ''} ${i.kod || ''}`.toLocaleLowerCase('tr').includes(t)).slice(0, 8)
  }, [data, q])

  function sec(i: Influencer) {
    setSecili(i.ad); setQ(''); setAcik(false)
    onChange(String(i.id), i.ad)
  }
  function temizle() { setSecili(''); setQ(''); onChange('', '') }

  return (
    <div className="cmb">
      <div className="top-search" style={{ minWidth: 0, margin: 0, background: 'var(--input-bg)' }}>
        <Search size={15} />
        <input
          value={acik ? q : secili}
          placeholder={secili ? '' : 'Influencer ara veya ekle…'}
          onFocus={() => { window.clearTimeout(kapatT.current); setAcik(true) }}
          onBlur={() => { kapatT.current = window.setTimeout(() => setAcik(false), 160) }}
          onChange={(e) => { setQ(e.target.value); setAcik(true) }}
        />
        {secili && !acik && (
          <button type="button" onMouseDown={temizle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={15} /></button>
        )}
      </div>
      {acik && (
        <div className="cmb-list">
          {sonuc.map((i) => (
            <div key={i.id} className={'cmb-item' + (String(i.id) === value ? ' aktif' : '')} onMouseDown={() => sec(i)}>
              {i.ad}
              <div className="s">{[i.platform, i.kullanici_adi, i.kod].filter(Boolean).join(' · ')}</div>
            </div>
          ))}
          {sonuc.length === 0 && <div className="cmb-empty">Kayıtlı influencer yok.</div>}
          <div className="cmb-add" onMouseDown={(e) => { e.preventDefault(); setEkleAcik(true); setAcik(false) }}>
            <Plus size={15} /> {q.trim() ? `"${q.trim()}" adıyla yeni ekle` : 'Yeni influencer ekle'}
          </div>
        </div>
      )}

      <Modal open={ekleAcik} onClose={() => setEkleAcik(false)} title="Yeni Influencer">
        <InfluencerForm adOn={q.trim()} onClose={() => setEkleAcik(false)} onSaved={(inf) => sec(inf)} />
      </Modal>
    </div>
  )
}
