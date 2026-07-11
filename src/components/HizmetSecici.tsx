import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Check, Clock, X, Zap } from 'lucide-react'
import { apiGet } from '../lib/api'

export interface SecilenKalem {
  hizmet_id: number
  ad: string
  fiyat: number
  sure_dk: number
  hizmet_tipi: 'tek' | 'seansli'
  varsayilan_seans?: number
  kaynak_paket_id?: number
}

interface Kategori { id: number; ad_tr: string; cinsiyet_ayrimi?: boolean }
interface HizmetKatalog {
  id: number; ad_tr: string; fiyat: number; sure_dk: number
  kategori_id?: number; kategori_ad?: string
  cinsiyet?: 'genel' | 'bayan' | 'erkek'; hizmet_tipi?: 'tek' | 'seansli'; varsayilan_seans?: number
}
interface KombineKalem { hizmet_id: number; hizmet_ad?: string; fiyat: number; sure_dk: number; seans_sayisi?: number }
interface KombinePaket { id: number; ad: string; cinsiyet?: string; kategori_id?: number; fiyat: number; normal_toplam: number; kalemler: KombineKalem[] }

interface Props {
  value: SecilenKalem[]
  onChange: (v: SecilenKalem[]) => void
}

const tl = (n: number) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'

export default function HizmetSecici({ value, onChange }: Props) {
  const { data: kategoriler } = useQuery({ queryKey: ['kategoriler'], queryFn: () => apiGet<Kategori[]>('hizmet.php', 'kategoriler') })
  const { data: hizmetler } = useQuery({ queryKey: ['hizmetler'], queryFn: () => apiGet<HizmetKatalog[]>('hizmet.php', 'liste') })
  const { data: kombinePaketler } = useQuery({ queryKey: ['kombine-paketler'], queryFn: () => apiGet<KombinePaket[]>('paket.php', 'kombine_liste') })

  const [katId, setKatId] = useState<string>('')
  const [cinsiyet, setCinsiyet] = useState<'bayan' | 'erkek'>('bayan')
  const [arama, setArama] = useState('')

  const seciliMap = useMemo(() => {
    const m: Record<number, SecilenKalem> = {}
    value.forEach((v) => { m[v.hizmet_id] = v })
    return m
  }, [value])

  const seciliKat = (kategoriler ?? []).find((k) => String(k.id) === katId)
  const cinsiyetGoster = !!seciliKat?.cinsiyet_ayrimi

  const filtreliHizmetler = useMemo(() => {
    let arr = hizmetler ?? []
    if (katId) arr = arr.filter((h) => String(h.kategori_id) === katId)
    if (cinsiyetGoster) arr = arr.filter((h) => (h.cinsiyet ?? 'genel') === 'genel' || h.cinsiyet === cinsiyet)
    if (arama.trim()) {
      const q = arama.trim().toLowerCase()
      arr = arr.filter((h) => h.ad_tr.toLowerCase().includes(q))
    }
    return arr
  }, [hizmetler, katId, cinsiyetGoster, cinsiyet, arama])

  const filtreliPresetler = useMemo(() => {
    if (arama.trim()) return []
    return (kombinePaketler ?? []).filter((p) => {
      if (katId && String(p.kategori_id) !== katId) return false
      if (cinsiyetGoster && p.cinsiyet && p.cinsiyet !== 'genel' && p.cinsiyet !== cinsiyet) return false
      return true
    })
  }, [kombinePaketler, katId, cinsiyetGoster, cinsiyet, arama])

  const kategorilerListe = kategoriler ?? []

  function chip(label: string, active: boolean, onClick: () => void, key: string) {
    return (
      <button key={key} type="button" onClick={onClick}
        style={{ fontFamily: 'inherit', fontSize: 12.5, padding: '7px 14px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', background: active ? 'rgba(201,169,110,.16)' : 'var(--surface2)', border: `1px solid ${active ? 'rgba(201,169,110,.45)' : 'var(--border)'}`, color: active ? 'var(--gold-text)' : 'var(--text2)' }}>
        {label}
      </button>
    )
  }

  function toggleHizmet(h: HizmetKatalog) {
    const varMi = !!seciliMap[h.id]
    if (varMi) {
      onChange(value.filter((v) => v.hizmet_id !== h.id))
    } else {
      onChange([...value, {
        hizmet_id: h.id, ad: h.ad_tr, fiyat: Number(h.fiyat) || 0, sure_dk: h.sure_dk || 0,
        hizmet_tipi: h.hizmet_tipi === 'seansli' ? 'seansli' : 'tek',
        varsayilan_seans: h.varsayilan_seans,
      }])
    }
  }

  function togglePreset(p: KombinePaket) {
    const hepsiSecili = p.kalemler.every((k) => seciliMap[k.hizmet_id])
    if (hepsiSecili) {
      const ids = new Set(p.kalemler.map((k) => k.hizmet_id))
      onChange(value.filter((v) => !ids.has(v.hizmet_id)))
    } else {
      const eklenecek: SecilenKalem[] = p.kalemler
        .filter((k) => !seciliMap[k.hizmet_id])
        .map((k) => {
          const h = (hizmetler ?? []).find((x) => x.id === k.hizmet_id)
          return {
            hizmet_id: k.hizmet_id, ad: k.hizmet_ad || h?.ad_tr || 'Hizmet',
            fiyat: Number(k.fiyat) || 0, sure_dk: k.sure_dk || h?.sure_dk || 0,
            hizmet_tipi: h?.hizmet_tipi === 'seansli' ? 'seansli' : 'tek',
            varsayilan_seans: h?.varsayilan_seans, kaynak_paket_id: p.id,
          }
        })
      onChange([...value, ...eklenecek])
    }
  }

  function cikar(hizmetId: number) {
    onChange(value.filter((v) => v.hizmet_id !== hizmetId))
  }

  const toplamSure = value.reduce((s, v) => s + v.sure_dk, 0)
  const toplamFiyat = value.reduce((s, v) => s + v.fiyat, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 10, padding: '9px 13px', marginBottom: 12 }}>
        <Search size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Hizmet ara: koltuk, boya, manikür…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {chip('Tümü', katId === '', () => { setKatId(''); }, 'tumu')}
        {kategorilerListe.map((k) => chip(k.ad_tr, katId === String(k.id), () => setKatId(String(k.id)), String(k.id)))}
      </div>

      {cinsiyetGoster && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {chip('Bayan', cinsiyet === 'bayan', () => setCinsiyet('bayan'), 'bayan')}
          {chip('Erkek', cinsiyet === 'erkek', () => setCinsiyet('erkek'), 'erkek')}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9, maxHeight: 320, overflowY: 'auto', marginBottom: 14 }}>
        {filtreliPresetler.map((p) => {
          const hepsiSecili = p.kalemler.length > 0 && p.kalemler.every((k) => seciliMap[k.hizmet_id])
          return (
            <button type="button" key={'preset-' + p.id} onClick={() => togglePreset(p)}
              style={{ gridColumn: '1 / -1', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', padding: '12px 14px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, background: hepsiSecili ? 'rgba(201,169,110,.15)' : 'linear-gradient(135deg,rgba(154,122,69,.16),rgba(201,169,110,.06))', border: hepsiSecili ? '1.5px solid var(--gold)' : '1.5px dashed rgba(201,169,110,.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={16} style={{ color: 'var(--gold-text)' }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{p.ad}</span>
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {p.normal_toplam > p.fiyat && <span style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'line-through', marginRight: 6 }}>{tl(p.normal_toplam)}</span>}
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)' }}>{tl(p.fiyat)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {p.kalemler.map((k) => (
                  <span key={k.hizmet_id} style={{ fontSize: 10.5, color: 'var(--gold-text)', background: 'rgba(201,169,110,.1)', borderRadius: 6, padding: '2px 7px' }}>{k.hizmet_ad}</span>
                ))}
              </div>
            </button>
          )
        })}

        {filtreliHizmetler.length === 0 && filtreliPresetler.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 30 }}>Sonuç yok.</div>
        )}
        {filtreliHizmetler.map((h) => {
          const on = !!seciliMap[h.id]
          return (
            <button type="button" key={h.id} onClick={() => toggleHizmet(h)}
              style={{ position: 'relative', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', padding: '13px 14px', borderRadius: 12, transition: 'all .15s', background: on ? 'rgba(201,169,110,.12)' : 'var(--surface2)', border: on ? '1.5px solid var(--gold)' : '1.5px solid var(--border)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 7 }}>{h.ad_tr}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold-text)' }}>{tl(h.fiyat)}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} />{h.sure_dk} dk</span>
              </div>
              {on && (
                <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={14} color="#0C0C0D" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {value.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {value.map((v) => (
              <div key={v.hizmet_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 11px', background: 'var(--surface2)', borderRadius: 9, fontSize: 12.5 }}>
                <span>{v.ad} {v.hizmet_tipi === 'seansli' && <span style={{ color: 'var(--muted)', fontSize: 10.5 }}>(seanslı)</span>}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--gold-text)', fontWeight: 500 }}>{tl(v.fiyat)}</span>
                  <button type="button" onClick={() => cikar(v.hizmet_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={15} /></button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{value.length} hizmet · ≈ {toplamSure} dk</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--gold-text)' }}>{tl(toplamFiyat)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
