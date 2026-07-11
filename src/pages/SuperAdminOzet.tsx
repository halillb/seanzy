import { useQuery } from '@tanstack/react-query'
import { Building2, AlertTriangle, ShieldOff, Clock, UserPlus, Users, Package } from 'lucide-react'
import Topbar from '../components/Topbar'
import { apiGet } from '../lib/api'

interface SurecekIsletme {
  id: number; isletme_adi: string; slug: string; paket_turu: string; abonelik_bitis: string; kalan_gun: number
}
interface Ozet {
  toplam_isletme: number; aktif_isletme: number; kisitli_isletme: number; kapali_isletme: number
  surecek_abonelik: number; surecek_liste: SurecekIsletme[]; yeni_isletme_7gun: number
  paket_dagilim: Record<string, number>; toplam_kullanici: number
}

const PAKET_RENK: Record<string, string> = {
  basic: '#3B82F6', pro: 'var(--gold)', enterprise: '#8B5CF6', belirsiz: 'var(--muted)',
}

export default function SuperAdminOzet() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-ozet'],
    queryFn: () => apiGet<Ozet>('superadmin.php', 'ozet'),
  })

  const v = (n?: number) => (data ? String(n ?? 0) : '…')
  const paketler = Object.entries(data?.paket_dagilim ?? {})
  const toplamAktif = data?.aktif_isletme ?? 1

  return (
    <>
      <Topbar title="Platform Özeti" subtitle="Tüm platform — yönetim görünümü" search={false} />
      <div className="page">

        {/* Ana metrik kartlar */}
        <div className="metric-grid">
          <MetrikKart ikon={<Building2 size={18} />} bg="rgba(201,169,110,.14)" renk="var(--gold)"
            baslik="Toplam İşletme" deger={v(data?.toplam_isletme)} alt="Sistemdeki tüm işletmeler" />
          <MetrikKart ikon={<Building2 size={18} />} bg="rgba(46,204,113,.13)" renk="#2ECC71"
            baslik="Aktif" deger={v(data?.aktif_isletme)} alt="Normal erişim" />
          <MetrikKart ikon={<AlertTriangle size={18} />} bg="rgba(255,193,7,.13)" renk="#FFC107"
            baslik="Kısıtlı" deger={v(data?.kisitli_isletme)} alt="Ödeme bekleyen / süresi dolan" />
          <MetrikKart ikon={<ShieldOff size={18} />} bg="rgba(231,76,60,.1)" renk="#E74C3C"
            baslik="Kapalı" deger={v(data?.kapali_isletme)} alt="Erişime tamamen kapalı" />
          <MetrikKart ikon={<Clock size={18} />} bg="rgba(139,92,246,.13)" renk="#8B5CF6"
            baslik="30 Günde Dolacak" deger={v(data?.surecek_abonelik)} alt="Abonelikleri bitiyor" />
          <MetrikKart ikon={<UserPlus size={18} />} bg="rgba(59,130,246,.13)" renk="#3B82F6"
            baslik="Son 7 Gün Kayıt" deger={v(data?.yeni_isletme_7gun)} alt="Yeni işletme kaydı" />
          <MetrikKart ikon={<Users size={18} />} bg="rgba(201,169,110,.14)" renk="var(--gold)"
            baslik="Toplam Kullanıcı" deger={v(data?.toplam_kullanici)} alt="Müdür + personel + müşteri" />
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>

          {/* Paket dağılımı */}
          <div className="panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Package size={15} style={{ color: 'var(--gold)' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Paket Dağılımı</span>
            </div>
            {isLoading ? <div style={{ height: 80, background: 'var(--surface3)', borderRadius: 8, opacity: .3 }} />
              : paketler.length === 0 ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Veri yok.</div>
              : paketler.map(([kod, sayi]) => {
                const renk = PAKET_RENK[kod] || 'var(--text2)'
                const pct  = Math.round((sayi / Math.max(toplamAktif, 1)) * 100)
                return (
                  <div key={kod} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, color: renk, textTransform: 'capitalize' }}>{kod}</span>
                      <span style={{ color: 'var(--text2)' }}>{sayi} işletme · %{pct}</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: 'var(--surface3)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: renk, borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Abonelikleri dolacaklar */}
          <div className="panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Clock size={15} style={{ color: '#8B5CF6' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Aboneliği Bitenler (30 Gün)</span>
            </div>
            {isLoading ? <div style={{ height: 80, background: 'var(--surface3)', borderRadius: 8, opacity: .3 }} />
              : (data?.surecek_liste ?? []).length === 0
              ? <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>30 gün içinde biten abonelik yok.</div>
              : (data?.surecek_liste ?? []).map((i) => {
                const acil = i.kalan_gun <= 7
                return (
                  <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{i.isletme_adi}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{i.slug} · {i.paket_turu}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: acil ? '#E74C3C' : '#FFC107' }}>
                        {i.kalan_gun === 0 ? 'Bugün!' : `${i.kalan_gun} gün`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{(i.abonelik_bitis || '').slice(0, 10)}</div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </>
  )
}

function MetrikKart({ ikon, bg, renk, baslik, deger, alt }: {
  ikon: React.ReactNode; bg: string; renk: string; baslik: string; deger: string; alt: string
}) {
  return (
    <div className="card metric">
      <div className="mic" style={{ background: bg, color: renk }}>{ikon}</div>
      <div className="mlbl">{baslik}</div>
      <div className="mval" style={{ color: renk }}>{deger}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{alt}</div>
    </div>
  )
}
