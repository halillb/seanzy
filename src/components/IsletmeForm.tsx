import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../lib/api'
import { adFormat, soyadFormat } from '../lib/text'
import { ISLETME_KATEGORILER } from '../lib/sabitler'
import Select from './Select'
import PasswordInput from './PasswordInput'
import PhoneInput from './PhoneInput'
import { VARSAYILAN_ULKE, type Ulke } from '../data/countries'

interface Props { onClose: () => void }
interface SaPaket { id: number; ad: string; kod: string; fiyat: number; aktif: boolean }
const slugify = (s: string) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function IsletmeForm({ onClose }: Props) {
  const qc = useQueryClient()
  const paketlerQ = useQuery({ queryKey: ['sa-paketler'], queryFn: () => apiGet<SaPaket[]>('superadmin.php', 'paketler') })
  const [ad, setAd] = useState('')
  const [slug, setSlug] = useState('')
  const [slugDokunuldu, setSlugDokunuldu] = useState(false)
  const [telNat, setTelNat] = useState('')
  const [telUlke, setTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const telefon = telNat ? (telUlke.iso2 === 'tr' ? '0' + telNat : telUlke.dial + telNat) : ''
  const [paket, setPaket] = useState('pro')
  const [kategori, setKategori] = useState('')
  const [kategoriDiger, setKategoriDiger] = useState('')
  const [mAd, setMAd] = useState('')
  const [mSoyad, setMSoyad] = useState('')
  const [mTelNat, setMTelNat] = useState('')
  const [mTelUlke, setMTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const mTel = mTelUlke.iso2 === 'tr' ? '0' + mTelNat : mTelUlke.dial + mTelNat
  const [mSifre, setMSifre] = useState('')
  const [hata, setHata] = useState('')

  const setIsletmeAd = (v: string) => { setAd(v); if (!slugDokunuldu) setSlug(slugify(v)) }
  const paketler = (paketlerQ.data ?? []).filter((p) => p.aktif)

  const m = useMutation({
    mutationFn: () => apiPost('superadmin.php', 'ekle', {
      isletme_adi: ad.trim(),
      slug: slug.trim(),
      telefon: telefon.trim() || undefined,
      paket_turu: paket,
      mudur_ad: mAd.trim(),
      mudur_soyad: mSoyad.trim() || undefined,
      mudur_telefon: mTel.trim(),
      mudur_sifre: mSifre,
      isletme_kategorisi: kategori || undefined,
      isletme_kategorisi_diger: kategori === 'Diğer' ? kategoriDiger.trim() || undefined : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-isletmeler'] }); onClose() },
    onError: (e) => setHata((e as Error).message || 'Kayıt başarısız.'),
  })

  function gonder(e: React.FormEvent) {
    e.preventDefault(); setHata('')
    if (!ad.trim()) { setHata('İşletme adı zorunlu.'); return }
    if (!slug.trim()) { setHata('İşletme kodu (slug) zorunlu.'); return }
    if (!mAd.trim() || !mTel.trim()) { setHata('Müdür ad ve telefon zorunlu.'); return }
    if (mSifre.length < 6) { setHata('Müdür şifresi en az 6 karakter.'); return }
    m.mutate()
  }

  return (
    <form onSubmit={gonder}>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}
        <div className="form-grid">
          <div className="field full" style={{ margin: 0 }}><label>İşletme Adı *</label>
            <input className="input" value={ad} onChange={(e) => setIsletmeAd(e.target.value)} autoFocus /></div>

          <div className="field" style={{ margin: 0 }}><label>İşletme Kodu (giriş) *</label>
            <input className="input" value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugDokunuldu(true) }} placeholder="orn-guzellik" /></div>

          <div className="field" style={{ margin: 0 }}><label>Paket</label>
            <Select className="input" value={paket} onChange={(e) => setPaket(e.target.value)}>
              {paketler.length > 0
                ? paketler.map((p) => <option key={p.kod} value={p.kod}>{p.ad}</option>)
                : <>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </>
              }
            </Select>
          </div>

          <div className="field full" style={{ margin: 0 }}><label>İşletme Telefonu</label>
            <PhoneInput national={telNat} country={telUlke} onNational={setTelNat} onCountry={setTelUlke} /></div>

          <div className="field full" style={{ margin: 0 }}>
            <label>İşletme Kategorisi</label>
            <Select className="input" value={kategori} onChange={(e) => setKategori(e.target.value)}>
              <option value="">Seçiniz…</option>
              {ISLETME_KATEGORILER.map((k) => <option key={k} value={k}>{k}</option>)}
            </Select>
          </div>

          {kategori === 'Diğer' && (
            <div className="field full" style={{ margin: 0 }}>
              <label>Kategori (Diğer)</label>
              <input className="input" value={kategoriDiger} onChange={(e) => setKategoriDiger(e.target.value)} placeholder="Kategoriyi yazın…" />
            </div>
          )}

          <div className="full" style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 2, fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Müdür Hesabı (panel girişi)</div>
          <div className="field" style={{ margin: 0 }}><label>Müdür Adı *</label>
            <input className="input" value={mAd} onChange={(e) => setMAd(adFormat(e.target.value))} /></div>
          <div className="field" style={{ margin: 0 }}><label>Müdür Soyadı</label>
            <input className="input" value={mSoyad} onChange={(e) => setMSoyad(soyadFormat(e.target.value))} /></div>
          <div className="field" style={{ margin: 0 }}><label>Müdür Telefonu *</label>
            <PhoneInput national={mTelNat} country={mTelUlke} onNational={setMTelNat} onCountry={setMTelUlke} /></div>
          <div className="field" style={{ margin: 0 }}><label>Müdür Şifresi *</label>
            <PasswordInput value={mSifre} onChange={setMSifre} placeholder="en az 6 karakter" /></div>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12 }}>Müdür, <b>işletme kodu + telefon + şifre</b> ile giriş yapar.</p>
      </div>
      <div className="modal-f">
        <button type="button" className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button type="submit" className="btn btn-gold" disabled={m.isPending}>{m.isPending ? <span className="spin" /> : 'Oluştur'}</button>
      </div>
    </form>
  )
}
