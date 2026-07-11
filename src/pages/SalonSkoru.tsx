import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Award, AlertCircle } from 'lucide-react'
import Topbar from '../components/Topbar'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet } from '../lib/api'

/* Seanzy'ye özgü özellik: Çeşitli metriklerden hesaplanan bütünleşik salon sağlık skoru */

interface SalonSkorVerisi {
  toplam_skor: number // 0-100
  doluluk_orani: number
  musteri_memnuniyeti: number
  gelir_trendi: number // pozitif/negatif yüzde
  tekrar_musteri_orani: number
  iptal_orani: number
  ortalama_randevu_degeri: number
  en_iyi_personel?: string
  gelismesi_gereken?: string[]
  aylik_trend: { ay: string; skor: number }[]
  metrikler: { ad: string; deger: number; hedef: number; birim: string; renk: string }[]
}

function SkorHalkasi({ skor, renk }: { skor: number; renk: string }) {
  const r = 56, c = 2 * Math.PI * r
  const dolu = (skor / 100) * c
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={70} cy={70} r={r} fill="none" stroke="var(--surface3)" strokeWidth={12} />
      <circle cx={70} cy={70} r={r} fill="none" stroke={renk} strokeWidth={12}
        strokeDasharray={`${dolu} ${c}`} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={70} y={66} textAnchor="middle" style={{ fontSize: 28, fontWeight: 700, fill: renk, fontFamily: 'inherit' }}>{skor}</text>
      <text x={70} y={84} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'inherit' }}>/ 100</text>
    </svg>
  )
}

function skorRenk(s: number) {
  if (s >= 80) return 'var(--green)'
  if (s >= 60) return 'var(--gold)'
  return '#ff8a7d'
}

function skorAd(s: number) {
  if (s >= 80) return 'Mükemmel'
  if (s >= 65) return 'İyi'
  if (s >= 50) return 'Orta'
  return 'Gelişim Gerekli'
}

export default function SalonSkoru() {
  const erisim = useErisim('salon_skoru')
  const { data, isLoading } = useQuery({
    queryKey: ['salon-skoru'],
    queryFn: () => apiGet<SalonSkorVerisi>('rapor.php', 'salon_skoru'),
    enabled: erisim,
  })

  if (!erisim) return <><Topbar title="Salon Skoru" subtitle="Bütünleşik işletme sağlık skoru" search={false} /><PaketEngeli ozellik="salon_skoru" /></>

  const skor = data?.toplam_skor ?? 0
  const renk = skorRenk(skor)

  return (
    <>
      <Topbar title="Salon Skoru" subtitle="Bütünleşik işletme sağlık & doluluk skoru" search={false}
        actions={<span style={{ fontSize: 11, background: 'rgba(201,169,110,.15)', color: 'var(--gold-text)', borderRadius: 20, padding: '4px 12px', fontWeight: 600 }}>★ Seanzy'ye Özel</span>} />

      <div className="page">
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="card" style={{ height: 120, opacity: .4 }} />)}
          </div>
        ) : !data ? (
          <div className="panel" style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>Skor hesaplanamadı. Yeterli veri yok.</div>
        ) : (
          <>
            {/* Ana skor paneli */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', gap: 12 }}>
                <SkorHalkasi skor={skor} renk={renk} />
                <div style={{ fontSize: 18, fontWeight: 700, color: renk }}>{skorAd(skor)}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.5 }}>
                  Geçen aya göre {data.gelir_trendi >= 0 ? <span style={{ color: 'var(--green)' }}>+{data.gelir_trendi}%</span> : <span style={{ color: '#ff8a7d' }}>{data.gelir_trendi}%</span>}
                </div>
                {data.en_iyi_personel && (
                  <div style={{ marginTop: 8, fontSize: 12, background: 'rgba(201,169,110,.1)', borderRadius: 8, padding: '6px 12px', color: 'var(--gold-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Award size={13} /> En iyi: {data.en_iyi_personel}
                  </div>
                )}
              </div>

              {/* Metrik kartları */}
              <div className="metric-grid" style={{ alignContent: 'start' }}>
                {(data.metrikler ?? []).map((m) => {
                  const oran = Math.min((m.deger / m.hedef) * 100, 100)
                  const iyi = m.deger >= m.hedef
                  return (
                    <div key={m.ad} className="card" style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>{m.ad}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: m.renk, marginBottom: 8 }}>
                        {typeof m.deger === 'number' && m.birim === '%' ? `%${m.deger}` : `${m.deger}${m.birim !== '%' ? ` ${m.birim}` : ''}`}
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--surface3)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${oran}%`, background: iyi ? 'var(--green)' : 'var(--gold)', transition: 'width 1s ease' }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 4 }}>Hedef: {m.hedef}{m.birim}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Aylık trend */}
            {(data.aylik_trend ?? []).length > 0 && (
              <div className="panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Aylık Skor Trendi</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                  {data.aylik_trend.map((t) => {
                    const h = (t.skor / 100) * 72
                    const r = skorRenk(t.skor)
                    return (
                      <div key={t.ay} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.skor}</div>
                        <div style={{ width: '100%', height: h, borderRadius: '4px 4px 0 0', background: r, opacity: .8, minHeight: 4 }} />
                        <div style={{ fontSize: 10, color: 'var(--faint)', whiteSpace: 'nowrap' }}>{t.ay}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Gelişim önerileri */}
            {((data.gelismesi_gereken as string[] | undefined) ?? []).length > 0 && (
              <div className="panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={15} style={{ color: 'var(--gold)' }} /> Gelişim Önerileri
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(data.gelismesi_gereken as string[]).map((o, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, padding: '8px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                      <TrendingUp size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                      {o}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
