import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import PhoneInput, { telefonGecerli } from './PhoneInput'
import PasswordInput from './PasswordInput'
import { VARSAYILAN_ULKE, type Ulke } from '../data/countries'
import { adFormat, soyadFormat } from '../lib/text'
import Select from './Select'

export interface Personel {
  id: number; ad: string; soyad?: string; ad_soyad?: string
  telefon?: string; email?: string; rol: string; uzmanlik?: string; hizmet_ids?: number[]
}
interface Hizmet { id: number; ad: string; ad_tr?: string; kategori_ad?: string }

const SINIFLAR = [
  'Estetisyen', 'Makyöz', 'Kuaför', 'Masör', 'Cilt Bakım Uzmanı', 'Lazer Uzmanı',
  'Diyetisyen', 'Eğitmen', 'Mesul Müdür', 'Müdür Yardımcısı', 'Kasa / Muhasebe',
  'Resepsiyon', 'Temizlik Görevlisi', 'Servis Görevlisi', 'Stajyer', 'Diğer',
]

interface Props { onClose: () => void; mevcut?: Personel }

export default function PersonelForm({ onClose, mevcut }: Props) {
  const qc = useQueryClient()
  const duzenle = !!mevcut
  const [ad, setAd] = useState(mevcut?.ad || '')
  const [soyad, setSoyad] = useState(mevcut?.soyad || '')
  const [telNat, setTelNat] = useState(() => {
    const d = (mevcut?.telefon || '').replace(/\D/g, '')
    return d.length === 11 && d[0] === '0' ? d.slice(1) : d.length === 10 ? d : ''
  })
  const [telUlke, setTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const [email, setEmail] = useState(mevcut?.email || '')
  const [rol, setRol] = useState(mevcut?.rol === 'mudur' ? 'mudur' : 'personel')
  const [uzmanlik, setUzmanlik] = useState(mevcut?.uzmanlik || '')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [hizmetler, setHizmetler] = useState<Set<number>>(new Set(mevcut?.hizmet_ids ?? []))

  const { data: tumHizmetler } = useQuery({ queryKey: ['hizmetler'], queryFn: () => apiGet<Hizmet[]>('hizmet.php', 'liste') })
  const hizmetGruplari = useMemo(() => {
    const g = new Map<string, Hizmet[]>()
    for (const h of tumHizmetler ?? []) {
      const k = h.kategori_ad || 'Genel'
      if (!g.has(k)) g.set(k, [])
      g.get(k)!.push(h)
    }
    return [...g.entries()]
  }, [tumHizmetler])
  const hizmetTikle = (id: number) => setHizmetler((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const m = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        ad: ad.trim(), soyad: soyad.trim(),
        telefon: telUlke.iso2 === 'tr' ? '0' + telNat : telUlke.dial + telNat,
        email: email.trim() || undefined, rol, uzmanlik: uzmanlik || undefined,
        hizmet_ids: [...hizmetler],
      }
      if (sifre) body.sifre = sifre
      if (duzenle) body.id = mevcut!.id
      return apiPost('personel.php', duzenle ? 'guncelle' : 'ekle', body)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personel'] }); onClose() },
    onError: (e) => setHata((e as Error).message || 'Kayıt başarısız.'),
  })

  const pasif = useMutation({
    mutationFn: () => apiPost('personel.php', 'sil', { id: mevcut!.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personel'] }); onClose() },
  })

  function gonder(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    if (!ad.trim()) { setHata('Ad zorunludur.'); return }
    if (!telefonGecerli(telNat, telUlke)) { setHata('Geçerli telefon girin.'); return }
    if (!duzenle && sifre.length < 6) { setHata('Panel şifresi en az 6 karakter olmalı.'); return }
    m.mutate()
  }

  return (
    <form onSubmit={gonder}>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}
        <div className="form-grid">
          <div className="field" style={{ margin: 0 }}><label>Ad *</label>
            <input className="input" value={ad} onChange={(e) => setAd(adFormat(e.target.value))} autoFocus /></div>
          <div className="field" style={{ margin: 0 }}><label>Soyad</label>
            <input className="input" value={soyad} onChange={(e) => setSoyad(soyadFormat(e.target.value))} /></div>
          <div className="field full" style={{ margin: 0 }}><label>Telefon * <span style={{ color: 'var(--faint)', textTransform: 'none', letterSpacing: 0 }}>(panel girişi)</span></label>
            <PhoneInput national={telNat} country={telUlke} onNational={setTelNat} onCountry={setTelUlke} /></div>
          <div className="field" style={{ margin: 0 }}><label>E-posta</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Görev / Sınıf</label>
            <Select className="input" value={uzmanlik} onChange={(e) => setUzmanlik(e.target.value)}>
              <option value="">Seçiniz</option>
              {SINIFLAR.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select></div>
          <div className="field" style={{ margin: 0 }}><label>Panel Yetkisi</label>
            <Select className="input" value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="personel">Personel (sınırlı)</option>
              <option value="mudur">Müdür (tam yetki)</option>
            </Select></div>
          <div className="field" style={{ margin: 0 }}><label>Panel Şifresi {duzenle ? '(boş = değişmez)' : '*'}</label>
            <PasswordInput value={sifre} onChange={setSifre} placeholder="••••••" /></div>
        </div>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>Verdiği Hizmetler</div>
              <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>Randevuda bu personele sadece bunlar atanır</div>
            </div>
            <span className="badge badge-gold">{hizmetler.size} seçili</span>
          </div>
          {hizmetGruplari.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Önce hizmet tanımlayın.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
            {hizmetGruplari.map(([kat, hizler]) => (
              <div key={kat}>
                <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 8 }}>{kat}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 7 }}>
                  {hizler.map((h) => {
                    const sec = hizmetler.has(h.id)
                    return (
                      <button type="button" key={h.id} onClick={() => hizmetTikle(h.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer',
                          padding: '8px 11px', borderRadius: 9, transition: 'all .12s', textAlign: 'left',
                          background: sec ? 'rgba(201,169,110,.12)' : 'var(--surface2)', color: sec ? 'var(--gold-text)' : 'var(--text2)',
                          border: `1.5px solid ${sec ? 'rgba(201,169,110,.4)' : 'var(--border)'}`,
                        }}>
                        <span style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sec ? 'var(--gold)' : 'transparent', border: sec ? 'none' : '1.5px solid var(--border2)' }}>
                          {sec && <Check size={11} color="#0C0C0D" />}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.ad_tr || h.ad}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="modal-f">
        {duzenle && <button type="button" className="btn btn-sm" style={{ color: '#ff8a7d', marginRight: 'auto' }}
          onClick={async () => { if (await confirmAsync('Personel pasif yapılsın mı?')) pasif.mutate() }}>Pasif Yap</button>}
        <button type="button" className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button type="submit" className="btn btn-gold" disabled={m.isPending}>
          {m.isPending ? <span className="spin" /> : duzenle ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
