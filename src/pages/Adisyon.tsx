import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Receipt, Plus, Search, Trash2, Printer, PackageSearch } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import PaketEngeli from '../components/PaketEngeli'
import HizmetSecici, { type SecilenKalem } from '../components/HizmetSecici'
import { useErisim } from '../hooks/useErisim'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import { trTarih } from '../lib/tarih'
import Select from '../components/Select'

const ODEME_YONTEM = ['Nakit', 'Kredi Kartı', 'Havale', 'Multinet', 'Sodexo', 'Edenred']
const ODEME_RENK: Record<string, string> = {
  odendi: 'var(--green)', kismi: 'var(--gold)', bekliyor: '#ff8a7d',
}
const ODEME_AD: Record<string, string> = { odendi: 'Ödendi', kismi: 'Kısmi', bekliyor: 'Bekliyor' }
const tl = (n: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'

interface Adisyon {
  id: number
  musteri_ad?: string
  musteri_tel?: string
  toplam: number
  odenen: number
  kalan: number
  odeme_durumu: string
  odeme_yontem?: string
  notlar?: string
  olusturma_tarihi: string
  kalemler?: { ad: string; adet: number; birim_fiyat: number }[]
}

interface YeniAdisyonForm {
  musteri_id: number | null
  musteri_ad: string
  notlar: string
  odeme_yontem: string
  kalemler: { ad: string; adet: number; birim_fiyat: number }[]
}

function YeniModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<YeniAdisyonForm>({
    musteri_id: null, musteri_ad: '', notlar: '',
    odeme_yontem: 'Nakit', kalemler: [],
  })
  const [hata, setHata] = useState('')
  const [katalogAcik, setKatalogAcik] = useState(false)
  const [katalogSecim, setKatalogSecim] = useState<SecilenKalem[]>([])
  const [indirimTip, setIndirimTip] = useState<'yok' | 'yuzde' | 'tutar'>('yok')
  const [indirimDeger, setIndirimDeger] = useState('')

  const araToplam = form.kalemler.reduce((s, k) => s + k.adet * k.birim_fiyat, 0)
  const indirimDegerSayi = Number(indirimDeger) || 0
  const indirimTutar = indirimTip === 'yuzde' ? araToplam * (indirimDegerSayi / 100) : indirimTip === 'tutar' ? indirimDegerSayi : 0
  const toplam = Math.max(0, araToplam - indirimTutar)

  const ekle = useMutation({
    mutationFn: () => apiPost('adisyon.php', 'ekle', { ...form, indirim_tutar: indirimTutar } as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adisyonlar'] }); onClose() },
    onError: (e) => setHata((e as Error).message),
  })

  function katalogEkle() {
    const yeniKalemler = katalogSecim.map((k) => ({ ad: k.ad, adet: 1, birim_fiyat: k.fiyat }))
    setForm((f) => ({ ...f, kalemler: [...f.kalemler, ...yeniKalemler] }))
    setKatalogSecim([])
    setKatalogAcik(false)
  }

  function kalemGuncelle(i: number, k: Partial<{ ad: string; adet: number; birim_fiyat: number }>) {
    setForm((f) => { const arr = [...f.kalemler]; arr[i] = { ...arr[i], ...k }; return { ...f, kalemler: arr } })
  }
  function kalemEkle() { setForm((f) => ({ ...f, kalemler: [...f.kalemler, { ad: '', adet: 1, birim_fiyat: 0 }] })) }
  function kalemSil(i: number) { setForm((f) => ({ ...f, kalemler: f.kalemler.filter((_, j) => j !== i) })) }

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err" style={{ marginBottom: 14 }}>{hata}</div>}
        <div className="field"><label>Müşteri Adı</label>
          <input className="input" value={form.musteri_ad} onChange={(e) => setForm((f) => ({ ...f, musteri_ad: e.target.value }))} placeholder="Ad Soyad" />
        </div>
        <div className="field"><label>Ödeme Yöntemi</label>
          <Select className="input" value={form.odeme_yontem} onChange={(e) => setForm((f) => ({ ...f, odeme_yontem: e.target.value }))}>
            {ODEME_YONTEM.map((y) => <option key={y}>{y}</option>)}
          </Select>
        </div>

        {/* Kalemler */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Hizmet / Ürün Kalemleri</div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setKatalogAcik(true)}><PackageSearch size={13} /> Katalogdan Ekle</button>
          </div>
          {form.kalemler.map((k, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0,60px) minmax(0,90px) 32px', gap: 6, marginBottom: 6 }}>
              <input className="input" placeholder="Hizmet/Ürün adı" value={k.ad} onChange={(e) => kalemGuncelle(i, { ad: e.target.value })} style={{ fontSize: 13 }} />
              <input className="input" type="number" min={1} value={k.adet} onChange={(e) => kalemGuncelle(i, { adet: +e.target.value })} style={{ fontSize: 13, textAlign: 'center' }} />
              <input className="input" type="number" min={0} value={k.birim_fiyat} onChange={(e) => kalemGuncelle(i, { birim_fiyat: +e.target.value })} style={{ fontSize: 13 }} placeholder="Fiyat" />
              <button type="button" className="btn btn-ghost" onClick={() => kalemSil(i)} style={{ padding: '0 8px', color: '#ff8a7d' }}><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={kalemEkle} style={{ fontSize: 12, marginTop: 4 }}><Plus size={13} /> Manuel Kalem Ekle</button>
        </div>

        <div className="form-grid" style={{ marginBottom: 8 }}>
          <div className="field" style={{ margin: 0 }}><label>İndirim</label>
            <Select className="input" value={indirimTip} onChange={(e) => setIndirimTip(e.target.value as typeof indirimTip)}>
              <option value="yok">İndirim Yok</option>
              <option value="yuzde">Yüzde (%)</option>
              <option value="tutar">Tutar (₺)</option>
            </Select>
          </div>
          {indirimTip !== 'yok' && (
            <div className="field" style={{ margin: 0 }}><label>{indirimTip === 'yuzde' ? 'Yüzde' : 'Tutar (₺)'}</label>
              <input className="input" type="number" min={0} value={indirimDeger} onChange={(e) => setIndirimDeger(e.target.value)} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
            {indirimTutar > 0 ? `Ara toplam ${tl(araToplam)} − indirim ${tl(indirimTutar)} = ` : 'Toplam:'}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold-text)' }}>{tl(toplam)}</span>
        </div>

        <div className="field"><label>Notlar</label>
          <textarea className="input" rows={2} value={form.notlar} onChange={(e) => setForm((f) => ({ ...f, notlar: e.target.value }))} />
        </div>
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button className="btn btn-gold" disabled={ekle.isPending || form.kalemler.every((k) => !k.ad)} onClick={() => ekle.mutate()}>
          {ekle.isPending ? <span className="spin" /> : <><Receipt size={15} /> Adisyon Oluştur</>}
        </button>
      </div>

      <Modal open={katalogAcik} onClose={() => setKatalogAcik(false)} title="Katalogdan Hizmet Ekle">
        <div className="modal-b">
          <HizmetSecici value={katalogSecim} onChange={setKatalogSecim} />
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={() => setKatalogAcik(false)}>İptal</button>
          <button className="btn btn-gold" disabled={katalogSecim.length === 0} onClick={katalogEkle}>
            <Plus size={15} /> {katalogSecim.length} Hizmeti Ekle
          </button>
        </div>
      </Modal>
    </>
  )
}

export default function Adisyon() {
  const erisim = useErisim('adisyon')
  const [yeni, setYeni] = useState(false)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState<'' | 'odendi' | 'bekliyor' | 'kismi'>('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['adisyonlar', filtre],
    queryFn: () => apiGet<Adisyon[]>('adisyon.php', 'liste', filtre ? { durum: filtre } : undefined),
    enabled: erisim,
  })

  const odemeGuncelle = useMutation({
    mutationFn: ({ id, durum }: { id: number; durum: string }) => apiPost('adisyon.php', 'odeme_guncelle', { id, odeme_durumu: durum }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adisyonlar'] }),
  })

  const sil = useMutation({
    mutationFn: (id: number) => apiPost('adisyon.php', 'sil', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adisyonlar'] }),
  })

  const liste = useMemo(() => {
    const q2 = q.trim().toLocaleLowerCase('tr')
    return (data ?? []).filter((a) => !q2 || (a.musteri_ad || '').toLocaleLowerCase('tr').includes(q2))
  }, [data, q])

  const ozet = useMemo(() => ({
    toplam: (data ?? []).reduce((s, a) => s + a.toplam, 0),
    odenen: (data ?? []).reduce((s, a) => s + a.odenen, 0),
    bekliyor: (data ?? []).filter((a) => a.odeme_durumu !== 'odendi').length,
  }), [data])

  if (!erisim) return <><Topbar title="Adisyon" subtitle="Makbuz ve tahsilat yönetimi" search={false} /><PaketEngeli ozellik="adisyon" /></>

  return (
    <>
      <Topbar title="Adisyon" subtitle="Makbuz ve tahsilat yönetimi" search={false}
        cta="Yeni Adisyon" onCta={() => setYeni(true)} />
      <Modal open={yeni} onClose={() => setYeni(false)} title="Yeni Adisyon"><YeniModal onClose={() => setYeni(false)} /></Modal>

      <div className="page">
        {/* Özet kartlar */}
        <div className="metric-grid">
          {[
            { ad: 'Toplam Ciro', deger: tl(ozet.toplam), renk: 'var(--gold)' },
            { ad: 'Tahsil Edilen', deger: tl(ozet.odenen), renk: 'var(--green)' },
            { ad: 'Bekleyen Adisyon', deger: String(ozet.bekliyor), renk: '#ff8a7d' },
          ].map((k) => (
            <div key={k.ad} className="card">
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{k.ad}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.renk }}>{k.deger}</div>
            </div>
          ))}
        </div>

        {/* Filtre + Arama */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {([['', 'Tümü'], ['odendi', 'Ödendi'], ['kismi', 'Kısmi'], ['bekliyor', 'Bekliyor']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFiltre(k)}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', background: filtre === k ? 'rgba(201,169,110,.15)' : 'var(--surface)', border: `1px solid ${filtre === k ? 'rgba(201,169,110,.4)' : 'var(--border)'}`, color: filtre === k ? 'var(--gold-text)' : 'var(--text2)' }}>
              {l}
            </button>
          ))}
          <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 0, width: '100%', maxWidth: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input className="input" placeholder="Müşteri ara…" value={q} onChange={(e) => setQ(e.target.value)} style={{ padding: '8px 12px 8px 32px', width: '100%' }} />
          </div>
        </div>

        {/* Liste */}
        <div className="panel" style={{ padding: '6px 8px' }}>
          <table className="tbl">
            <thead><tr>
              <th>Müşteri</th><th>Kalemler</th><th>Tutar</th><th>Ödeme</th><th>Durum</th><th>Tarih</th><th></th>
            </tr></thead>
            <tbody>
              {isLoading && [...Array(4)].map((_, i) => <tr key={i}><td colSpan={7}><div style={{ height: 28, borderRadius: 6, background: 'var(--surface3)', opacity: .4 }} /></td></tr>)}
              {!isLoading && liste.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Adisyon bulunamadı.</td></tr>}
              {liste.map((a) => (
                <tr key={a.id}>
                  <td><div style={{ fontWeight: 500 }}>{a.musteri_ad || 'Anonim'}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.musteri_tel}</div></td>
                  <td style={{ fontSize: 12.5, color: 'var(--text2)' }}>{(a.kalemler ?? []).map((k) => k.ad).join(', ') || '–'}</td>
                  <td><span style={{ fontWeight: 600 }}>{tl(a.toplam)}</span>{a.kalan > 0 && <div style={{ fontSize: 11, color: '#ff8a7d' }}>{tl(a.kalan)} kalan</div>}</td>
                  <td style={{ fontSize: 12.5 }}>{a.odeme_yontem || '–'}</td>
                  <td>
                    <select value={a.odeme_durumu} onChange={(e) => odemeGuncelle.mutate({ id: a.id, durum: e.target.value })}
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${ODEME_RENK[a.odeme_durumu] || 'var(--border)'}`, background: 'transparent', color: ODEME_RENK[a.odeme_durumu] || 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {Object.entries(ODEME_AD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{trTarih(a.olusturma_tarihi)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-ghost" title="Yazdır" onClick={() => window.print()} style={{ padding: '4px 8px' }}><Printer size={13} /></button>
                      <button className="btn btn-sm btn-ghost" onClick={async () => { if (await confirmAsync({ message: 'Adisyon silinsin mi?', tehlikeli: true, onaylaMetin: 'Sil' })) sil.mutate(a.id) }} style={{ padding: '4px 8px', color: '#ff8a7d' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
