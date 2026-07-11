import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Select from '../components/Select'
import {
  Package, Plus, Check, X, ChevronDown, ChevronUp, Trash2,
  ToggleLeft, ToggleRight, ArrowRightLeft, Edit2, Layers, Star, GripVertical,
} from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import { OZELLIKLER } from '../lib/ozellikler'
import type { OzellikHaritasi } from '../hooks/useOzellikHaritasi'

interface Ozellik { ad: string; kod?: string; aktif: boolean }
interface Paket {
  id: number; ad: string; kod: string; fiyat: number; sira: number
  renk?: string; aktif: boolean; ozellikler: Ozellik[]; isletme_sayi: number
}
interface Isletme { id: number; isletme_adi: string; slug: string; abonelik_bitis?: string }

const tl = (n: number) => n.toLocaleString('tr-TR') + ' ₺/ay'

const RENK_PALETTE = ['#8DA9C4', '#C9A96E', '#C084FC', '#4CAF50', '#FF6B6B', '#17A2B8', '#F39C12']
const SABIT_RENK: Record<string, string> = { basic: '#8DA9C4', pro: '#C9A96E', enterprise: '#C084FC' }
const paketRenk = (paket: Paket, idx: number) =>
  paket.renk || SABIT_RENK[paket.kod] || RENK_PALETTE[idx % RENK_PALETTE.length]

// Grupla OZELLIKLER
const GRUPLAR = Object.entries(
  Object.entries(OZELLIKLER).reduce<Record<string, { key: string; tanim: typeof OZELLIKLER[string] }[]>>((acc, [key, t]) => {
    if (!acc[t.grup]) acc[t.grup] = []
    acc[t.grup].push({ key, tanim: t })
    return acc
  }, {})
)

const DEFAULT_SIRA: Record<string, number> = { basic: 1, pro: 2, enterprise: 3 }

export default function SuperAdminPaketler() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'paketler' | 'harita'>('paketler')
  const [acik, setAcik] = useState<number | null>(null)
  const [yeniOzellikKod, setYeniOzellikKod] = useState<Record<number, string>>({})
  const [duzenle, setDuzenle] = useState<Paket | null>(null)
  const [yeniPaket, setYeniPaket] = useState(false)
  const [aktarModal, setAktarModal] = useState<Paket | null>(null)
  const [aktarHedef, setAktarHedef] = useState('')
  const [aktarSecili, setAktarSecili] = useState<number[]>([])
  const [hata, setHata] = useState('')
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

  const { data: paketler = [], isLoading } = useQuery({
    queryKey: ['sa-paketler'],
    queryFn: () => apiGet<Paket[]>('superadmin.php', 'paketler'),
  })

  const { data: harita = {} } = useQuery<OzellikHaritasi>({
    queryKey: ['ozellik-haritasi'],
    queryFn: () => apiGet<OzellikHaritasi>('superadmin.php', 'ozellik_haritasi'),
  })

  const aktarIsletmeler = useQuery({
    queryKey: ['sa-paket-isletmeler', aktarModal?.kod],
    queryFn: () => apiGet<Isletme[]>('superadmin.php', 'paket_isletmeler', { kod: aktarModal?.kod }),
    enabled: !!aktarModal,
  })

  const guncelleMut = useMutation({
    mutationFn: (p: { id: number; ad?: string; fiyat?: number; renk?: string; ozellikler?: Ozellik[]; aktif?: boolean }) =>
      apiPost('superadmin.php', 'paket_guncelle', p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-paketler'] }); setDuzenle(null) },
    onError: (e) => setHata((e as Error).message),
  })

  const siralarGuncelleMut = useMutation({
    mutationFn: (siralar: { id: number; sira: number }[]) =>
      apiPost('superadmin.php', 'paket_siralar_guncelle', { siralar }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-paketler'] }),
    onError: (e) => setHata((e as Error).message),
  })

  const silMut = useMutation({
    mutationFn: (id: number) => apiPost('superadmin.php', 'paket_sil', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-paketler'] }),
    onError: (e) => setHata((e as Error).message),
  })

  const aktarMut = useMutation({
    mutationFn: () => apiPost('superadmin.php', 'paket_aktar', { isletme_idler: aktarSecili, hedef_paket: aktarHedef }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-paketler'] })
      qc.invalidateQueries({ queryKey: ['sa-isletmeler'] })
      setAktarModal(null); setAktarSecili([]); setAktarHedef('')
    },
    onError: (e) => setHata((e as Error).message),
  })

  const haritaGuncelleMut = useMutation({
    mutationFn: ({ anahtar, min_paket }: { anahtar: string; min_paket: string }) =>
      apiPost('superadmin.php', 'ozellik_haritasi_guncelle', { anahtar, min_paket }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ozellik-haritasi'] }),
    onError: (e) => setHata((e as Error).message),
  })

  function ozellikToggle(paket: Paket, idx: number) {
    const yeni = paket.ozellikler.map((o, i) => i === idx ? { ...o, aktif: !o.aktif } : o)
    guncelleMut.mutate({ id: paket.id, ozellikler: yeni })
  }

  function ozellikEkle(paket: Paket) {
    const kod = yeniOzellikKod[paket.id]
    if (!kod) return
    const tanim = OZELLIKLER[kod]
    if (!tanim) return
    if (paket.ozellikler.some((o) => o.kod === kod)) return
    const yeni = [...paket.ozellikler, { ad: tanim.ad, kod, aktif: true }]
    guncelleMut.mutate({ id: paket.id, ozellikler: yeni })
    setYeniOzellikKod((p) => ({ ...p, [paket.id]: '' }))
  }

  function ozellikSil(paket: Paket, idx: number) {
    const yeni = paket.ozellikler.filter((_, i) => i !== idx)
    guncelleMut.mutate({ id: paket.id, ozellikler: yeni })
  }

  function handleDrop(hedefId: number) {
    if (dragId === null || dragId === hedefId) { setDragId(null); setDragOverId(null); return }
    const liste = [...paketler].sort((a, b) => a.sira - b.sira)
    const fromIdx = liste.findIndex((p) => p.id === dragId)
    const toIdx   = liste.findIndex((p) => p.id === hedefId)
    if (fromIdx === -1 || toIdx === -1) { setDragId(null); setDragOverId(null); return }
    const yeni = [...liste]
    const [item] = yeni.splice(fromIdx, 1)
    yeni.splice(toIdx, 0, item)
    const siralar = yeni.map((p, i) => ({ id: p.id, sira: i + 1 }))
    // Optimistic: update query cache immediately
    qc.setQueryData(['sa-paketler'], yeni.map((p, i) => ({ ...p, sira: i + 1 })))
    siralarGuncelleMut.mutate(siralar)
    setDragId(null)
    setDragOverId(null)
  }

  return (
    <>
      <Topbar title="Paket Yönetimi" subtitle="Abonelik planları ve özellik gating" search={false}
        actions={<button className="btn btn-gold" onClick={() => setYeniPaket(true)}><Plus size={14} /> Yeni Paket</button>} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        {([['paketler', 'Paketler', <Package size={14} />], ['harita', 'Özellik Haritası', <Layers size={14} />]] as const).map(([k, l, ic]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: tab === k ? 600 : 400, color: tab === k ? 'var(--gold-text)' : 'var(--text2)', borderBottom: tab === k ? '2px solid var(--gold)' : '2px solid transparent', marginBottom: -1 }}>
            {ic}{l}
          </button>
        ))}
      </div>

      <div className="page">
        {hata && <div className="form-err" style={{ marginBottom: 16 }}>{hata}<button onClick={() => setHata('')} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button></div>}

        {/* ── TAB: Paketler ── */}
        {tab === 'paketler' && (
          isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Yükleniyor…</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GripVertical size={13} />
                Sıralamayı değiştirmek için satırları sürükleyin. Üstteki paket daha düşük tier, alttaki daha yüksek tier sayılır.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[...paketler].sort((a, b) => a.sira - b.sira).map((paket, idx) => {
                  const renk = paketRenk(paket, idx)
                  const isAcik = acik === paket.id
                  const isDragging = dragId === paket.id
                  const isDragOver = dragOverId === paket.id
                  return (
                    <div key={paket.id}
                      draggable
                      onDragStart={() => setDragId(paket.id)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverId(paket.id) }}
                      onDragLeave={() => setDragOverId(null)}
                      onDrop={() => handleDrop(paket.id)}
                      onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                      className="panel"
                      style={{
                        padding: 0,
                        opacity: paket.aktif ? (isDragging ? 0.4 : 1) : 0.6,
                        outline: isDragOver ? `2px solid ${renk}` : 'none',
                        transition: 'outline .1s, opacity .15s',
                        cursor: 'grab',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
                        {/* Drag handle */}
                        <div style={{ color: 'var(--faint)', cursor: 'grab', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                          <GripVertical size={16} />
                        </div>
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
                          onClick={() => setAcik(isAcik ? null : paket.id)}>
                          <div className="bell-ic" style={{ width: 38, height: 38, background: `color-mix(in srgb, ${renk} 14%, transparent)`, color: renk, flexShrink: 0 }}>
                            <Package size={17} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: renk }}>{paket.ad}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 5px', fontSize: 11, marginRight: 6, fontFamily: 'monospace' }}>{paket.kod}</span>
                              <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 5px', fontSize: 11, marginRight: 6, color: 'var(--faint)' }}>sıra: {paket.sira}</span>
                              {tl(paket.fiyat)} · {paket.ozellikler.filter(o => o.aktif).length}/{paket.ozellikler.length} özellik · {paket.isletme_sayi} işletme
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {!paket.aktif && <span className="badge" style={{ background: 'rgba(231,76,60,.15)', color: '#E74C3C' }}>Pasif</span>}
                            <button type="button" className="btn btn-sm btn-ghost" title="İşletme aktar"
                              onClick={(e) => { e.stopPropagation(); setAktarModal(paket); setAktarHedef(''); setAktarSecili([]) }}
                              style={{ padding: '5px 9px', gap: 5, fontSize: 12 }}>
                              <ArrowRightLeft size={12} /> Aktar
                            </button>
                            <button type="button" className="btn btn-sm btn-ghost" title="Düzenle"
                              onClick={(e) => { e.stopPropagation(); setDuzenle({ ...paket }) }}
                              style={{ padding: '5px 9px', gap: 5, fontSize: 12 }}>
                              <Edit2 size={12} />
                            </button>
                            <button type="button" className="btn btn-sm btn-ghost"
                              title={paket.aktif ? 'Pasife al' : 'Aktife al'}
                              onClick={(e) => { e.stopPropagation(); guncelleMut.mutate({ id: paket.id, aktif: !paket.aktif }) }}
                              style={{ padding: '5px 9px', color: paket.aktif ? 'var(--gold)' : 'var(--muted)' }}>
                              {paket.aktif ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            {isAcik ? <ChevronUp size={16} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
                          </div>
                        </div>
                      </div>

                      {isAcik && (
                        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Pazarlama Özellikleri (müşteriye gösterilen)</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {paket.ozellikler.map((oz, oidx) => (
                              <div key={oidx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: 'var(--surface)' }}>
                                <button type="button" onClick={() => ozellikToggle(paket, oidx)}
                                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                  <div style={{ width: 20, height: 20, borderRadius: 5, background: oz.aktif ? renk : 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>
                                    {oz.aktif && <Check size={12} color="#fff" />}
                                  </div>
                                </button>
                                <span style={{ flex: 1, fontSize: 13, color: oz.aktif ? 'var(--text)' : 'var(--muted)', textDecoration: oz.aktif ? 'none' : 'line-through' }}>{oz.ad}</span>
                                {oz.kod && (
                                  <span style={{ fontSize: 10, background: 'var(--surface3)', color: 'var(--muted)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>{oz.kod}</span>
                                )}
                                <button type="button" onClick={() => ozellikSil(paket, oidx)}
                                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '2px 4px', color: 'var(--faint)', display: 'flex', alignItems: 'center' }}>
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <Select className="input"
                              value={yeniOzellikKod[paket.id] || ''}
                              onChange={(e) => setYeniOzellikKod((p) => ({ ...p, [paket.id]: e.target.value }))}
                              style={{ flex: 1, fontSize: 13 }}>
                              <option value="">Özellik seçin…</option>
                              {Object.entries(OZELLIKLER)
                                .filter(([key]) => !paket.ozellikler.some((o) => o.kod === key))
                                .map(([key, t]) => (
                                  <option key={key} value={key}>{t.ad} ({key})</option>
                                ))}
                            </Select>
                            <button className="btn btn-ghost" onClick={() => ozellikEkle(paket)} disabled={!yeniOzellikKod[paket.id]}>
                              <Plus size={14} /> Ekle
                            </button>
                          </div>
                          {paket.isletme_sayi === 0 && (
                            <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                              <button className="btn btn-sm btn-ghost" style={{ color: '#E74C3C', gap: 6 }}
                                onClick={async () => { if (await confirmAsync({ message: `"${paket.ad}" paketini silmek istediğinize emin misiniz?`, tehlikeli: true, onaylaMetin: 'Sil' })) silMut.mutate(paket.id) }}>
                                <Trash2 size={13} /> Paketi Sil
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )
        )}

        {/* ── TAB: Özellik Haritası ── */}
        {tab === 'harita' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.2)', borderRadius: 10, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--gold-text)' }}>Özellik Haritası</strong> — Her özelliğin hangi paketten itibaren erişilebileceğini buradan belirleyin.
              Seçilen paketten daha düşük sıralı paketler bu özelliği kilitli görür.
            </div>

            {GRUPLAR.map(([grup, ozellikler]) => (
              <div key={grup} className="panel" style={{ padding: 0 }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {grup}
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {ozellikler
                    .sort((a, b) => (DEFAULT_SIRA[a.tanim.min] ?? 99) - (DEFAULT_SIRA[b.tanim.min] ?? 99))
                    .map(({ key, tanim }) => {
                      const guncelMin = harita[key] ?? tanim.min
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', borderRadius: 8, transition: 'background .15s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{tanim.ad}</span>
                              <span style={{ fontSize: 10, background: 'var(--surface3)', color: 'var(--muted)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>{key}</span>
                              {tanim.benzersiz && (
                                <span style={{ fontSize: 10, background: 'rgba(201,169,110,.15)', color: 'var(--gold-text)', borderRadius: 20, padding: '2px 7px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Star size={9} /> Seanzy'ye Özel
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{tanim.aciklama}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {[...paketler].filter(p => p.aktif).sort((a, b) => a.sira - b.sira).map((p, pidx) => {
                              const aktif = guncelMin === p.kod
                              const renk = paketRenk(p as Paket, pidx)
                              return (
                                <button key={p.kod} onClick={() => haritaGuncelleMut.mutate({ anahtar: key, min_paket: p.kod })}
                                  style={{ padding: '5px 11px', borderRadius: 20, border: `1.5px solid ${aktif ? renk : 'var(--border)'}`, background: aktif ? `color-mix(in srgb, ${renk} 15%, transparent)` : 'transparent', color: aktif ? renk : 'var(--muted)', fontSize: 11.5, fontWeight: aktif ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                                  {p.ad}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paket düzenle modal */}
      <Modal open={!!duzenle} onClose={() => setDuzenle(null)} title="Paket Düzenle" maxWidth={400}>
        {duzenle && (
          <>
            <div className="modal-b">
              <div className="field" style={{ margin: '0 0 12px' }}>
                <label>Paket Adı</label>
                <input className="input" value={duzenle.ad} onChange={(e) => setDuzenle({ ...duzenle, ad: e.target.value })} />
              </div>
              <div className="field" style={{ margin: '0 0 12px' }}>
                <label>Aylık Fiyat (₺)</label>
                <input className="input" type="number" min={0} value={duzenle.fiyat}
                  onChange={(e) => setDuzenle({ ...duzenle, fiyat: Number(e.target.value) })} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Paket Rengi</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={duzenle.renk || SABIT_RENK[duzenle.kod] || '#8DA9C4'}
                    onChange={(e) => setDuzenle({ ...duzenle, renk: e.target.value })}
                    style={{ width: 44, height: 36, padding: 2, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)' }} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Paket kartında ve rozetlerde kullanılır</span>
                </div>
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-ghost" onClick={() => setDuzenle(null)}>İptal</button>
              <button className="btn btn-gold" disabled={guncelleMut.isPending}
                onClick={() => guncelleMut.mutate({ id: duzenle.id, ad: duzenle.ad, fiyat: duzenle.fiyat, renk: duzenle.renk })}>
                {guncelleMut.isPending ? <span className="spin" /> : 'Kaydet'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* İşletme aktar modal */}
      <Modal open={!!aktarModal} onClose={() => { setAktarModal(null); setAktarSecili([]) }} title={`İşletme Aktar — ${aktarModal?.ad}`} maxWidth={520}>
        {aktarModal && (
          <>
            <div className="modal-b">
              <div className="field" style={{ margin: '0 0 16px' }}>
                <label>Hedef Paket</label>
                <Select className="input" value={aktarHedef} onChange={(e) => setAktarHedef(e.target.value)}>
                  <option value="">Seçiniz…</option>
                  {paketler.filter((p) => p.kod !== aktarModal.kod && p.aktif).map((p) => (
                    <option key={p.kod} value={p.kod}>{p.ad}</option>
                  ))}
                </Select>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {aktarModal.ad} İşletmeleri ({aktarIsletmeler.data?.length ?? 0})
              </div>
              {aktarIsletmeler.isLoading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Yükleniyor…</div>
                : (aktarIsletmeler.data ?? []).length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Bu pakette işletme yok.</div>
                : (
                  <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text2)', cursor: 'pointer', padding: '4px 0' }}>
                      <input type="checkbox"
                        checked={aktarSecili.length === (aktarIsletmeler.data ?? []).length && aktarSecili.length > 0}
                        onChange={(e) => setAktarSecili(e.target.checked ? (aktarIsletmeler.data ?? []).map(i => i.id) : [])} />
                      Tümünü seç
                    </label>
                    {(aktarIsletmeler.data ?? []).map((i) => (
                      <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '6px 8px', borderRadius: 7, background: 'var(--surface)' }}>
                        <input type="checkbox"
                          checked={aktarSecili.includes(i.id)}
                          onChange={(e) => setAktarSecili(e.target.checked ? [...aktarSecili, i.id] : aktarSecili.filter(x => x !== i.id))} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{i.isletme_adi}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{i.slug}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
            </div>
            <div className="modal-f">
              <button className="btn btn-ghost" onClick={() => { setAktarModal(null); setAktarSecili([]) }}>İptal</button>
              <button className="btn btn-gold" disabled={aktarMut.isPending || !aktarHedef || aktarSecili.length === 0}
                onClick={() => aktarMut.mutate()}>
                {aktarMut.isPending ? <span className="spin" /> : `${aktarSecili.length} İşletmeyi Aktar`}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Yeni paket modal */}
      <YeniPaketModal open={yeniPaket} onClose={() => setYeniPaket(false)} onSuccess={() => { setYeniPaket(false); qc.invalidateQueries({ queryKey: ['sa-paketler'] }) }} />
    </>
  )
}

function YeniPaketModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [f, setF] = useState({ ad: '', kod: '', fiyat: '', renk: '#8DA9C4' })
  const [hata, setHata] = useState('')

  const ekle = useMutation({
    mutationFn: () => apiPost('superadmin.php', 'paket_ekle', {
      ad: f.ad.trim(), kod: f.kod.trim().toLowerCase(), fiyat: Number(f.fiyat), renk: f.renk, ozellikler: [],
    }),
    onSuccess: () => { setF({ ad: '', kod: '', fiyat: '', renk: '#8DA9C4' }); onSuccess() },
    onError: (e) => setHata((e as Error).message),
  })

  return (
    <Modal open={open} onClose={onClose} title="Yeni Paket" maxWidth={380}>
      <div className="modal-b">
        {hata && <div className="form-err" style={{ marginBottom: 12 }}>{hata}</div>}
        <div className="field" style={{ margin: '0 0 12px' }}>
          <label>Paket Adı</label>
          <input className="input" value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} placeholder="Örn: Premium" />
        </div>
        <div className="field" style={{ margin: '0 0 12px' }}>
          <label>Kod (slug) <span style={{ fontSize: 11, color: 'var(--muted)' }}>(sadece harf/rakam/-)</span></label>
          <input className="input" value={f.kod} onChange={(e) => setF({ ...f, kod: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="premium" spellCheck={false} />
          <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4 }}>
            Bu kod işletmelerin paket_turu alanında saklanır. Sırasını ekledikten sonra sürükleyerek ayarlayabilirsiniz.
          </div>
        </div>
        <div className="field" style={{ margin: '0 0 12px' }}>
          <label>Aylık Fiyat (₺)</label>
          <input className="input" type="number" min={0} value={f.fiyat} onChange={(e) => setF({ ...f, fiyat: e.target.value })} placeholder="0" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Paket Rengi</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={f.renk}
              onChange={(e) => setF({ ...f, renk: e.target.value })}
              style={{ width: 44, height: 36, padding: 2, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)' }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Paket kartında ve özellik haritasında kullanılır</span>
          </div>
        </div>
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button className="btn btn-gold" disabled={ekle.isPending || !f.ad || !f.kod} onClick={() => ekle.mutate()}>
          {ekle.isPending ? <span className="spin" /> : <><Plus size={14} /> Oluştur</>}
        </button>
      </div>
    </Modal>
  )
}
