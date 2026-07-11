import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, AlertTriangle, BadgePercent } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import Select from './Select'

interface Kategori { id: number; ad_tr: string; cinsiyet_ayrimi?: boolean }
interface HizmetKatalog {
  id: number; ad_tr: string; fiyat: number; sure_dk: number
  kategori_id?: number; cinsiyet?: 'genel' | 'bayan' | 'erkek'
}
interface Props { onClose: () => void }

const tl = (n: number) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'

export default function PaketKur({ onClose }: Props) {
  const qc = useQueryClient()
  const { data: kategoriler } = useQuery({ queryKey: ['kategoriler'], queryFn: () => apiGet<Kategori[]>('hizmet.php', 'kategoriler') })
  const { data: hizmetler } = useQuery({ queryKey: ['hizmetler'], queryFn: () => apiGet<HizmetKatalog[]>('hizmet.php', 'liste') })

  const [ad, setAd] = useState('')
  const [katId, setKatId] = useState('')
  const [cinsiyet, setCinsiyet] = useState<'bayan' | 'erkek'>('bayan')
  const [fiyat, setFiyat] = useState('')
  const [secili, setSecili] = useState<Record<number, boolean>>({})
  const [hata, setHata] = useState('')

  const seciliKat = (kategoriler ?? []).find((k) => String(k.id) === katId)
  const cinsiyetGoster = !!seciliKat?.cinsiyet_ayrimi

  const liste = useMemo(() => {
    return (hizmetler ?? []).filter((h) => {
      if (katId && String(h.kategori_id) !== katId) return false
      if (cinsiyetGoster && h.cinsiyet !== 'genel' && h.cinsiyet !== cinsiyet) return false
      return true
    })
  }, [hizmetler, katId, cinsiyetGoster, cinsiyet])

  const seciliHizmetler = useMemo(() => (hizmetler ?? []).filter((h) => secili[h.id]), [hizmetler, secili])
  const normalToplam = seciliHizmetler.reduce((s, h) => s + Number(h.fiyat || 0), 0)
  const fiyatSayi = Number(fiyat) || 0
  const indirimVar = fiyatSayi > 0 && seciliHizmetler.length > 0 && fiyatSayi < normalToplam
  const uyariVar = fiyatSayi > 0 && seciliHizmetler.length > 0 && fiyatSayi >= normalToplam
  const indirimTutar = normalToplam - fiyatSayi
  const indirimYuzde = normalToplam > 0 ? Math.round((indirimTutar / normalToplam) * 100) : 0

  const kaydet = useMutation({
    mutationFn: () => apiPost('paket.php', 'kombine_ekle', {
      ad: ad.trim(),
      fiyat: fiyatSayi,
      kalemler: seciliHizmetler.map((h) => ({ hizmet_id: h.id, seans_sayisi: 1 })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kombine-paketler'] })
      onClose()
    },
    onError: (e) => setHata((e as Error).message || 'Kaydedilemedi.'),
  })

  function toggle(id: number) {
    setSecili((s) => ({ ...s, [id]: !s[id] }))
  }

  function kaydetTikla() {
    setHata('')
    if (!ad.trim()) { setHata('Paket adı girin.'); return }
    if (seciliHizmetler.length === 0) { setHata('En az bir bölge/hizmet seçin.'); return }
    if (!fiyatSayi) { setHata('Paket fiyatı girin.'); return }
    kaydet.mutate()
  }

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}

        <div className="field"><label>Paket Adı</label>
          <input className="input" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="örn. Tüm Vücut Lazer" autoFocus />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>Kategori</label>
            <Select className="input" value={katId} onChange={(e) => { setKatId(e.target.value); setSecili({}) }}>
              <option value="">Tümü</option>
              {(kategoriler ?? []).map((k) => <option key={k.id} value={k.id}>{k.ad_tr}</option>)}
            </Select>
          </div>
          {cinsiyetGoster && (
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>Cinsiyet</label>
              <div style={{ display: 'flex', gap: 7 }}>
                {(['bayan', 'erkek'] as const).map((c) => (
                  <button key={c} type="button" onClick={() => { setCinsiyet(c); setSecili({}) }}
                    className="btn btn-sm" style={{ background: cinsiyet === c ? 'rgba(201,169,110,.15)' : 'var(--surface2)', borderColor: cinsiyet === c ? 'rgba(201,169,110,.4)' : 'var(--border2)', color: cinsiyet === c ? 'var(--gold-text)' : 'var(--text2)' }}>
                    {c === 'bayan' ? 'Bayan' : 'Erkek'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Pakete Dahil Bölgeler</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9, maxHeight: 250, overflowY: 'auto', marginBottom: 16 }}>
          {liste.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', fontSize: 12.5, padding: 20 }}>Bu filtreyle hizmet bulunamadı.</div>}
          {liste.map((h) => {
            const on = !!secili[h.id]
            return (
              <button type="button" key={h.id} onClick={() => toggle(h.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 13px', borderRadius: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', background: on ? 'rgba(201,169,110,.12)' : 'var(--surface2)', border: on ? '1.5px solid var(--gold)' : '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--gold)' : 'transparent', border: on ? 'none' : '1.5px solid var(--border2)' }}>
                    {on && <Check size={13} color="#0C0C0D" />}
                  </span>
                  <span style={{ fontSize: 13 }}>{h.ad_tr}</span>
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{tl(h.fiyat)}</span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{seciliHizmetler.length} bölge seçili · içerik toplamı</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text2)', marginTop: 2 }}>{tl(normalToplam)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>Paket Fiyatı (₺)</label>
            <input className="input" type="number" min={0} value={fiyat} onChange={(e) => setFiyat(e.target.value)}
              style={{ width: 140, textAlign: 'right', fontSize: 16, fontWeight: 600, color: 'var(--gold-text)', borderColor: 'rgba(201,169,110,.35)' }} />
          </div>
        </div>

        {uyariVar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', borderRadius: 10, background: 'rgba(231,76,60,.1)', border: '1px solid rgba(231,76,60,.25)', color: '#f0938a', fontSize: 12.5 }}>
            <AlertTriangle size={16} /> Paket, tek tek alımdan pahalı/eşit — müşteriye avantaj yok.
          </div>
        )}
        {indirimVar && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 13px', borderRadius: 10, background: 'rgba(46,204,113,.1)', border: '1px solid rgba(46,204,113,.2)', color: '#7fe0a6', fontSize: 12.5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BadgePercent size={16} /> %{indirimYuzde} indirim · müşteri {tl(indirimTutar)} kazanır</span>
            <span style={{ fontWeight: 600 }}>{tl(fiyatSayi)}</span>
          </div>
        )}
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button className="btn btn-gold" disabled={kaydet.isPending} onClick={kaydetTikla}>
          {kaydet.isPending ? <span className="spin" /> : 'Paketi Kaydet'}
        </button>
      </div>
    </>
  )
}
