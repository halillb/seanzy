import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, FileText, Tags, UploadCloud, PackagePlus, Plus, Repeat, Layers, ChevronsLeftRight } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import HizmetForm, { type Hizmet } from '../components/HizmetForm'
import KategoriYonet from '../components/KategoriYonet'
import PaketKur from '../components/PaketKur'
import ImportModal from '../components/ImportModal'
import { HIZMET_IMPORT } from '../lib/importConfig'
import { apiGet } from '../lib/api'

const tl = (n: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'
const CINSIYET_AD: Record<string, string> = { bayan: 'Bayan', erkek: 'Erkek' }

export default function Hizmetler() {
  const [kat, setKat] = useState('hepsi')
  const [arama, setArama] = useState('')
  const [yeni, setYeni] = useState(false)
  const [duzenle, setDuzenle] = useState<Hizmet | null>(null)
  const [katYonet, setKatYonet] = useState(false)
  const [iceAktar, setIceAktar] = useState(false)
  const [paketKur, setPaketKur] = useState(false)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['hizmetler'],
    queryFn: () => apiGet<Hizmet[]>('hizmet.php', 'liste'),
  })

  const kategoriler = useMemo(
    () => Array.from(new Set((data ?? []).map((h) => h.kategori_ad).filter(Boolean))) as string[],
    [data],
  )
  const liste = useMemo(() => {
    let arr = kat === 'hepsi' ? data ?? [] : (data ?? []).filter((h) => h.kategori_ad === kat)
    if (arama.trim()) {
      const q = arama.trim().toLocaleLowerCase('tr')
      arr = arr.filter((h) => (h.ad || h.ad_tr || '').toLocaleLowerCase('tr').includes(q))
    }
    return arr
  }, [data, kat, arama])

  return (
    <>
      <Topbar title="Hizmetler" subtitle={data ? `${data.length} aktif hizmet · ${kategoriler.length} kategori` : 'Yükleniyor…'}
        search="Hizmet ara…" searchValue={arama} onSearch={setArama} />
      <Modal open={yeni} onClose={() => setYeni(false)} title="Yeni Hizmet"><HizmetForm onClose={() => setYeni(false)} /></Modal>
      <Modal open={!!duzenle} onClose={() => setDuzenle(null)} title="Hizmet Düzenle">
        {duzenle && <HizmetForm mevcut={duzenle} onClose={() => setDuzenle(null)} />}
      </Modal>
      <Modal open={katYonet} onClose={() => setKatYonet(false)} title="Kategorileri Yönet" maxWidth={440}>
        <KategoriYonet onClose={() => setKatYonet(false)} />
      </Modal>
      <Modal open={iceAktar} onClose={() => setIceAktar(false)} title="Hizmetleri İçe Aktar">
        <ImportModal config={HIZMET_IMPORT} onClose={() => setIceAktar(false)} />
      </Modal>
      <Modal open={paketKur} onClose={() => setPaketKur(false)} title="Yeni Paket">
        <PaketKur onClose={() => setPaketKur(false)} />
      </Modal>

      <div className="page">
        {/* Üst araç çubuğu: yatay kategori sekmeleri + aksiyonlar */}
        <div className="hiz-toolbar">
          <div className="hiz-kats-wrap">
            <span className="hiz-kats-lbl"><ChevronsLeftRight size={12} /> Kategoriler</span>
            <div className="hiz-kats">
            <button className={'hiz-kat' + (kat === 'hepsi' ? ' ak' : '')} onClick={() => setKat('hepsi')}>
              Tümü <span className="hiz-kat-n">{data?.length ?? 0}</span>
            </button>
            {kategoriler.map((k) => {
              const n = (data ?? []).filter((h) => h.kategori_ad === k).length
              return (
                <button key={k} className={'hiz-kat' + (kat === k ? ' ak' : '')} onClick={() => setKat(k)}>
                  {k} <span className="hiz-kat-n">{n}</span>
                </button>
              )
            })}
            </div>
          </div>
          <div className="hiz-actions">
            <button className="btn btn-sm btn-ghost" onClick={() => setIceAktar(true)}><UploadCloud size={14} /> <span className="hiz-act-lbl">İçe Aktar</span></button>
            <button className="btn btn-sm btn-ghost" onClick={() => setKatYonet(true)}><Tags size={14} /> <span className="hiz-act-lbl">Kategoriler</span></button>
            <button className="btn btn-sm btn-ghost" onClick={() => setPaketKur(true)}><PackagePlus size={14} /> <span className="hiz-act-lbl">Paket Oluştur</span></button>
            <button className="btn btn-sm btn-gold" onClick={() => setYeni(true)}><Plus size={14} /> <span className="hiz-act-lbl">Hizmet</span></button>
          </div>
        </div>

        {isLoading && <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>{[...Array(6)].map((_, i) => <div key={i} className="card" style={{ height: 150, opacity: 0.5 }} />)}</div>}
        {isError && <div className="panel" style={{ textAlign: 'center', color: 'var(--red)', padding: 40 }}>{(error as Error)?.message}</div>}
        {!isLoading && !isError && liste.length === 0 && (
          <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 46 }}>
            {arama ? 'Aramayla eşleşen hizmet yok.' : 'Hizmet bulunamadı.'}
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
          {!isLoading && liste.map((h) => (
            <div key={h.id} className="hiz-card" onClick={() => setDuzenle(h)}>
              <div className="hiz-card-bar" style={{ background: h.renk || 'var(--gold)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{h.ad}</div>
                {(h.on_talimat || h.son_talimat) && <FileText size={14} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} aria-label="Talimat notu var" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{h.kategori_ad || 'Genel'}</span>
                {h.cinsiyet && h.cinsiyet !== 'genel' && <span className="badge badge-muted">{CINSIYET_AD[h.cinsiyet]}</span>}
                {h.hizmet_tipi === 'seansli' && (
                  <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Repeat size={10} /> {h.varsayilan_seans} seans
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--gold-text)' }}>{tl(h.fiyat || 0)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} />{h.sure_dk} dk</div>
              </div>
            </div>
          ))}
          <button className="hiz-card hiz-card-add" onClick={() => setYeni(true)} type="button">
            <Layers size={20} />
            <span>Yeni Hizmet Ekle</span>
          </button>
        </div>
      </div>
    </>
  )
}
