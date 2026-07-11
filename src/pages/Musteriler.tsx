import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Users, UploadCloud } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import MusteriForm, { type MusteriDuzenle } from '../components/MusteriForm'
import MusteriDetay, { type MusteriOzet } from '../components/MusteriDetay'
import ImportModal from '../components/ImportModal'
import KolonSecici from '../components/KolonSecici'
import SiraBaslik from '../components/SiraBaslik'
import Pagination, { usePagination } from '../components/Pagination'
import { useKolonlar } from '../hooks/useKolonlar'
import { useSiralama } from '../hooks/useSiralama'
import { apiGet } from '../lib/api'
import { telGoster } from '../lib/text'
import { trTarih } from '../lib/tarih'

interface Musteri {
  id: number; ad: string; soyad?: string; ad_soyad?: string
  telefon: string; email?: string; son_giris?: string; son_ziyaret?: string; indirim?: number
  cinsiyet?: string; dogum_tarihi?: string; kaynak?: string; kaynak_detay?: string; instagram?: string
}

const KAYNAK_AD: Record<string, string> = {
  reklam: 'Reklam', eski_musteri: 'Eski Müşteri', referans: 'Referans', tabela: 'Tabela', diger: 'Diğer',
}
function kaynakMetin(m: Musteri): ReactNode {
  if (!m.kaynak) return <span style={{ color: 'var(--faint)' }}>—</span>
  const ad = KAYNAK_AD[m.kaynak] || m.kaynak
  return <span className="badge badge-gold">{ad}{m.kaynak_detay ? ` · ${m.kaynak_detay}` : ''}</span>
}

interface Kol { key: string; label: string; render: (m: Musteri) => ReactNode }
const KOLONLAR: Kol[] = [
  { key: 'telefon', label: 'Telefon', render: (m) => <span style={{ color: 'var(--text2)' }}>{telGoster(m.telefon)}</span> },
  { key: 'email', label: 'E-posta', render: (m) => <span style={{ color: 'var(--text2)' }}>{m.email || '—'}</span> },
  { key: 'cinsiyet', label: 'Cinsiyet', render: (m) => (m.cinsiyet ? (m.cinsiyet === 'kadin' ? 'Kadın' : 'Erkek') : '—') },
  { key: 'dogum_tarihi', label: 'Doğum Tarihi', render: (m) => <span style={{ color: 'var(--text2)' }}>{trTarih(m.dogum_tarihi)}</span> },
  { key: 'son_ziyaret', label: 'Son Ziyaret', render: (m) => <span style={{ color: 'var(--text2)' }}>{trTarih(m.son_ziyaret)}</span> },
  { key: 'son_giris', label: 'Son Giriş', render: (m) => <span style={{ color: 'var(--text2)' }}>{m.son_giris ? trTarih(m.son_giris) : '—'}</span> },
  { key: 'indirim', label: 'İndirim', render: (m) => (m.indirim ? <span className="badge badge-gold">%{m.indirim}</span> : <span style={{ color: 'var(--faint)' }}>—</span>) },
  { key: 'kaynak', label: 'Kaynak', render: kaynakMetin },
  { key: 'instagram', label: 'Instagram', render: (m) => <span style={{ color: 'var(--text2)' }}>{m.instagram || '—'}</span> },
]
const initials = (m: Musteri) => ((m.ad?.[0] || '') + (m.soyad?.[0] || '')).toUpperCase()

export default function Musteriler() {
  const [ara, setAra] = useState('')
  const [yeniAcik, setYeniAcik] = useState(false)
  const [iceAktarAcik, setIceAktarAcik] = useState(false)
  const [detay, setDetay] = useState<MusteriOzet | null>(null)
  const [duzenle, setDuzenle] = useState<MusteriDuzenle | null>(null)
  const { gorunur, toggle } = useKolonlar('musteri', ['telefon', 'son_ziyaret', 'indirim', 'kaynak', 'email'])
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['musteriler'],
    queryFn: () => apiGet<Musteri[]>('musteri.php', 'liste'),
  })

  const aktifKolonlar = KOLONLAR.filter((k) => gorunur.includes(k.key))
  const span = 2 + aktifKolonlar.length

  const liste = useMemo(() => {
    const arr = data ?? []
    if (!ara.trim()) return arr
    const q = ara.toLocaleLowerCase('tr')
    return arr.filter((m) => `${m.ad} ${m.soyad || ''} ${m.telefon}`.toLocaleLowerCase('tr').includes(q))
  }, [data, ara])

  const { sira, sirala, sirali } = useSiralama(liste, (m, key) => {
    if (key === 'musteri') return (m.ad_soyad || `${m.ad} ${m.soyad || ''}`).trim()
    if (key === 'indirim') return m.indirim ?? 0
    return (m as unknown as Record<string, string | number | undefined>)[key] ?? ''
  })

  const { sayfalanan, props: sayfaProps } = usePagination(sirali)

  return (
    <>
      <Topbar title="Müşteriler" subtitle={data ? `${data.length} kayıtlı müşteri` : 'Yükleniyor…'}
        search="İsim, telefon ara…" searchValue={ara} onSearch={setAra} cta="Müşteri" onCta={() => setYeniAcik(true)} />
      <Modal open={yeniAcik} onClose={() => setYeniAcik(false)} title="Yeni Müşteri">
        <MusteriForm onClose={() => setYeniAcik(false)} />
      </Modal>
      <Modal open={iceAktarAcik} onClose={() => setIceAktarAcik(false)} title="Müşterileri İçe Aktar">
        <ImportModal onClose={() => setIceAktarAcik(false)} />
      </Modal>
      <Modal open={!!detay} onClose={() => setDetay(null)} title="Müşteri Detayı" maxWidth={640}>
        {detay && <MusteriDetay musteri={detay} onClose={() => setDetay(null)} onEdit={() => { setDuzenle(detay as MusteriDuzenle); setDetay(null) }} />}
      </Modal>
      <Modal open={!!duzenle} onClose={() => setDuzenle(null)} title="Müşteri Düzenle">
        {duzenle && <MusteriForm mevcut={duzenle} onClose={() => setDuzenle(null)} />}
      </Modal>
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => setIceAktarAcik(true)}>
            <UploadCloud size={15} /> İçe Aktar
          </button>
          <KolonSecici kolonlar={KOLONLAR} gorunur={gorunur} toggle={toggle} />
        </div>
        <div className="panel" style={{ padding: '6px 8px' }}>
          <table className="tbl">
            <thead>
              <tr>
                <SiraBaslik k="musteri" label="Müşteri" sira={sira} onClick={sirala} />
                {aktifKolonlar.map((k) => <SiraBaslik key={k.key} k={k.key} label={k.label} sira={sira} onClick={sirala} />)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={span}><div style={{ height: 32, borderRadius: 8, background: 'var(--surface3)', opacity: 0.5 - i * 0.05 }} /></td></tr>
              ))}
              {isError && <tr><td colSpan={span} style={{ textAlign: 'center', padding: 40, color: 'var(--red)' }}>{(error as Error)?.message || 'Veri alınamadı.'}</td></tr>}
              {!isLoading && !isError && liste.length === 0 && (
                <tr><td colSpan={span} style={{ textAlign: 'center', padding: 50, color: 'var(--muted)' }}>
                  <Users size={28} style={{ opacity: 0.4, marginBottom: 8 }} /><br />
                  {ara ? 'Eşleşen müşteri yok.' : 'Henüz müşteri kaydı yok.'}
                </td></tr>
              )}
              {!isLoading && sayfalanan.map((m) => (
                <tr key={m.id} onClick={() => setDetay(m)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="cell-user">
                      <div className="tav">{initials(m) || '–'}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{m.ad_soyad || `${m.ad} ${m.soyad || ''}`.trim()}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.email || telGoster(m.telefon)}</div>
                      </div>
                    </div>
                  </td>
                  {aktifKolonlar.map((k) => <td key={k.key}>{k.render(m)}</td>)}
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Düzenle"><Pencil size={15} /></button>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Diğer"><MoreHorizontal size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...sayfaProps} />
      </div>
    </>
  )
}
