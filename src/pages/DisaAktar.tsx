import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Users, Scissors, Package, Layers, UserCheck, CalendarDays, Coins, Download, Check, FileSpreadsheet } from 'lucide-react'
import Topbar from '../components/Topbar'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet } from '../lib/api'

type Row = Record<string, unknown>
interface Sutun { key: string; baslik: string; al: (r: Row) => string | number }
interface Kaynak { key: string; ad: string; ic: React.ReactNode; dosya: string; action: string; sutunlar: Sutun[] }

const v = (x: unknown) => (x == null ? '' : (x as string | number))
const s = (key: string, baslik: string): Sutun => ({ key, baslik, al: (r) => v(r[key]) })

const KAYNAKLAR: Kaynak[] = [
  { key: 'musteri', ad: 'Müşteriler', ic: <Users size={18} />, dosya: 'musteri.php', action: 'liste', sutunlar: [
    s('ad', 'Ad'), s('soyad', 'Soyad'), s('telefon', 'Telefon'), s('email', 'E-posta'),
    s('cinsiyet', 'Cinsiyet'), s('dogum_tarihi', 'Doğum Tarihi'), s('tc', 'TC Kimlik'), s('instagram', 'Instagram'),
    s('kaynak', 'Kaynak'), s('kaynak_detay', 'Kaynak Detay'), s('indirim', 'İndirim %'),
    s('son_ziyaret', 'Son Ziyaret'), s('son_giris', 'Son Giriş'), s('dosya_no', 'Dosya No'), s('etiketler', 'Etiketler'), s('notlar', 'Notlar'),
  ]},
  { key: 'hizmet', ad: 'Hizmetler', ic: <Scissors size={18} />, dosya: 'hizmet.php', action: 'liste', sutunlar: [
    { key: 'ad', baslik: 'Hizmet', al: (h) => v(h.ad_tr ?? h.ad) }, s('kategori_ad', 'Kategori'),
    s('sure_dk', 'Süre (dk)'), s('fiyat', 'Fiyat'), s('renk', 'Renk'), s('on_talimat', 'Hizmet Öncesi Not'), s('son_talimat', 'Hizmet Sonrası Not'),
  ]},
  { key: 'paket', ad: 'Paket Tanımları', ic: <Package size={18} />, dosya: 'paket.php', action: 'liste', sutunlar: [
    s('ad', 'Paket'), s('hizmet_ad', 'Hizmet'), s('toplam_seans', 'Seans'), s('fiyat', 'Fiyat'),
    s('indirim_fiyat', 'İndirimli Fiyat'), s('gecerlilik_gun', 'Geçerlilik (gün)'), s('aciklama', 'Açıklama'),
  ]},
  { key: 'satis', ad: 'Satılan Paketler', ic: <Layers size={18} />, dosya: 'paket.php', action: 'satislar', sutunlar: [
    s('musteri_ad', 'Müşteri'), s('musteri_tel', 'Telefon'), s('hizmet_ad', 'Hizmet'),
    s('toplam_seans', 'Toplam Seans'), s('kullanilan_seans', 'Kullanılan'), s('kalan_seans', 'Kalan'),
    s('toplam_tutar', 'Tutar'), s('baslangic_tarihi', 'Başlangıç'), s('bitis_tarihi', 'Bitiş'), s('odeme_durumu', 'Ödeme Durumu'),
  ]},
  { key: 'personel', ad: 'Personel', ic: <UserCheck size={18} />, dosya: 'personel.php', action: 'liste', sutunlar: [
    s('ad', 'Ad'), s('soyad', 'Soyad'), s('telefon', 'Telefon'), s('email', 'E-posta'),
    s('uzmanlik', 'Görev / Sınıf'), s('rol', 'Rol'), s('taban_maas', 'Taban Maaş'), s('prim_oran', 'Prim %'), s('calisma_tipi', 'Çalışma Tipi'), s('son_giris', 'Son Giriş'),
  ]},
  { key: 'randevu', ad: 'Randevular', ic: <CalendarDays size={18} />, dosya: 'randevu.php', action: 'liste', sutunlar: [
    s('tarih', 'Tarih'), s('baslangic', 'Başlangıç'), s('bitis', 'Bitiş'), s('musteri_ad', 'Müşteri'), s('musteri_tel', 'Telefon'),
    s('hizmet_ad', 'Hizmet'), s('personel_ad', 'Personel'), s('fiyat', 'Tutar'), s('odenen', 'Ödenen'), s('durum', 'Durum'), s('kaynak', 'Kaynak'), s('notlar', 'Notlar'),
  ]},
  { key: 'finans', ad: 'Gelir / Gider', ic: <Coins size={18} />, dosya: 'finans.php', action: 'liste', sutunlar: [
    s('tarih', 'Tarih'), s('tip', 'Tip'), s('kategori', 'Kategori'), s('aciklama', 'Açıklama'), s('tutar', 'Tutar'),
    { key: 'otomatik', baslik: 'Otomatik mi', al: (f) => (f.otomatik ? 'Evet' : 'Hayır') },
  ]},
]
const hepsiKolon = (k: Kaynak) => new Set(k.sutunlar.map((x) => x.key))

export default function DisaAktar() {
  const erisim = useErisim('disa_aktar')
  const [secili, setSecili] = useState<Set<string>>(new Set(['musteri']))
  const [kolon, setKolon] = useState<Record<string, Set<string>>>(() => ({ musteri: hepsiKolon(KAYNAKLAR[0]) }))
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const datasetTikle = (k: Kaynak) => {
    setSecili((sset) => { const n = new Set(sset); n.has(k.key) ? n.delete(k.key) : n.add(k.key); return n })
    setKolon((c) => (c[k.key] ? c : { ...c, [k.key]: hepsiKolon(k) }))
  }
  const kolonTikle = (dk: string, ck: string) => setKolon((c) => {
    const set = new Set(c[dk] ?? []); set.has(ck) ? set.delete(ck) : set.add(ck); return { ...c, [dk]: set }
  })
  const tumKolon = (k: Kaynak, ac: boolean) => setKolon((c) => ({ ...c, [k.key]: ac ? hepsiKolon(k) : new Set() }))

  async function aktar() {
    setHata('')
    if (secili.size === 0) { setHata('En az bir veri türü seçin.'); return }
    setYukleniyor(true)
    try {
      const wb = XLSX.utils.book_new()
      for (const k of KAYNAKLAR.filter((x) => secili.has(x.key))) {
        const aktif = k.sutunlar.filter((col) => (kolon[k.key] ?? hepsiKolon(k)).has(col.key))
        const cols = aktif.length ? aktif : k.sutunlar
        const veri = await apiGet<Row[]>(k.dosya, k.action)
        const rows = (veri ?? []).map((r) => { const o: Record<string, string | number> = {}; for (const col of cols) o[col.baslik] = col.al(r); return o })
        const ws = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([cols.map((c) => c.baslik), ['Kayıt yok']])
        const sayfaAd = k.ad.replace(/[:\\/?*[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28)
        XLSX.utils.book_append_sheet(wb, ws, sayfaAd)
      }
      XLSX.writeFile(wb, `seanzy-disaaktarim-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (e) {
      setHata((e as Error).message || 'Dışa aktarma başarısız.')
    } finally {
      setYukleniyor(false)
    }
  }

  const seciliKaynaklar = KAYNAKLAR.filter((k) => secili.has(k.key))

  if (!erisim) return <><Topbar title="Dışa Aktar" subtitle="Excel & CSV veri aktarımı" search={false} /><PaketEngeli ozellik="disa_aktar" /></>

  return (
    <>
      <Topbar title="Dışa Aktar" subtitle="Verilerini ve sütunlarını seçip Excel olarak indir" search={false} />
      <div className="page">
        <div className="panel" style={{ maxWidth: 760, padding: 24 }}>
          {hata && <div className="form-err" style={{ marginBottom: 14 }}>{hata}</div>}
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Önce <b>veri türlerini</b>, sonra her birinde <b>hangi sütunların</b> ineceğini seç. Hepsi tek Excel dosyasında ayrı sayfalar olur.</div>

          {/* Veri türleri */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10, marginBottom: 4 }}>
            {KAYNAKLAR.map((k) => {
              const on = secili.has(k.key)
              return (
                <div key={k.key} onClick={() => datasetTikle(k)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 11, transition: 'all .12s',
                    border: `1.5px solid ${on ? 'rgba(201,169,110,.5)' : 'var(--border)'}`, background: on ? 'rgba(201,169,110,.1)' : 'var(--surface)' }}>
                  <div className="bell-ic" style={{ width: 32, height: 32, background: on ? 'rgba(201,169,110,.18)' : 'var(--surface3)', color: on ? 'var(--gold)' : 'var(--muted)' }}>{k.ic}</div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: on ? 'var(--gold-text)' : 'var(--text)' }}>{k.ad}</span>
                  <span style={{ width: 19, height: 19, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${on ? 'var(--gold)' : 'var(--border2)'}`, background: on ? 'var(--gold)' : 'transparent', color: '#0C0C0D', flexShrink: 0 }}>{on && <Check size={12} strokeWidth={3} />}</span>
                </div>
              )
            })}
          </div>

          {/* Sütun seçimi (seçili her veri türü için) */}
          {seciliKaynaklar.map((k) => {
            const set = kolon[k.key] ?? hepsiKolon(k)
            return (
              <div key={k.key} style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)' }}>{k.ad} sütunları <span style={{ color: 'var(--faint)', fontWeight: 400 }}>· {set.size}/{k.sutunlar.length}</span></div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-ghost" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={() => tumKolon(k, true)}>Tümü</button>
                    <button className="btn btn-sm btn-ghost" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={() => tumKolon(k, false)}>Temizle</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {k.sutunlar.map((col) => {
                    const con = set.has(col.key)
                    return (
                      <button key={col.key} onClick={() => kolonTikle(k.key, col.key)}
                        style={{ fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', padding: '6px 11px', borderRadius: 20, transition: 'all .12s',
                          background: con ? 'rgba(201,169,110,.16)' : 'var(--surface)', color: con ? 'var(--gold-text)' : 'var(--text2)',
                          border: `1px solid ${con ? 'rgba(201,169,110,.45)' : 'var(--border)'}` }}>
                        {con ? '✓ ' : ''}{col.baslik}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-gold" disabled={yukleniyor || secili.size === 0} onClick={aktar}>
              {yukleniyor ? <span className="spin" /> : <><Download size={16} /> Excel İndir ({secili.size})</>}
            </button>
            <span style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><FileSpreadsheet size={14} /> .xlsx</span>
          </div>
        </div>
      </div>
    </>
  )
}
