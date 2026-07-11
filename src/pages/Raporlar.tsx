import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, CalendarCheck, XCircle, Coins, Scissors, UserCheck, BarChart3 } from 'lucide-react'
import Topbar from '../components/Topbar'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet } from '../lib/api'

type Donem = 'bugun' | 'hafta' | 'ay' | 'yil'

interface GelirRapor { toplam: number; tamamlanan: number; iptal: number; toplam_gelir: number }
interface FinansOzet { toplam_gelir: number; toplam_gider: number }
interface Randevu {
  id: number; personel_id: number; personel_ad?: string
  hizmet_id: number; hizmet_ad?: string; tarih?: string
  fiyat?: number | string; durum: string
}

const tl = (n?: number | string | null) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₺'
const pct = (a: number, b: number) => b ? Math.round((a / b) * 100) : 0

const DONEM_OPT: { k: Donem; ad: string }[] = [
  { k: 'bugun', ad: 'Bugün' },
  { k: 'hafta', ad: 'Bu Hafta' },
  { k: 'ay', ad: 'Bu Ay' },
  { k: 'yil', ad: 'Bu Yıl' },
]

export default function Raporlar() {
  const erisim = useErisim('raporlar')
  const [donem, setDonem] = useState<Donem>('ay')

  const rapor = useQuery({
    queryKey: ['gelir-raporu', donem],
    queryFn: () => apiGet<GelirRapor>('randevu.php', 'gelir_raporu', { donem }),
  })
  const finans = useQuery({
    queryKey: ['finans-ozet', donem],
    queryFn: () => apiGet<FinansOzet>('finans.php', 'ozet', { donem }),
  })
  const randevular = useQuery({
    queryKey: ['randevular'],
    queryFn: () => apiGet<Randevu[]>('randevu.php', 'liste'),
  })

  // Dönem başlangıç tarihini hesapla (client-side filtreleme için)
  const basTarih = useMemo(() => {
    const now = new Date()
    if (donem === 'bugun') return now.toISOString().slice(0, 10)
    if (donem === 'hafta') {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().slice(0, 10)
    }
    if (donem === 'yil') return `${now.getFullYear()}-01-01`
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }, [donem])

  const bugunStr = new Date().toISOString().slice(0, 10)

  // Dönem içindeki tamamlanan randevular
  const donemRandevular = useMemo(() => {
    return (randevular.data ?? []).filter(
      (r) => r.tarih && r.tarih >= basTarih && r.tarih <= bugunStr && r.durum === 'tamamlandi',
    )
  }, [randevular.data, basTarih, bugunStr])

  // Hizmet bazlı özet
  const hizmetOzet = useMemo(() => {
    const map: Record<string, { ad: string; sayi: number; gelir: number }> = {}
    for (const r of donemRandevular) {
      const k = r.hizmet_ad || 'Diğer'
      if (!map[k]) map[k] = { ad: k, sayi: 0, gelir: 0 }
      map[k].sayi++
      map[k].gelir += Number(r.fiyat || 0)
    }
    return Object.values(map).sort((a, b) => b.sayi - a.sayi).slice(0, 8)
  }, [donemRandevular])

  // Personel bazlı özet
  const personelOzet = useMemo(() => {
    const map: Record<number, { ad: string; sayi: number; gelir: number }> = {}
    for (const r of donemRandevular) {
      const k = r.personel_id
      if (!map[k]) map[k] = { ad: r.personel_ad || `Personel #${k}`, sayi: 0, gelir: 0 }
      map[k].sayi++
      map[k].gelir += Number(r.fiyat || 0)
    }
    return Object.values(map).sort((a, b) => b.sayi - a.sayi).slice(0, 8)
  }, [donemRandevular])

  const maxHizmet = Math.max(1, ...hizmetOzet.map((h) => h.sayi))
  const maxPersonel = Math.max(1, ...personelOzet.map((p) => p.sayi))

  const r = rapor.data
  const f = finans.data
  const gider = Number(f?.toplam_gider || 0)
  const net = Number(f?.toplam_gelir || 0) + Number(r?.toplam_gelir || 0) - gider

  if (!erisim) return <><Topbar title="Raporlar" subtitle="İşletme performans özeti" search={false} /><PaketEngeli ozellik="raporlar" /></>

  return (
    <>
      <Topbar title="Raporlar" subtitle="İşletme performans özeti" search={false} />
      <div className="page">
        {/* Dönem seçici */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DONEM_OPT.map((o) => (
            <button key={o.k} onClick={() => setDonem(o.k)}
              className={'btn btn-sm ' + (donem === o.k ? 'btn-gold' : 'btn-ghost')}>
              {o.ad}
            </button>
          ))}
        </div>

        {/* Özet kartlar */}
        <div className="metric-grid">
          <MetrikKart
            ikon={<CalendarCheck size={20} />}
            renk="var(--gold)"
            bg="rgba(201,169,110,.13)"
            baslik="Toplam Randevu"
            deger={String(r?.toplam ?? '—')}
            alt={rapor.isLoading ? '…' : `${r?.tamamlanan ?? 0} tamamlandı · ${r?.iptal ?? 0} iptal`}
          />
          <MetrikKart
            ikon={<TrendingUp size={20} />}
            renk="#2ECC71"
            bg="rgba(46,204,113,.13)"
            baslik="Randevu Geliri"
            deger={tl(r?.toplam_gelir)}
            alt={rapor.isLoading ? '…' : `Doluluk %${pct(r?.tamamlanan ?? 0, r?.toplam ?? 0)}`}
          />
          <MetrikKart
            ikon={<Coins size={20} />}
            renk="#3B82F6"
            bg="rgba(59,130,246,.13)"
            baslik="Finans Geliri"
            deger={tl(f?.toplam_gelir)}
            alt={finans.isLoading ? '…' : `Gider: ${tl(gider)}`}
          />
          <MetrikKart
            ikon={<XCircle size={20} />}
            renk={net >= 0 ? '#2ECC71' : '#E74C3C'}
            bg={net >= 0 ? 'rgba(46,204,113,.13)' : 'rgba(231,76,60,.13)'}
            baslik="Net Kar"
            deger={tl(net)}
            alt="Randevu + Finans geliri − Gider"
          />
        </div>

        {/* Hizmet & Personel breakdown */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
          {/* Hizmet bazlı */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Scissors size={15} style={{ color: 'var(--gold)' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Hizmet Dağılımı</span>
            </div>
            {randevular.isLoading ? <div style={{ height: 120, opacity: 0.3, background: 'var(--surface3)', borderRadius: 8 }} />
              : hizmetOzet.length === 0 ? <Bos mesaj="Bu dönemde tamamlanan randevu yok." />
              : hizmetOzet.map((h) => (
                <BarSatir key={h.ad} ad={h.ad} sayi={h.sayi} gelir={h.gelir} max={maxHizmet} renk="var(--gold)" />
              ))}
          </div>

          {/* Personel bazlı */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <UserCheck size={15} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Personel Performansı</span>
            </div>
            {randevular.isLoading ? <div style={{ height: 120, opacity: 0.3, background: 'var(--surface3)', borderRadius: 8 }} />
              : personelOzet.length === 0 ? <Bos mesaj="Bu dönemde tamamlanan randevu yok." />
              : personelOzet.map((p) => (
                <BarSatir key={p.ad} ad={p.ad} sayi={p.sayi} gelir={p.gelir} max={maxPersonel} renk="#3B82F6" />
              ))}
          </div>
        </div>

        {/* Durum dağılımı donut chart + günlük trend */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {r && r.toplam > 0 && (
            <div className="panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <BarChart3 size={15} style={{ color: 'var(--text2)' }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Durum Dağılımı</span>
              </div>
              <DonutChart
                dilimleri={[
                  { etiket: 'Tamamlandı', deger: r.tamamlanan, renk: '#2ECC71' },
                  { etiket: 'Bekleyen', deger: r.toplam - r.tamamlanan - r.iptal, renk: '#C9A96E' },
                  { etiket: 'İptal', deger: r.iptal, renk: '#E74C3C' },
                ]}
                toplam={r.toplam}
              />
            </div>
          )}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingUp size={15} style={{ color: '#2ECC71' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Son 30 Gün Gelir Trendi</span>
            </div>
            <AlanGrafik randevular={randevular.data ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}

function MetrikKart({ ikon, renk, bg, baslik, deger, alt }: { ikon: React.ReactNode; renk: string; bg: string; baslik: string; deger: string; alt: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div className="bell-ic" style={{ width: 36, height: 36, background: bg, color: renk }}>{ikon}</div>
        <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{baslik}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: renk, marginBottom: 4 }}>{deger}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{alt}</div>
    </div>
  )
}

function BarSatir({ ad, sayi, gelir, max, renk }: { ad: string; sayi: number; gelir: number; max: number; renk: string }) {
  const pct = Math.round((sayi / max) * 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
        <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{ad}</span>
        <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{sayi} seans · {Number(gelir).toLocaleString('tr-TR')} ₺</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--surface3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: renk, borderRadius: 4, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

function Bos({ mesaj }: { mesaj: string }) {
  return <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: 13 }}>{mesaj}</div>
}

interface DonutDilim { etiket: string; deger: number; renk: string }

function DonutChart({ dilimleri, toplam }: { dilimleri: DonutDilim[]; toplam: number }) {
  const r = 54; const cx = 70; const cy = 70; const stroke = 18
  let baslangic = -Math.PI / 2
  const dilimler = dilimleri.map((d) => {
    const aci = (d.deger / toplam) * 2 * Math.PI
    const x1 = cx + r * Math.cos(baslangic)
    const y1 = cy + r * Math.sin(baslangic)
    baslangic += aci
    const x2 = cx + r * Math.cos(baslangic)
    const y2 = cy + r * Math.sin(baslangic)
    const buyuk = aci > Math.PI ? 1 : 0
    return { ...d, aci, x1, y1, x2, y2, buyuk }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {dilimler.filter(d => d.deger > 0).map((d, i) => (
          <path key={i}
            d={`M ${cx} ${cy} L ${d.x1} ${d.y1} A ${r} ${r} 0 ${d.buyuk} 1 ${d.x2} ${d.y2} Z`}
            fill={d.renk} opacity={0.85}
          >
            <title>{d.etiket}: {d.deger}</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={r - stroke} fill="var(--surface)" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text)" fontSize={18} fontWeight={700}>{toplam}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--muted)" fontSize={10}>randevu</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dilimleri.map((d) => (
          <div key={d.etiket} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: d.renk, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ color: 'var(--text2)' }}>{d.etiket}</span>
            <span style={{ fontWeight: 600, marginLeft: 'auto', paddingLeft: 8 }}>{d.deger}</span>
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>%{pct(d.deger, toplam)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlanGrafik({ randevular }: { randevular: Randevu[] }) {
  const gunler = useMemo(() => {
    const bugun = new Date()
    const map: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(bugun); d.setDate(d.getDate() - i)
      map[d.toISOString().slice(0, 10)] = 0
    }
    for (const r of randevular) {
      if (r.durum === 'tamamlandi' && r.tarih && map[r.tarih] !== undefined) {
        map[r.tarih] += Number(r.fiyat || 0)
      }
    }
    return Object.entries(map).map(([tarih, gelir]) => ({ tarih, gelir }))
  }, [randevular])

  const maxGelir = Math.max(1, ...gunler.map(g => g.gelir))
  const W = 280; const H = 90; const pad = 4

  const noktalar = gunler.map((g, i) => ({
    x: pad + (i / (gunler.length - 1)) * (W - pad * 2),
    y: H - pad - (g.gelir / maxGelir) * (H - pad * 2),
    ...g,
  }))

  const alan = noktalar.length < 2 ? '' : [
    `M ${noktalar[0].x} ${H}`,
    ...noktalar.map(n => `L ${n.x} ${n.y}`),
    `L ${noktalar[noktalar.length - 1].x} ${H}`,
    'Z',
  ].join(' ')

  const cizgi = noktalar.length < 2 ? '' : [
    `M ${noktalar[0].x} ${noktalar[0].y}`,
    ...noktalar.slice(1).map(n => `L ${n.x} ${n.y}`),
  ].join(' ')

  if (randevular.length === 0) return <Bos mesaj="Henüz veri yok." />

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="alan-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2ECC71" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={alan} fill="url(#alan-grad)" />
        <path d={cizgi} fill="none" stroke="#2ECC71" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {noktalar.filter(n => n.gelir > 0).map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={3} fill="#2ECC71">
            <title>{n.tarih}: {Number(n.gelir).toLocaleString('tr-TR')} ₺</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--faint)', marginTop: 4 }}>
        <span>{gunler[0]?.tarih?.slice(5)}</span>
        <span>{gunler[14]?.tarih?.slice(5)}</span>
        <span>{gunler[29]?.tarih?.slice(5)}</span>
      </div>
    </div>
  )
}
