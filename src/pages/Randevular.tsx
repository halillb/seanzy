import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import RandevuDetay, { type RandevuOzet } from '../components/RandevuDetay'
import RandevuForm from '../components/RandevuForm'
import SiraBaslik from '../components/SiraBaslik'
import KolonSecici from '../components/KolonSecici'
import Pagination, { usePagination } from '../components/Pagination'
import { useSiralama } from '../hooks/useSiralama'
import { useKolonlar } from '../hooks/useKolonlar'
import { apiGet } from '../lib/api'
import { trTarih } from '../lib/tarih'

const RND_KOLON = [
  { key: 'hizmet_ad', label: 'Hizmet' },
  { key: 'personel_ad', label: 'Personel' },
  { key: 'fiyat', label: 'Tutar' },
]

interface Randevu {
  id: number
  musteri_ad?: string
  musteri_tel?: string
  personel_ad?: string
  hizmet_ad?: string
  tarih?: string
  baslangic?: string
  fiyat?: number | string
  durum: string
  iptal_nedeni?: string
  olusturma_tarihi?: string
  olusturan_ad?: string
  olusturan_rol?: string
  iptal_eden_ad?: string
  iptal_eden_rol?: string
  iptal_tarihi?: string
}

const DURUM: Record<string, [string, string]> = {
  bekliyor: ['Bekliyor', 'badge-gold'],
  onaylandi: ['Onaylı', 'badge-green'],
  tamamlandi: ['Tamamlandı', 'badge-blue'],
  iptal: ['İptal', 'badge-red'],
  iptal_talebi: ['İptal Talebi', 'badge-red'],
  gelmedi: ['Gelmedi', 'badge-muted'],
}
const TABS: [string, string][] = [
  ['hepsi', 'Tümü'], ['bekliyor', 'Bekleyen'], ['onaylandi', 'Onaylı'], ['tamamlandi', 'Tamamlandı'], ['iptal', 'İptal Edildi'],
]
const IPTAL_DURUMLAR = ['iptal', 'gelmedi', 'iptal_talebi']
const saat = (s?: string) => (s ? s.slice(0, 5) : '—')
const tl = (n?: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'

export default function Randevular() {
  const [tab, setTab] = useState('hepsi')
  const [tarih, setTarih] = useState('')
  const [q, setQ] = useState('')
  const [secili, setSecili] = useState<RandevuOzet | null>(null)
  const [yeni, setYeni] = useState(false)
  const [duzenleR, setDuzenleR] = useState<RandevuOzet | null>(null)
  const { gorunur: kol, toggle: kolToggle } = useKolonlar('randevu', ['hizmet_ad', 'personel_ad', 'fiyat'])
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['randevular'],
    queryFn: () => apiGet<Randevu[]>('randevu.php', 'liste'),
  })

  const liste = useMemo(() => {
    const iptalTab = tab === 'iptal'
    let arr = iptalTab
      ? (data ?? []).filter((r) => IPTAL_DURUMLAR.includes(r.durum))
      : (data ?? []).filter((r) => !IPTAL_DURUMLAR.includes(r.durum))
    if (!iptalTab && tab !== 'hepsi') arr = arr.filter((r) => r.durum === tab)
    if (tarih) arr = arr.filter((r) => r.tarih === tarih)
    if (q.trim()) {
      const t = q.toLocaleLowerCase('tr')
      arr = arr.filter((r) => `${r.musteri_ad || ''} ${r.musteri_tel || ''} ${r.hizmet_ad || ''} ${r.personel_ad || ''}`.toLocaleLowerCase('tr').includes(t))
    }
    return arr
  }, [data, tab, tarih, q])

  const { sira, sirala, sirali } = useSiralama(liste, (r, key) => {
    if (key === 'tarih') return `${r.tarih || ''} ${r.baslangic || ''}`
    if (key === 'fiyat') return Number(r.fiyat || 0)
    return (r as unknown as Record<string, string | number | undefined>)[key] ?? ''
  }, { key: 'tarih', dir: -1 })

  const { sayfalanan, props: sayfaProps } = usePagination(sirali)

  const say = (d: string) => (data ?? []).filter((r) => r.durum === d).length

  return (
    <>
      <Topbar title="Randevular" subtitle={data ? `${data.length} randevu` : 'Yükleniyor…'} search={false} cta="Randevu" onCta={() => setYeni(true)} />
      <Modal open={!!secili} onClose={() => setSecili(null)} title="Randevu Detayı" maxWidth={460}>
        {secili && <RandevuDetay randevu={secili} onClose={() => setSecili(null)} onEdit={(rr) => { setSecili(null); setDuzenleR(rr) }} />}
      </Modal>
      <Modal open={yeni} onClose={() => setYeni(false)} title="Yeni Randevu">
        {yeni && <RandevuForm onClose={() => setYeni(false)} />}
      </Modal>
      <Modal open={!!duzenleR} onClose={() => setDuzenleR(null)} title="Randevu Düzenle">
        {duzenleR && <RandevuForm mevcut={duzenleR} onClose={() => setDuzenleR(null)} />}
      </Modal>
      <div className="page">
        <div className="metric-grid">
          <div className="card metric"><div className="mlbl">Aktif</div><div className="mval">{(data ?? []).filter(r => !IPTAL_DURUMLAR.includes(r.durum)).length ?? '—'}</div></div>
          <div className="card metric"><div className="mlbl">Bekleyen</div><div className="mval" style={{ color: 'var(--gold)' }}>{say('bekliyor')}</div></div>
          <div className="card metric"><div className="mlbl">Onaylı</div><div className="mval" style={{ color: 'var(--green)' }}>{say('onaylandi')}</div></div>
          <div className="card metric"><div className="mlbl">Tamamlandı</div><div className="mval" style={{ color: 'var(--blue)' }}>{say('tamamlandi')}</div></div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: 3, overflowX: 'auto', flexShrink: 0, maxWidth: '100%' }}>
            {TABS.map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{ border: 'none', background: tab === k ? 'rgba(201,169,110,.15)' : 'none', color: tab === k ? 'var(--gold-text)' : 'var(--muted)', fontFamily: 'inherit', fontSize: 12, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {l}
              </button>
            ))}
          </div>
          <input className="input" style={{ width: 'auto', padding: '8px 11px', marginLeft: 'auto', minWidth: 200 }}
            placeholder="Müşteri / hizmet / personel ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          <input type="date" className="input" style={{ width: 'auto', padding: '8px 11px' }}
            value={tarih} onChange={(e) => setTarih(e.target.value)} />
          {tarih && <button className="btn btn-sm btn-ghost" onClick={() => setTarih('')}>Temizle</button>}
          <KolonSecici kolonlar={RND_KOLON} gorunur={kol} toggle={kolToggle} />
        </div>

        <div className="panel" style={{ padding: '6px 8px', overflowX: 'auto' }}>
          {tab === 'iptal' ? (
            <table className="tbl" style={{ minWidth: 860 }}>
              <thead><tr>
                <SiraBaslik k="tarih" label="Randevu Tarihi" sira={sira} onClick={sirala} />
                <SiraBaslik k="musteri_ad" label="Müşteri" sira={sira} onClick={sirala} />
                <SiraBaslik k="personel_ad" label="Personel" sira={sira} onClick={sirala} />
                <SiraBaslik k="hizmet_ad" label="Hizmet" sira={sira} onClick={sirala} />
                <SiraBaslik k="fiyat" label="Tutar" sira={sira} onClick={sirala} />
                <SiraBaslik k="olusturma_tarihi" label="Oluşturulma" sira={sira} onClick={sirala} />
                <SiraBaslik k="olusturan_ad" label="Oluşturan" sira={sira} onClick={sirala} />
                <SiraBaslik k="iptal_tarihi" label="İptal Tarihi" sira={sira} onClick={sirala} />
                <SiraBaslik k="iptal_eden_ad" label="İptal Eden" sira={sira} onClick={sirala} />
                <SiraBaslik k="durum" label="Durum" sira={sira} onClick={sirala} />
              </tr></thead>
              <tbody>
                {isLoading && [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={10}><div style={{ height: 30, borderRadius: 8, background: 'var(--surface3)', opacity: 0.5 }} /></td></tr>
                ))}
                {isError && <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--red)' }}>{(error as Error)?.message}</td></tr>}
                {!isLoading && !isError && sirali.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 46, color: 'var(--muted)' }}>İptal edilen randevu yok.</td></tr>
                )}
                {!isLoading && sayfalanan.map((r) => {
                  const [lbl, cls] = DURUM[r.durum] || [r.durum, 'badge-muted']
                  const rolBadge = (rol?: string) => rol === 'musteri' ? '(Müşteri)' : rol === 'personel' ? '(Personel)' : rol === 'mudur' ? '(Müdür)' : ''
                  return (
                    <tr key={r.id} onClick={() => setSecili(r)} style={{ cursor: 'pointer', opacity: 0.85 }}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500 }}>{saat(r.baslangic)}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{trTarih(r.tarih)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.musteri_ad || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.musteri_tel}</div>
                      </td>
                      <td><span className="pill">{r.personel_ad || '—'}</span></td>
                      <td>{r.hizmet_ad || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{tl(r.fiyat)}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text2)' }}>{r.olusturma_tarihi || '—'}</td>
                      <td>
                        <div style={{ fontSize: 12 }}>{r.olusturan_ad || '—'}</div>
                        {r.olusturan_rol && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{rolBadge(r.olusturan_rol)}</div>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--red)' }}>{r.iptal_tarihi || '—'}</td>
                      <td>
                        <div style={{ fontSize: 12 }}>{r.iptal_eden_ad || '—'}</div>
                        {r.iptal_eden_rol && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{rolBadge(r.iptal_eden_rol)}</div>}
                        {r.iptal_nedeni && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>"{r.iptal_nedeni}"</div>}
                      </td>
                      <td><span className={`badge ${cls}`}>{lbl}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <table className="tbl">
              <thead><tr>
                <SiraBaslik k="tarih" label="Tarih / Saat" sira={sira} onClick={sirala} />
                <SiraBaslik k="musteri_ad" label="Müşteri" sira={sira} onClick={sirala} />
                {kol.includes('hizmet_ad') && <SiraBaslik k="hizmet_ad" label="Hizmet" sira={sira} onClick={sirala} />}
                {kol.includes('personel_ad') && <SiraBaslik k="personel_ad" label="Personel" sira={sira} onClick={sirala} />}
                {kol.includes('fiyat') && <SiraBaslik k="fiyat" label="Tutar" sira={sira} onClick={sirala} />}
                <SiraBaslik k="durum" label="Durum" sira={sira} onClick={sirala} />
              </tr></thead>
              <tbody>
                {isLoading && [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={3 + kol.length}><div style={{ height: 30, borderRadius: 8, background: 'var(--surface3)', opacity: 0.5 }} /></td></tr>
                ))}
                {isError && <tr><td colSpan={3 + kol.length} style={{ textAlign: 'center', padding: 40, color: 'var(--red)' }}>{(error as Error)?.message}</td></tr>}
                {!isLoading && !isError && liste.length === 0 && (
                  <tr><td colSpan={3 + kol.length} style={{ textAlign: 'center', padding: 46, color: 'var(--muted)' }}>Bu filtrede randevu yok.</td></tr>
                )}
                {!isLoading && sayfalanan.map((r) => {
                  const [lbl, cls] = DURUM[r.durum] || [r.durum, 'badge-muted']
                  return (
                    <tr key={r.id} onClick={() => setSecili(r)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--text2)' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{saat(r.baslangic)}</div>
                        <div style={{ fontSize: 11 }}>{trTarih(r.tarih)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.musteri_ad || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.musteri_tel}</div>
                      </td>
                      {kol.includes('hizmet_ad') && <td>{r.hizmet_ad || '—'}</td>}
                      {kol.includes('personel_ad') && <td><span className="pill">{r.personel_ad || '—'}</span></td>}
                      {kol.includes('fiyat') && <td style={{ fontWeight: 500 }}>{tl(r.fiyat)}</td>}
                      <td><span className={`badge ${cls}`}>{lbl}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <Pagination {...sayfaProps} />
      </div>
    </>
  )
}
