import { useNavigate } from 'react-router-dom'
import { Check, Lock, Sparkles, ArrowRight, Crown, Zap, Star } from 'lucide-react'
import Topbar from '../components/Topbar'
import { useAuth } from '../store/auth'
import { OZELLIKLER, PAKET_RENK, PAKET_AD, paketErisi, type PaketTuru } from '../lib/ozellikler'
import { useQueryClient } from '@tanstack/react-query'
import type { OzellikHaritasi } from '../hooks/useOzellikHaritasi'

const PAKET_ICON: Record<PaketTuru, typeof Zap> = { basic: Zap, pro: Sparkles, enterprise: Crown }
const PAKET_ACIKLAMA: Record<PaketTuru, string> = {
  basic:      'Randevu ve müşteri yönetiminin temeli — büyümek için sağlam bir başlangıç.',
  pro:        'Finans, raporlar, pazarlama ve daha fazlası — işletmenizi büyütmek için eksiksiz araç seti.',
  enterprise: 'Stok, çok şube ve BI analitik ile sınır tanımayan ölçek.',
}
const PAKET_FIYAT: Record<PaketTuru, string> = {
  basic: '299 ₺/ay', pro: '599 ₺/ay', enterprise: '999 ₺/ay',
}

const GRUPLAR_SIRALAMA = ['Randevu', 'Müşteri', 'Personel', 'Hizmet', 'Finans', 'Raporlar', 'Pazarlama', 'Ürün', 'Sistem', 'İletişim']

export default function Paketlerim() {
  const nav = useNavigate()
  const rawPaket = useAuth((s) => s.user?.paket_turu) || 'basic'
  const BILINEN: PaketTuru[] = ['basic', 'pro', 'enterprise']
  const mevcutPaket: PaketTuru = BILINEN.includes(rawPaket as PaketTuru) ? (rawPaket as PaketTuru) : 'basic'
  const qc = useQueryClient()
  const harita = qc.getQueryData<OzellikHaritasi>(['ozellik-haritasi']) ?? {}

  const renk = PAKET_RENK[mevcutPaket]
  const Icon = PAKET_ICON[mevcutPaket]

  // Özellik haritasını uygula
  const ozelliklerGuncel = Object.fromEntries(
    Object.entries(OZELLIKLER).map(([k, v]) => [k, { ...v, min: (harita[k] ?? v.min) as PaketTuru }])
  )

  // Grupla
  const gruplandi = GRUPLAR_SIRALAMA.reduce<Record<string, { key: string; ad: string; aciklama: string; min: PaketTuru; benzersiz?: boolean; erisim: boolean }[]>>((acc, g) => {
    acc[g] = Object.entries(ozelliklerGuncel)
      .filter(([, v]) => v.grup === g)
      .map(([k, v]) => ({ key: k, ad: v.ad, aciklama: v.aciklama, min: v.min, benzersiz: v.benzersiz, erisim: paketErisi(mevcutPaket, v.min) }))
    return acc
  }, {})

  const toplamOzellik = Object.values(ozelliklerGuncel).length
  const kullanilanOzellik = Object.values(ozelliklerGuncel).filter((v) => paketErisi(mevcutPaket, v.min)).length

  const SONRAKI: Record<PaketTuru, PaketTuru | null> = { basic: 'pro', pro: 'enterprise', enterprise: null }
  const sonraki = SONRAKI[mevcutPaket]

  return (
    <>
      <Topbar title="Paketim" subtitle="Mevcut abonelik ve özelliklerim" search={false}
        actions={
          sonraki ? (
            <button className="btn btn-gold" onClick={() => nav('/fiyatlar')} style={{ gap: 7, fontSize: 13 }}>
              {PAKET_AD[sonraki]}'a Geç <ArrowRight size={14} />
            </button>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--gold-text)', background: 'rgba(201,169,110,.12)', borderRadius: 20, padding: '6px 14px', fontWeight: 600 }}>
              ✦ En Üst Paket
            </span>
          )
        }
      />

      <div className="page">
        {/* Mevcut paket kartı */}
        <div style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${renk} 12%, var(--surface)), color-mix(in srgb, ${renk} 5%, var(--surface)))`, border: `1.5px solid color-mix(in srgb, ${renk} 35%, transparent)`, borderRadius: 20, padding: '28px 28px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `color-mix(in srgb, ${renk} 20%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: renk }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: renk, fontWeight: 700 }}>Aktif Paket</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: renk }}>{PAKET_AD[mevcutPaket]}</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: '0 0 16px' }}>{PAKET_ACIKLAMA[mevcutPaket]}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                <span style={{ fontWeight: 700, color: renk, fontSize: 18 }}>{kullanilanOzellik}</span>
                <span style={{ marginLeft: 5 }}>/ {toplamOzellik} özellik aktif</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                Aylık: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{PAKET_FIYAT[mevcutPaket]}</span>
              </div>
            </div>
          </div>

          {/* Skor halkası */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <svg width={110} height={110} viewBox="0 0 110 110">
              <circle cx={55} cy={55} r={44} fill="none" stroke="var(--surface3)" strokeWidth={8} />
              <circle cx={55} cy={55} r={44} fill="none" stroke={renk} strokeWidth={8}
                strokeDasharray={`${(kullanilanOzellik / toplamOzellik) * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
                strokeLinecap="round" transform="rotate(-90 55 55)" style={{ transition: 'stroke-dasharray 1s ease' }} />
              <text x={55} y={50} textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: renk, fontFamily: 'inherit' }}>{kullanilanOzellik}</text>
              <text x={55} y={66} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'inherit' }}>özellik</text>
            </svg>
          </div>
        </div>

        {/* Upgrade banner — sadece enterprise değilse */}
        {sonraki && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                <span style={{ color: PAKET_RENK[sonraki] }}>{PAKET_AD[sonraki]}</span>'a geçerek{' '}
                {Object.values(ozelliklerGuncel).filter((v) => !paketErisi(mevcutPaket, v.min)).length} yeni özelliğin kilidini açın
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>
                Raporlar, finans, personel prim, pazarlama analizi ve daha fazlası sizi bekliyor.
              </div>
            </div>
            <button className="btn btn-gold" onClick={() => nav('/fiyatlar')} style={{ fontSize: 13, padding: '10px 20px', gap: 7, flexShrink: 0 }}>
              Paketleri Karşılaştır <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Özellik listesi — gruplara göre */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {GRUPLAR_SIRALAMA.filter((g) => gruplandi[g]?.length > 0).map((grup) => (
            <div key={grup} className="panel" style={{ padding: 0 }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 11.5, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                {grup}
              </div>
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {gruplandi[grup].map((oz) => (
                  <div key={oz.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: oz.erisim ? `color-mix(in srgb, ${renk} 15%, transparent)` : 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {oz.erisim
                        ? <Check size={13} style={{ color: renk }} />
                        : <Lock size={11} style={{ color: 'var(--faint)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: oz.erisim ? 'var(--text)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {oz.ad}
                        {oz.benzersiz && <Star size={10} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>{oz.aciklama}</div>
                    </div>
                    {!oz.erisim && (
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: `color-mix(in srgb, ${PAKET_RENK[oz.min]} 12%, transparent)`, color: PAKET_RENK[oz.min], fontWeight: 600, flexShrink: 0 }}>
                        {PAKET_AD[oz.min]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Alt: Paket fiyatları */}
        <div className="panel" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Tüm Paketler</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {(['basic', 'pro', 'enterprise'] as PaketTuru[]).map((p) => {
              const PIcon = PAKET_ICON[p]
              const pr = PAKET_RENK[p]
              const aktif = mevcutPaket === p
              return (
                <div key={p} style={{ padding: '16px 18px', borderRadius: 12, border: `1.5px solid ${aktif ? pr : 'var(--border)'}`, background: aktif ? `color-mix(in srgb, ${pr} 8%, var(--surface))` : 'var(--surface)', position: 'relative' }}>
                  {aktif && (
                    <div style={{ position: 'absolute', top: -10, right: 12, fontSize: 10, background: pr, color: '#fff', borderRadius: 20, padding: '3px 10px', fontWeight: 700 }}>Mevcut</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <PIcon size={16} style={{ color: pr }} />
                    <span style={{ fontWeight: 700, color: pr }}>{PAKET_AD[p]}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: pr, marginBottom: 4 }}>{PAKET_FIYAT[p]}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {Object.values(ozelliklerGuncel).filter((v) => paketErisi(p, v.min)).length} özellik
                  </div>
                  {!aktif && (
                    <button className="btn btn-ghost" onClick={() => nav('/fiyatlar')}
                      style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: 12 }}>
                      Detayları Gör
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
