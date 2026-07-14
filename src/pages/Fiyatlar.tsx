import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, X, Minus, Sparkles, Zap, Crown, Star, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { api, apiBase } from '../lib/api'
import { OZELLIKLER } from '../lib/ozellikler'
import { useOzellikHaritasi } from '../hooks/useOzellikHaritasi'

interface PublicOzellik { ad: string; kod?: string; aktif: boolean }
interface PublicPaket { ad: string; kod: string; fiyat: number; sira: number; renk: string | null; ozellikler: PublicOzellik[] }

const IKONLAR = [Zap, Sparkles, Crown, Star]

function usePaketlerPublic() {
  return useQuery<PublicPaket[]>({
    queryKey: ['paketler-public'],
    queryFn: async () => {
      const r = await api.get<{ data: PublicPaket[] }>(`${apiBase()}/api/paketler-public`)
      return r.data.data ?? []
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

// OZELLIKLER haritasını gruplarına ayır (Süper Admin panelindekiyle aynı mantık)
const GRUPLAR_DINAMIK = Object.entries(
  Object.entries(OZELLIKLER).reduce<Record<string, { key: string; tanim: typeof OZELLIKLER[string] }[]>>((acc, [key, t]) => {
    if (!acc[t.grup]) acc[t.grup] = []
    acc[t.grup].push({ key, tanim: t })
    return acc
  }, {})
)

/* ─── Yardımcı bileşenler ────────────────────────────── */
function Hucre({ val, renk }: { val: boolean; renk: string }) {
  if (!val) return <div style={{ display: 'flex', justifyContent: 'center' }}><X size={16} style={{ color: 'var(--faint)' }} /></div>
  return <div style={{ display: 'flex', justifyContent: 'center' }}><Check size={16} style={{ color: renk, filter: `drop-shadow(0 0 4px ${renk}60)` }} /></div>
}

const tl = (n: number, yillik: boolean) => {
  const fiyat = yillik ? Math.round(n * 0.83) : n
  return fiyat
}

export default function Fiyatlar() {
  const nav = useNavigate()
  const [yillik, setYillik] = useState(false)
  const token = useAuth((s) => s.token)
  const rol = useAuth((s) => s.user?.rol)
  const { data: paketlerApi } = usePaketlerPublic()
  const { data: harita } = useOzellikHaritasi()

  const paketler = paketlerApi ?? []
  const siraOf = (kod: string) => paketler.find((p) => p.kod === kod)?.sira ?? 0
  const erisimVar = (paketKod: string, gerekenMin: string) => siraOf(paketKod) >= siraOf(gerekenMin)
  const populerKod = paketler.find((p) => p.kod === 'pro')?.kod ?? paketler[Math.floor((paketler.length - 1) / 2)]?.kod

  let oncekiGosterilen: string[] = []
  const PAKETLER = paketler.map((p, i) => {
    // Liste tamamen Özellik Haritası'ndan (OZELLIKLER tanımlı sırasıyla) türetilir — her üst paket
    // bir alttakinin tüm maddelerini aynı sırayla korur, üstüne yeni açılanları ekler. Eski/elle
    // eklenmiş kalıntı maddeler (bu otomatik sistemden önceki veriler) kasıtlı olarak sayılmaz.
    const dahilOlanlar = Object.entries(OZELLIKLER)
      .filter(([key]) => erisimVar(p.kod, harita?.[key] ?? OZELLIKLER[key].min))
      .map(([, t]) => t.ad)
    // Kart özeti: ilk pakette ilk 5; sonraki her pakette bir öncekinin gösterdiklerini
    // koru + en az 3 yeni özelliği ekle (yükseltmenin gerçek farkını göstermek için)
    const yeniler = dahilOlanlar.filter((f) => !oncekiGosterilen.includes(f))
    const gosterilen = i === 0 ? dahilOlanlar.slice(0, 5) : [...oncekiGosterilen, ...yeniler.slice(0, 3)]
    oncekiGosterilen = gosterilen
    return {
      id: p.kod,
      ad: p.ad,
      fiyat_aylik: p.fiyat,
      renk: p.renk || '#C9A96E',
      icon: IKONLAR[i % IKONLAR.length],
      popular: p.kod === populerKod,
      dahilOlanlar,
      gosterilen,
    }
  })

  // Giriş yapmış kullanıcı için panele dön hedefi
  const panelHedef = rol === 'superadmin' ? '/sa-genel' : rol === 'personel' ? '/programim' : rol === 'musteri' ? '/randevularim' : '/genel-bakis'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ── Topbar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'color-mix(in srgb, var(--bg) 85%, transparent)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/estetix/icon-192.png" alt="Seanzy" style={{ width: 34, height: 34, borderRadius: 9 }} />
          <span className="serif" style={{ fontSize: 22, fontWeight: 400, letterSpacing: '.1em' }}>Sean<em style={{ color: 'var(--gold)' }}>zy</em></span>
        </div>
        {token ? (
          <button className="btn btn-gold" onClick={() => nav(panelHedef)} style={{ padding: '9px 20px', fontSize: 13 }}>
            ← Panele Dön
          </button>
        ) : (
          <button className="btn btn-gold" onClick={() => nav('/login')} style={{ padding: '9px 20px', fontSize: 13 }}>
            Giriş Yap <ArrowRight size={14} />
          </button>
        )}
      </header>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '72px 24px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', filter: 'blur(120px)', background: 'rgba(201,169,110,.08)', top: -200, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 13, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18, fontWeight: 500 }}>Abonelik Paketleri</div>
        <h1 className="serif" style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 400, letterSpacing: '.06em', marginBottom: 16, lineHeight: 1.2 }}>
          İşletmenize Özel<br /><em style={{ color: 'var(--gold)' }}>Profesyonel Yönetim</em>
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--text2)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Güzellik merkezinizi dijitale taşıyın. Randevudan finansa, pazarlamadan rapora — her şey tek platformda.
        </p>

        {/* Aylık / Yıllık toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 40, padding: '6px 8px 6px 16px' }}>
          <span style={{ fontSize: 13, color: !yillik ? 'var(--text)' : 'var(--muted)' }}>Aylık</span>
          <button
            onClick={() => setYillik((v) => !v)}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: yillik ? 'var(--gold)' : 'var(--surface3)', transition: 'background .2s', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: yillik ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
          </button>
          <span style={{ fontSize: 13, color: yillik ? 'var(--gold-text)' : 'var(--muted)' }}>Yıllık</span>
          {yillik && <span style={{ fontSize: 11, background: 'rgba(201,169,110,.2)', color: 'var(--gold-text)', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>%17 İndirim</span>}
        </div>
      </div>

      {/* ── Paket Kartları ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
        {PAKETLER.map((p) => {
          const Icon = p.icon
          const fiyat = tl(p.fiyat_aylik, yillik)
          return (
            <div key={p.id} style={{ position: 'relative', borderRadius: 20, border: `1.5px solid ${p.popular ? 'rgba(201,169,110,.5)' : 'var(--border)'}`, background: p.popular ? 'color-mix(in srgb, var(--gold) 5%, var(--surface))' : 'var(--surface)', padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: p.popular ? '0 0 40px rgba(201,169,110,.12)' : 'none', transform: p.popular ? 'scale(1.025)' : 'none' }}>
              {p.popular && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#9A7A45,#E8D5B0)', color: '#0c0c0d', fontSize: 11.5, fontWeight: 700, letterSpacing: '.1em', padding: '5px 18px', borderRadius: 20, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                  En Çok Tercih Edilen
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in srgb, ${p.renk} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.renk }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{p.ad}</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-.02em', color: p.renk === 'var(--gold)' ? 'var(--gold-text)' : p.renk }}>{fiyat.toLocaleString('tr-TR')}</span>
                  <span style={{ fontSize: 14, color: 'var(--muted)', paddingBottom: 7 }}>₺/ay</span>
                </div>
                {yillik && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Yıllık ödemede · {(fiyat * 12).toLocaleString('tr-TR')} ₺/yıl</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Öne Çıkanlar</div>
                {p.gosterilen.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5 }}>
                    <Check size={15} style={{ color: p.renk === 'var(--gold)' ? 'var(--gold)' : p.renk, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text2)' }}>{f}</span>
                  </div>
                ))}
                {p.dahilOlanlar.length > p.gosterilen.length && (
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>+{p.dahilOlanlar.length - p.gosterilen.length} özellik daha — aşağıdaki tabloda</div>
                )}
              </div>

              <button
                onClick={() => nav('/login')}
                style={{ width: '100%', padding: '13px 20px', borderRadius: 12, border: p.popular ? 'none' : '1.5px solid var(--border)', background: p.popular ? 'linear-gradient(135deg,#9A7A45,#C9A96E)' : 'transparent', color: p.popular ? '#0c0c0d' : 'var(--text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}
                onMouseOver={(e) => { if (!p.popular) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,169,110,.5)' }}
                onMouseOut={(e) => { if (!p.popular) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}>
                Hemen Başla <ArrowRight size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Özellik Karşılaştırma ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="serif" style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 400, letterSpacing: '.06em', marginBottom: 10 }}>
            Tüm <em style={{ color: 'var(--gold)' }}>Özellikler</em>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Paketlerin detaylı özellik karşılaştırması</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'auto' }}>
          <div style={{ minWidth: 280 + PAKETLER.length * 140 }}>
            {/* Başlık satırı */}
            <div style={{ display: 'grid', gridTemplateColumns: `1fr repeat(${PAKETLER.length}, 140px)`, borderBottom: '2px solid var(--border)', background: 'var(--surface2)' }}>
              <div style={{ padding: '18px 24px', fontSize: 13, color: 'var(--muted)' }}>Özellik</div>
              {PAKETLER.map((p) => (
                <div key={p.id} style={{ padding: '18px 12px', textAlign: 'center', borderLeft: '1px solid var(--border)', background: p.popular ? 'rgba(201,169,110,.06)' : 'transparent' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: p.renk === 'var(--gold)' ? 'var(--gold-text)' : p.renk }}>{p.ad}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{tl(p.fiyat_aylik, yillik).toLocaleString('tr-TR')} ₺/ay</div>
                </div>
              ))}
            </div>

            {GRUPLAR_DINAMIK.map(([grup, ozellikler], gi) => (
              <div key={grup}>
                {/* Grup başlığı */}
                <div style={{ display: 'grid', gridTemplateColumns: `1fr repeat(${PAKETLER.length}, 140px)`, background: 'var(--surface3)', borderTop: gi > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ padding: '12px 24px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Minus size={14} style={{ opacity: .5 }} /> {grup}
                  </div>
                  {PAKETLER.map((p) => <div key={p.id} style={{ borderLeft: '1px solid var(--border)', background: p.popular ? 'rgba(201,169,110,.04)' : 'transparent' }} />)}
                </div>

                {/* Satırlar */}
                {ozellikler.map(({ key, tanim }) => (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: `1fr repeat(${PAKETLER.length}, 140px)`, borderTop: '1px solid var(--border)', transition: 'background .15s' }}
                    onMouseOver={(e) => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'}
                    onMouseOut={(e) => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                    <div style={{ padding: '14px 24px', fontSize: 13.5, color: 'var(--text2)' }}>{tanim.ad}</div>
                    {PAKETLER.map((p) => (
                      <div key={p.id} style={{ padding: '14px 12px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.popular ? 'rgba(201,169,110,.03)' : 'transparent' }}>
                        <Hucre val={erisimVar(p.id, harita?.[key] ?? tanim.min)} renk={p.renk === 'var(--gold)' ? '#C9A96E' : p.renk} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(201,169,110,.12), rgba(201,169,110,.04))', borderTop: '1px solid rgba(201,169,110,.2)', borderBottom: '1px solid rgba(201,169,110,.2)', padding: '60px 24px', textAlign: 'center', marginBottom: 60 }}>
        <h2 className="serif" style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 400, letterSpacing: '.06em', marginBottom: 12 }}>
          Hemen <em style={{ color: 'var(--gold)' }}>ücretsiz deneyin</em>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>14 gün boyunca Pro paketi ücretsiz kullanın. Kredi kartı gerekmez.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-gold" onClick={() => nav('/login')} style={{ padding: '14px 32px', fontSize: 14 }}>
            Ücretsiz Başla <ArrowRight size={15} />
          </button>
          <button className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: 14 }} onClick={() => window.open('mailto:info@homedya.com', '_blank')}>
            Bize Ulaşın
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '24px', fontSize: 12, color: 'var(--faint)', borderTop: '1px solid var(--border)' }}>
        © 2026 Seanzy · Homedya · <a href="mailto:info@homedya.com" style={{ color: 'var(--muted)', textDecoration: 'none' }}>info@homedya.com</a>
      </footer>
    </div>
  )
}
