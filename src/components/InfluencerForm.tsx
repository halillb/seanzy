import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../lib/api'
import PhoneInput, { telefonGecerli } from './PhoneInput'
import { VARSAYILAN_ULKE, type Ulke } from '../data/countries'
import Select from './Select'

export interface Influencer {
  id: number; ad: string; platform?: string; kullanici_adi?: string
  kod?: string; komisyon_tip?: string; komisyon_deger?: number; telefon?: string; notlar?: string
}

interface Props { onClose: () => void; onSaved?: (inf: Influencer) => void; adOn?: string }

const PLATFORMLAR = ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Facebook', 'Snapchat', 'Diğer']

export default function InfluencerForm({ onClose, onSaved, adOn }: Props) {
  const qc = useQueryClient()
  const [ad, setAd] = useState(adOn || '')
  const [platform, setPlatform] = useState('Instagram')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [kod, setKod] = useState('')
  const [komisyonTip, setKomisyonTip] = useState('yuzde')
  const [komisyonDeger, setKomisyonDeger] = useState('')
  const [telNat, setTelNat] = useState('')
  const [telUlke, setTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const [notlar, setNotlar] = useState('')
  const [hata, setHata] = useState('')

  const m = useMutation({
    mutationFn: () => apiPost<Influencer>('influencer.php', 'ekle', {
      ad: ad.trim(), platform, kullanici_adi: kullaniciAdi.trim() || undefined,
      kod: kod.trim() || undefined, komisyon_tip: komisyonTip,
      komisyon_deger: komisyonDeger ? Number(komisyonDeger) : undefined,
      telefon: telNat ? (telUlke.iso2 === 'tr' ? '0' + telNat : telUlke.dial + telNat) : undefined,
      notlar: notlar.trim() || undefined,
    }),
    onSuccess: (inf) => { qc.invalidateQueries({ queryKey: ['influencerlar'] }); onSaved?.(inf); onClose() },
    onError: (e) => setHata((e as Error).message || 'Kayıt başarısız.'),
  })

  function gonder(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    if (!ad.trim()) { setHata('Influencer adı zorunludur.'); return }
    if (telNat && !telefonGecerli(telNat, telUlke)) { setHata('Telefon geçersiz.'); return }
    m.mutate()
  }

  return (
    <form onSubmit={gonder}>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}
        <div className="form-grid">
          <div className="field" style={{ margin: 0 }}><label>Ad / Marka *</label>
            <input className="input" value={ad} onChange={(e) => setAd(e.target.value)} autoFocus placeholder="örn. Güzellik Blog" /></div>
          <div className="field" style={{ margin: 0 }}><label>Platform</label>
            <Select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMLAR.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select></div>
          <div className="field" style={{ margin: 0 }}><label>Kullanıcı Adı</label>
            <input className="input" value={kullaniciAdi} onChange={(e) => setKullaniciAdi(e.target.value)} placeholder="@kullanici" /></div>
          <div className="field" style={{ margin: 0 }}><label>İndirim / Takip Kodu</label>
            <input className="input" value={kod} onChange={(e) => setKod(e.target.value)} placeholder="örn. AYSE20" /></div>
          <div className="field" style={{ margin: 0 }}><label>Komisyon Tipi</label>
            <Select className="input" value={komisyonTip} onChange={(e) => setKomisyonTip(e.target.value)}>
              <option value="yuzde">Yüzde (%)</option><option value="sabit">Sabit (₺/müşteri)</option>
            </Select></div>
          <div className="field" style={{ margin: 0 }}><label>Komisyon Değeri</label>
            <input className="input" type="number" min={0} value={komisyonDeger} onChange={(e) => setKomisyonDeger(e.target.value)}
              placeholder={komisyonTip === 'yuzde' ? 'örn. 10' : 'örn. 250'} /></div>
          <div className="field full" style={{ margin: 0 }}><label>Telefon (opsiyonel)</label>
            <PhoneInput national={telNat} country={telUlke} onNational={setTelNat} onCountry={setTelUlke} /></div>
          <div className="field full" style={{ margin: 0 }}><label>Notlar</label>
            <input className="input" value={notlar} onChange={(e) => setNotlar(e.target.value)} placeholder="Anlaşma detayı…" /></div>
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
