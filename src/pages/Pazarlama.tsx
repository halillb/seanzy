import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Coins, TrendingUp, Megaphone } from 'lucide-react'
import Topbar from '../components/Topbar'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet } from '../lib/api'

interface Musteri { id: number; kaynak?: string; kaynak_detay?: string }
interface Randevu { musteri_id?: number; fiyat?: number | string; durum: string }

const KAYNAK_AD: Record<string, string> = {
  reklam: 'Reklam', eski_musteri: 'Eski Müşteri', referans: 'Referans / Tavsiye', tabela: 'Tabela / Geçerken', diger: 'Diğer',
}
const KAYNAK_RENK: Record<string, string> = {
  reklam: '#C9A96E', eski_musteri: '#3B82F6', referans: '#2ECC71', tabela: '#A78BFA', diger: '#94A3B8',
}
const tl = (n: number) => Math.round(n).toLocaleString('tr-TR') + ' ₺'

interface Satir { key: string; ad: string; renk: string; musteri: number; ciro: number; detay: Map<string, { m: number; c: number }> }

export default function Pazarlama() {
  const erisim = useErisim('pazarlama')
  const musteriler = useQuery({ queryKey: ['musteriler'], queryFn: () => apiGet<Musteri[]>('musteri.php', 'liste') })
  const randevular = useQuery({ queryKey: ['randevular'], queryFn: () => apiGet<Randevu[]>('randevu.php', 'liste') })

  const { satirlar, toplamMus, toplamCiro } = useMemo(() => {
    const mus = musteriler.data ?? []
    const rnd = randevular.data ?? []
    const kMap = new Map(mus.map((m) => [m.id, m]))
    const grup = new Map<string, Satir>()
    const al = (k: string): Satir => {
      const key = k || 'diger'
      if (!grup.has(key)) grup.set(key, { key, ad: KAYNAK_AD[key] || key, renk: KAYNAK_RENK[key] || '#94A3B8', musteri: 0, ciro: 0, detay: new Map() })
      return grup.get(key)!
    }
    for (const m of mus) {
      const s = al(m.kaynak || 'diger')
      s.musteri++
      if (m.kaynak === 'reklam' && m.kaynak_detay) {
        const d = s.detay.get(m.kaynak_detay) || { m: 0, c: 0 }
        d.m++; s.detay.set(m.kaynak_detay, d)
      }
    }
    let toplamCiro = 0
    for (const r of rnd) {
      if (r.durum !== 'tamamlandi') continue
      const fiyat = Number(r.fiyat || 0)
      toplamCiro += fiyat
      const m = r.musteri_id != null ? kMap.get(r.musteri_id) : undefined
      if (!m) continue
      const s = al(m.kaynak || 'diger')
      s.ciro += fiyat
      if (m.kaynak === 'reklam' && m.kaynak_detay) {
        const d = s.detay.get(m.kaynak_detay) || { m: 0, c: 0 }
        d.c += fiyat; s.detay.set(m.kaynak_detay, d)
      }
    }
    const satirlar = [...grup.values()].sort((a, b) => b.ciro - a.ciro || b.musteri - a.musteri)
    return { satirlar, toplamMus: mus.length, toplamCiro }
  }, [musteriler.data, randevular.data])

  const maxCiro = Math.max(1, ...satirlar.map((s) => s.ciro))
  const enIyi = satirlar.find((s) => s.ciro > 0) || satirlar[0]
  const yukleniyor = musteriler.isLoading || randevular.isLoading

  if (!erisim) return <><Topbar title="Pazarlama Analiz" subtitle="Müşteri kaynağı & gelir getirisi" search={false} /><PaketEngeli ozellik="pazarlama" /></>

  return (
    <>
      <Topbar title="Pazarlama Analiz" subtitle="Müşteri kaynağı & gelir getirisi" search={false} />
      <div className="page">
        <div className="metric-grid">
          <div className="card metric"><div className="mlbl"><Users size={14} /> Toplam Müşteri</div><div className="mval">{toplamMus}</div></div>
          <div className="card metric"><div className="mlbl"><Coins size={14} /> Atfedilen Ciro</div><div className="mval" style={{ color: 'var(--gold-text)' }}>{tl(toplamCiro)}</div></div>
          <div className="card metric"><div className="mlbl"><TrendingUp size={14} /> En Çok Getiren</div><div className="mval" style={{ fontSize: 19 }}>{enIyi?.ad || '—'}</div></div>
          <div className="card metric"><div className="mlbl"><Megaphone size={14} /> Müşteri/Kaynak</div><div className="mval" style={{ fontSize: 19 }}>{satirlar.length} kanal</div></div>
        </div>

        {yukleniyor ? (
          <div className="panel" style={{ height: 300, opacity: 0.5 }} />
        ) : satirlar.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 50 }}>Henüz kaynak verisi yok. Müşteri eklerken “Müşteri Nereden Geldi” seçilince burada görünür.</div>
        ) : (
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Kaynağa Göre Performans</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {satirlar.map((s) => {
                const pay = toplamCiro ? Math.round((s.ciro / toplamCiro) * 100) : 0
                const ort = s.musteri ? s.ciro / s.musteri : 0
                return (
                  <div key={s.key}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: s.renk }} />
                        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{s.ad}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>· {s.musteri} müşteri · ort. {tl(ort)}/kişi</span>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--gold-text)' }}>{tl(s.ciro)} <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>%{pay}</span></div>
                    </div>
                    <div style={{ height: 9, borderRadius: 5, background: 'var(--surface3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(s.ciro / maxCiro) * 100}%`, background: s.renk, borderRadius: 5, transition: 'width .4s' }} />
                    </div>
                    {s.detay.size > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9, paddingLeft: 18 }}>
                        {[...s.detay.entries()].sort((a, b) => b[1].c - a[1].c).map(([ad, d]) => (
                          <span key={ad} style={{ fontSize: 11.5, color: 'var(--text2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 11px' }}>
                            {ad} · {d.m} müşteri{d.c > 0 ? ` · ${tl(d.c)}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 18, lineHeight: 1.5 }}>Ciro, tamamlanmış randevuların müşteri kaynağına göre atfedilmesiyle hesaplanır. Reklam kanalı alt kırılımı (Google, Meta, Influencer…) müşteri kaynak detayından gelir.</p>
          </div>
        )}
      </div>
    </>
  )
}
