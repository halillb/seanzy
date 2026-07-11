import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../lib/api'
import PhoneInput, { telefonGecerli } from './PhoneInput'
import PasswordInput from './PasswordInput'
import MusteriSecici from './MusteriSecici'
import InfluencerSecici from './InfluencerSecici'
import { VARSAYILAN_ULKE, type Ulke } from '../data/countries'
import { adFormat, soyadFormat } from '../lib/text'
import Select from './Select'

export interface MusteriDuzenle {
  id: number; ad?: string; soyad?: string; telefon?: string; email?: string
  cinsiyet?: string; dogum_tarihi?: string; instagram?: string; indirim?: number
  notlar?: string; kaynak?: string; kaynak_detay?: string
}
interface Props { onClose: () => void; mevcut?: MusteriDuzenle }

const KAYNAKLAR: [string, string][] = [
  ['reklam', 'Reklam'], ['eski_musteri', 'Eski Müşteri'],
  ['referans', 'Referans / Tavsiye'], ['tabela', 'Tabela / Geçerken'], ['diger', 'Diğer'],
]
const REKLAM: [string, string][] = [
  ['google', 'Google'], ['google_haritalar', 'Google Haritalar'], ['meta', 'Meta (Instagram/Facebook)'],
  ['tiktok', 'TikTok'], ['tanitim', 'Tanıtım'], ['influencer', 'Influencer'], ['diger', 'Diğer'],
]

const bos = { ad: '', soyad: '', email: '', cinsiyet: '', dogum_tarihi: '', instagram: '', indirim: '', notlar: '', sifre: '' }

export default function MusteriForm({ onClose, mevcut }: Props) {
  const qc = useQueryClient()
  const duzenle = !!mevcut
  const [f, setF] = useState(mevcut ? {
    ad: mevcut.ad || '', soyad: mevcut.soyad || '', email: mevcut.email || '', cinsiyet: mevcut.cinsiyet || '',
    dogum_tarihi: (mevcut.dogum_tarihi || '').slice(0, 10), instagram: mevcut.instagram || '',
    indirim: mevcut.indirim != null ? String(mevcut.indirim) : '', notlar: mevcut.notlar || '', sifre: '',
  } : { ...bos })
  const [telNat, setTelNat] = useState(() => { const d = (mevcut?.telefon || '').replace(/\D/g, ''); return d.length === 11 && d[0] === '0' ? d.slice(1) : d.length === 10 ? d : '' })
  const [telUlke, setTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const [kaynak, setKaynak] = useState(mevcut?.kaynak || '')
  const [reklamDetay, setReklamDetay] = useState('')
  const [serbest, setSerbest] = useState('')
  const [referansId, setReferansId] = useState('')
  const [influencerId, setInfluencerId] = useState('')
  const [influencerAd, setInfluencerAd] = useState('')
  const [hata, setHata] = useState('')
  const set = (k: keyof typeof bos, v: string) => setF((p) => ({ ...p, [k]: v }))

  function kaynakDetayHesap(): string | undefined {
    if (kaynak === 'reklam') {
      if (reklamDetay === 'influencer') return influencerAd ? `Influencer: ${influencerAd}` : 'Influencer'
      if (reklamDetay === 'diger') return serbest.trim() || 'Diğer'
      const r = REKLAM.find((x) => x[0] === reklamDetay)
      return r ? r[1] : undefined
    }
    if (kaynak === 'diger') return serbest.trim() || undefined
    return undefined
  }

  const m = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        ad: f.ad.trim(), soyad: f.soyad.trim(),
        telefon: telUlke.iso2 === 'tr' ? '0' + telNat : telUlke.dial + telNat,
        email: f.email.trim() || undefined, cinsiyet: f.cinsiyet || undefined,
        dogum_tarihi: f.dogum_tarihi || undefined, instagram: f.instagram.trim() || undefined,
        indirim: f.indirim ? Number(f.indirim) : undefined, notlar: f.notlar.trim() || undefined,
        kaynak: kaynak || undefined,
        kaynak_detay: kaynakDetayHesap() ?? (duzenle ? mevcut?.kaynak_detay : undefined),
        referans_id: kaynak === 'referans' && referansId ? Number(referansId) : undefined,
        influencer_id: reklamDetay === 'influencer' && influencerId ? Number(influencerId) : undefined,
      }
      if (duzenle) {
        body.id = mevcut!.id
        if (f.sifre.trim()) body.sifre = f.sifre.trim()
        return apiPost('musteri.php', 'guncelle', body)
      }
      if (f.sifre.trim()) body.sifre = f.sifre.trim()
      return apiPost('musteri.php', 'ekle', body)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['musteriler'] }); onClose() },
    onError: (e) => setHata((e as Error).message || 'Kayıt başarısız.'),
  })

  function gonder(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    if (!f.ad.trim()) { setHata('Ad zorunludur.'); return }
    if (!telefonGecerli(telNat, telUlke)) { setHata('Geçerli telefon girin.'); return }
    if (!duzenle && f.sifre.trim() && f.sifre.trim().length < 6) { setHata('Şifre en az 6 karakter olmalı.'); return }
    if (duzenle && f.sifre.trim() && f.sifre.trim().length < 6) { setHata('Şifre en az 6 karakter olmalı.'); return }
    m.mutate()
  }

  return (
    <form onSubmit={gonder}>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}
        <div className="form-grid">
          <div className="field" style={{ margin: 0 }}><label>Ad *</label>
            <input className="input" value={f.ad} onChange={(e) => set('ad', adFormat(e.target.value))} autoFocus /></div>
          <div className="field" style={{ margin: 0 }}><label>Soyad</label>
            <input className="input" value={f.soyad} onChange={(e) => set('soyad', soyadFormat(e.target.value))} /></div>
          <div className="field full" style={{ margin: 0 }}><label>Telefon *</label>
            <PhoneInput national={telNat} country={telUlke} onNational={setTelNat} onCountry={setTelUlke} /></div>
          <div className="field" style={{ margin: 0 }}><label>E-posta</label>
            <input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Cinsiyet</label>
            <Select className="input" value={f.cinsiyet} onChange={(e) => set('cinsiyet', e.target.value)}>
              <option value="">Seçiniz</option><option value="kadin">Kadın</option><option value="erkek">Erkek</option></Select></div>
          <div className="field" style={{ margin: 0 }}><label>Doğum Tarihi</label>
            <input className="input" type="date" value={f.dogum_tarihi} onChange={(e) => set('dogum_tarihi', e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Instagram</label>
            <input className="input" value={f.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@kullanici" /></div>
          <div className="full" style={{ borderTop: '1px solid var(--border)', margin: 0 }} />

          <div className="field" style={{ margin: 0 }}><label>İndirim (%)</label>
            <input className="input" type="number" min={0} max={100} value={f.indirim} onChange={(e) => set('indirim', e.target.value)} /></div>

          <div className="field" style={{ margin: 0 }}>
            <label>Müşteri Nereden Geldi?</label>
            <Select className="input" value={kaynak} onChange={(e) => { setKaynak(e.target.value); setReklamDetay(''); setSerbest(''); setReferansId('') }}>
              <option value="">Seçiniz</option>
              {KAYNAKLAR.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </div>

          {kaynak === 'reklam' && (
            <div className="field" style={{ margin: 0, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <label>Reklam Kaynağı</label>
              <Select className="input" value={reklamDetay} onChange={(e) => { setReklamDetay(e.target.value); setSerbest('') }}>
                <option value="">Seçiniz</option>
                {REKLAM.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </div>
          )}
          {kaynak === 'reklam' && reklamDetay === 'influencer' && (
            <div className="field full" style={{ margin: 0 }}>
              <label>Influencer</label>
              <InfluencerSecici value={influencerId} onChange={(id, label) => { setInfluencerId(id); setInfluencerAd(label) }} />
            </div>
          )}
          {kaynak === 'reklam' && reklamDetay === 'diger' && (
            <div className="field full" style={{ margin: 0 }}>
              <label>Açıklama</label>
              <input className="input" value={serbest} onChange={(e) => setSerbest(e.target.value)} />
            </div>
          )}
          {kaynak === 'referans' && (
            <div className="field full" style={{ margin: 0 }}>
              <label>Kim Getirdi?</label>
              <MusteriSecici value={referansId} onChange={(id) => setReferansId(id)} />
            </div>
          )}
          {kaynak === 'diger' && (
            <div className="field full" style={{ margin: 0 }}>
              <label>Açıklama</label>
              <input className="input" value={serbest} onChange={(e) => setSerbest(e.target.value)} />
            </div>
          )}

          <div className="field full" style={{ margin: 0 }}>
            <label>{duzenle ? 'Yeni Şifre (boş bırakılırsa değişmez)' : 'Şifre (boş bırakılırsa otomatik)'}</label>
            <PasswordInput value={f.sifre} onChange={(v) => set('sifre', v)}
              placeholder={duzenle ? 'En az 6 karakter' : 'Boş bırakılabilir'} autoComplete="new-password" />
          </div>
          <div className="field full" style={{ margin: 0 }}><label>Notlar</label>
            <input className="input" value={f.notlar} onChange={(e) => set('notlar', e.target.value)} /></div>
        </div>
      </div>
      <div className="modal-f">
        <button type="button" className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button type="submit" className="btn btn-gold" disabled={m.isPending}>
          {m.isPending ? <span className="spin" /> : duzenle ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
