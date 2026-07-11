import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, AlertTriangle, Package, ArrowUp, ArrowDown, Edit2, Trash2 } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import { trTarih } from '../lib/tarih'
import Select from '../components/Select'

const tl = (n: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'

interface Urun {
  id: number; ad: string; kategori?: string; barkod?: string
  stok: number; min_stok: number; alis_fiyat: number; satis_fiyat: number; birim?: string
}
interface StokHareket { id: number; urun_ad: string; tip: 'giris' | 'cikis'; miktar: number; notlar?: string; tarih: string }

function UrunForm({ mevcut, onClose }: { mevcut?: Urun; onClose: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ ad: mevcut?.ad || '', kategori: mevcut?.kategori || '', barkod: mevcut?.barkod || '', stok: mevcut?.stok ?? 0, min_stok: mevcut?.min_stok ?? 5, alis_fiyat: mevcut?.alis_fiyat ?? 0, satis_fiyat: mevcut?.satis_fiyat ?? 0, birim: mevcut?.birim || 'Adet' })
  const [hata, setHata] = useState('')

  const kaydet = useMutation({
    mutationFn: () => apiPost('urun.php', mevcut ? 'guncelle' : 'ekle', { ...f, ...(mevcut ? { id: mevcut.id } : {}) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['urunler'] }); onClose() },
    onError: (e) => setHata((e as Error).message),
  })

  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }))

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err" style={{ marginBottom: 14 }}>{hata}</div>}
        <div className="form-grid">
          <div className="field full" style={{ margin: 0 }}><label>Ürün Adı</label><input className="input" value={f.ad} onChange={(e) => set('ad', e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Kategori</label><input className="input" value={f.kategori} onChange={(e) => set('kategori', e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Barkod</label><input className="input" value={f.barkod} onChange={(e) => set('barkod', e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Alış Fiyatı (₺)</label><input className="input" type="number" min={0} value={f.alis_fiyat} onChange={(e) => set('alis_fiyat', +e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Satış Fiyatı (₺)</label><input className="input" type="number" min={0} value={f.satis_fiyat} onChange={(e) => set('satis_fiyat', +e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Mevcut Stok</label><input className="input" type="number" min={0} value={f.stok} onChange={(e) => set('stok', +e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Min. Stok (Uyarı)</label><input className="input" type="number" min={0} value={f.min_stok} onChange={(e) => set('min_stok', +e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Birim</label>
            <Select className="input" value={f.birim} onChange={(e) => set('birim', e.target.value)}>
              {['Adet', 'ml', 'gr', 'Litre', 'Kg', 'Paket', 'Kutu'].map((b) => <option key={b}>{b}</option>)}
            </Select>
          </div>
        </div>
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button className="btn btn-gold" disabled={kaydet.isPending || !f.ad} onClick={() => kaydet.mutate()}>
          {kaydet.isPending ? <span className="spin" /> : 'Kaydet'}
        </button>
      </div>
    </>
  )
}

function StokHareketModal({ urun, onClose }: { urun: Urun; onClose: () => void }) {
  const qc = useQueryClient()
  const [tip, setTip] = useState<'giris' | 'cikis'>('giris')
  const [miktar, setMiktar] = useState(1)
  const [notlar, setNotlar] = useState('')

  const hareket = useMutation({
    mutationFn: () => apiPost('urun.php', 'stok_hareket', { urun_id: urun.id, tip, miktar, notlar }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['urunler'] }); qc.invalidateQueries({ queryKey: ['stok-hareketler'] }); onClose() },
  })

  return (
    <>
      <div className="modal-b">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{urun.ad}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Mevcut stok: <strong>{urun.stok} {urun.birim}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([['giris', 'Stok Girişi', 'var(--green)'], ['cikis', 'Stok Çıkışı', '#ff8a7d']] as const).map(([k, l, r]) => (
            <button key={k} type="button" onClick={() => setTip(k)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${tip === k ? r : 'var(--border)'}`, background: tip === k ? `color-mix(in srgb, ${r} 12%, transparent)` : 'var(--surface)', color: tip === k ? r : 'var(--text2)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
              {l}
            </button>
          ))}
        </div>
        <div className="field"><label>Miktar ({urun.birim || 'Adet'})</label>
          <input className="input" type="number" min={1} value={miktar} onChange={(e) => setMiktar(+e.target.value)} />
        </div>
        <div className="field"><label>Notlar</label>
          <input className="input" value={notlar} onChange={(e) => setNotlar(e.target.value)} placeholder="İsteğe bağlı" />
        </div>
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button className="btn btn-gold" disabled={hareket.isPending} onClick={() => hareket.mutate()}>
          {hareket.isPending ? <span className="spin" /> : 'Kaydet'}
        </button>
      </div>
    </>
  )
}

export default function UrunStok() {
  const erisim = useErisim('urun_stok')
  const [tab, setTab] = useState<'urunler' | 'hareketler'>('urunler')
  const [yeni, setYeni] = useState(false)
  const [duzenle, setDuzenle] = useState<Urun | null>(null)
  const [hareket, setHareket] = useState<Urun | null>(null)
  const [q, setQ] = useState('')
  const qc = useQueryClient()

  const urunler = useQuery({ queryKey: ['urunler'], queryFn: () => apiGet<Urun[]>('urun.php', 'liste'), enabled: erisim })
  const hareketler = useQuery({ queryKey: ['stok-hareketler'], queryFn: () => apiGet<StokHareket[]>('urun.php', 'hareketler'), enabled: erisim && tab === 'hareketler' })

  const sil = useMutation({
    mutationFn: (id: number) => apiPost('urun.php', 'sil', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['urunler'] }),
  })

  const liste = useMemo(() => {
    const q2 = q.trim().toLocaleLowerCase('tr')
    return (urunler.data ?? []).filter((u) => !q2 || u.ad.toLocaleLowerCase('tr').includes(q2) || (u.kategori || '').toLocaleLowerCase('tr').includes(q2))
  }, [urunler.data, q])

  const dusukStok = (urunler.data ?? []).filter((u) => u.stok <= u.min_stok)

  if (!erisim) return <><Topbar title="Ürün & Stok" subtitle="Ürün satışı ve stok yönetimi" search={false} /><PaketEngeli ozellik="urun_stok" /></>

  return (
    <>
      <Topbar title="Ürün & Stok" subtitle="Ürün satışı ve stok yönetimi" search={false} cta="Yeni Ürün" onCta={() => setYeni(true)} />
      <Modal open={yeni} onClose={() => setYeni(false)} title="Yeni Ürün"><UrunForm onClose={() => setYeni(false)} /></Modal>
      <Modal open={!!duzenle} onClose={() => setDuzenle(null)} title="Ürün Düzenle">{duzenle && <UrunForm mevcut={duzenle} onClose={() => setDuzenle(null)} />}</Modal>
      <Modal open={!!hareket} onClose={() => setHareket(null)} title="Stok Hareketi" maxWidth={400}>{hareket && <StokHareketModal urun={hareket} onClose={() => setHareket(null)} />}</Modal>

      <div className="page">
        {dusukStok.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,138,125,.08)', border: '1px solid rgba(255,138,125,.25)', borderRadius: 12, padding: '12px 16px', fontSize: 13.5 }}>
            <AlertTriangle size={16} style={{ color: '#ff8a7d', flexShrink: 0 }} />
            <span><strong>{dusukStok.length}</strong> ürünün stoğu minimum seviyenin altında: {dusukStok.map((u) => u.ad).join(', ')}</span>
          </div>
        )}

        {/* Özet */}
        <div className="metric-grid">
          {[
            { ad: 'Toplam Ürün', deger: String(urunler.data?.length ?? 0), renk: 'var(--gold)' },
            { ad: 'Düşük Stok', deger: String(dusukStok.length), renk: '#ff8a7d' },
            { ad: 'Stok Değeri (Alış)', deger: tl((urunler.data ?? []).reduce((s, u) => s + u.stok * u.alis_fiyat, 0)), renk: 'var(--green)' },
            { ad: 'Potansiyel Satış', deger: tl((urunler.data ?? []).reduce((s, u) => s + u.stok * u.satis_fiyat, 0)), renk: '#6495ED' },
          ].map((k) => (
            <div key={k.ad} className="card">
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{k.ad}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.renk }}>{k.deger}</div>
            </div>
          ))}
        </div>

        {/* Sekme + Arama */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: 3 }}>
            {([['urunler', 'Ürünler'], ['hareketler', 'Stok Hareketleri']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{ border: 'none', background: tab === k ? 'rgba(201,169,110,.15)' : 'none', color: tab === k ? 'var(--gold-text)' : 'var(--muted)', fontFamily: 'inherit', fontSize: 12.5, padding: '8px 16px', borderRadius: 7, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input className="input" placeholder="Ara…" value={q} onChange={(e) => setQ(e.target.value)} style={{ padding: '8px 12px 8px 32px', minWidth: 200 }} />
          </div>
        </div>

        {tab === 'urunler' ? (
          <div className="panel" style={{ padding: '6px 8px' }}>
            <table className="tbl">
              <thead><tr><th>Ürün</th><th>Barkod</th><th>Alış</th><th>Satış</th><th>Stok</th><th></th></tr></thead>
              <tbody>
                {urunler.isLoading && [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6}><div style={{ height: 28, borderRadius: 6, background: 'var(--surface3)', opacity: .4 }} /></td></tr>)}
                {liste.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {u.stok <= u.min_stok && <AlertTriangle size={13} style={{ color: '#ff8a7d', flexShrink: 0 }} />}
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.ad}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.kategori}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{u.barkod || '–'}</td>
                    <td style={{ fontSize: 13 }}>{tl(u.alis_fiyat)}</td>
                    <td style={{ fontWeight: 500 }}>{tl(u.satis_fiyat)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: u.stok <= u.min_stok ? '#ff8a7d' : 'var(--green)' }}>{u.stok}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}> / min {u.min_stok} {u.birim}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => setHareket(u)} title="Stok hareketi" style={{ padding: '4px 8px', gap: 4, fontSize: 12 }}>
                          <Package size={13} /> Stok
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setDuzenle(u)} style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
                        <button className="btn btn-sm btn-ghost" onClick={async () => { if (await confirmAsync({ message: 'Ürün silinsin mi?', tehlikeli: true, onaylaMetin: 'Sil' })) sil.mutate(u.id) }} style={{ padding: '4px 8px', color: '#ff8a7d' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="panel" style={{ padding: '6px 8px' }}>
            <table className="tbl">
              <thead><tr><th>Ürün</th><th>Tip</th><th>Miktar</th><th>Notlar</th><th>Tarih</th></tr></thead>
              <tbody>
                {hareketler.isLoading && [...Array(4)].map((_, i) => <tr key={i}><td colSpan={5}><div style={{ height: 28, borderRadius: 6, background: 'var(--surface3)', opacity: .4 }} /></td></tr>)}
                {(hareketler.data ?? []).map((h) => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 500 }}>{h.urun_ad}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: h.tip === 'giris' ? 'var(--green)' : '#ff8a7d' }}>
                        {h.tip === 'giris' ? <ArrowDown size={13} /> : <ArrowUp size={13} />} {h.tip === 'giris' ? 'Giriş' : 'Çıkış'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{h.miktar}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{h.notlar || '–'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{trTarih(h.tarih)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
