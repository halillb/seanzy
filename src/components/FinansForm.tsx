import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { apiPost } from '../lib/api'
import Select from './Select'

interface Props { onClose: () => void }

const KATEGORI: Record<'gelir' | 'gider', string[]> = {
  gider: ['Kira', 'Personel Maaşı', 'Malzeme / Stok', 'Fatura (elektrik/su/internet)', 'Pazarlama / Reklam', 'Vergi / Resmi', 'Bakım / Onarım', 'Diğer'],
  gelir: ['Ek Hizmet Geliri', 'Ürün Satışı', 'Diğer Gelir'],
}
const bugun = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

export default function FinansForm({ onClose }: Props) {
  const qc = useQueryClient()
  const [tip, setTip] = useState<'gelir' | 'gider'>('gider')
  const [tutar, setTutar] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [kategori, setKategori] = useState('')
  const [tarih, setTarih] = useState(bugun())
  const [hata, setHata] = useState('')

  const m = useMutation({
    mutationFn: () => apiPost('finans.php', 'ekle', {
      tip, tutar: Number(tutar), aciklama: aciklama.trim(), tarih, kategori: kategori || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finans-liste'] })
      qc.invalidateQueries({ queryKey: ['finans-ozet'] })
      qc.invalidateQueries({ queryKey: ['finans-ozet-bugun'] })
      onClose()
    },
    onError: (e) => setHata((e as Error).message || 'Kayıt başarısız.'),
  })

  function gonder(e: React.FormEvent) {
    e.preventDefault(); setHata('')
    if (!tutar || Number(tutar) <= 0) { setHata('Geçerli tutar girin.'); return }
    if (!aciklama.trim()) { setHata('Açıklama zorunludur.'); return }
    m.mutate()
  }

  const sec = (t: 'gelir' | 'gider') => { setTip(t); setKategori('') }

  return (
    <form onSubmit={gonder}>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {(['gelir', 'gider'] as const).map((t) => {
            const aktif = tip === t
            const gelir = t === 'gelir'
            return (
              <button type="button" key={t} onClick={() => sec(t)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
                  border: `1.5px solid ${aktif ? (gelir ? 'var(--green)' : '#ff8a7d') : 'var(--border)'}`,
                  background: aktif ? (gelir ? 'rgba(46,204,113,.12)' : 'rgba(231,76,60,.1)') : 'var(--surface)',
                  color: aktif ? (gelir ? 'var(--green)' : '#ff8a7d') : 'var(--text2)' }}>
                {gelir ? <TrendingUp size={16} /> : <TrendingDown size={16} />}{gelir ? 'Gelir' : 'Gider'}
              </button>
            )
          })}
        </div>
        <div className="form-grid">
          <div className="field" style={{ margin: 0 }}><label>Tutar (₺) *</label>
            <input className="input" type="number" min={0} step="0.01" value={tutar} onChange={(e) => setTutar(e.target.value)} autoFocus /></div>
          <div className="field" style={{ margin: 0 }}><label>Tarih *</label>
            <input className="input" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} /></div>
          <div className="field full" style={{ margin: 0 }}><label>Açıklama *</label>
            <input className="input" value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder={tip === 'gider' ? 'örn. Haziran kira ödemesi' : 'örn. Ürün satışı'} /></div>
          <div className="field full" style={{ margin: 0 }}><label>Kategori</label>
            <Select className="input" value={kategori} onChange={(e) => setKategori(e.target.value)}>
              <option value="">Seçiniz (opsiyonel)</option>
              {KATEGORI[tip].map((k) => <option key={k} value={k}>{k}</option>)}
            </Select></div>
        </div>
      </div>
      <div className="modal-f">
        <button type="button" className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button type="submit" className="btn btn-gold" disabled={m.isPending}>
          {m.isPending ? <span className="spin" /> : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
