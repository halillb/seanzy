import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Settings, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import RandevuDetay, { type RandevuOzet } from '../components/RandevuDetay'
import RandevuForm from '../components/RandevuForm'
import { useTema } from '../hooks/useTema'
import { apiGet, apiPost } from '../lib/api'
import { useAyar, type Ayar } from '../hooks/useAyar'
import Select from '../components/Select'

interface Personel { id: number; ad: string; soyad?: string; rol: string; uzmanlik?: string }
interface Randevu {
  id: number; personel_id: number; musteri_ad?: string; hizmet_ad?: string
  tarih?: string; baslangic?: string; bitis?: string; durum: string
  kalemler?: { id: number; hizmet_ad?: string }[]
}
const apptBaslik = (r: Randevu) => {
  const n = r.kalemler?.length ?? 0
  if (n <= 1) return r.hizmet_ad || 'Randevu'
  return `${r.kalemler![0].hizmet_ad || 'Randevu'} +${n - 1}`
}

// Her personele soft pastel renk (gece+gündüz uyumlu: solid pastel zemin + koyu yazı)
const PERSONEL_RENK = [
  { bg: '#F7DCC4', ac: '#E0A878', tx: '#7C4A1E' }, // şeftali
  { bg: '#CFEBD7', ac: '#7CC097', tx: '#2E6B49' }, // nane
  { bg: '#CFE3F4', ac: '#79ABDD', tx: '#235480' }, // gök
  { bg: '#DED4F1', ac: '#A48FD8', tx: '#4A3A82' }, // lavanta
  { bg: '#F5D5DF', ac: '#DF8EA8', tx: '#893552' }, // gül
  { bg: '#F2E7BE', ac: '#D6BE6A', tx: '#6E5A1E' }, // limon
  { bg: '#DBE6CD', ac: '#A6BE84', tx: '#4E5E2E' }, // adaçayı
  { bg: '#D3DBF2', ac: '#8C9CE0', tx: '#36458A' }, // peri moru
  { bg: '#F1D9D1', ac: '#DCA391', tx: '#834A38' }, // pudra
  { bg: '#CFEBEA', ac: '#76C2BE', tx: '#2C6E6A' }, // su yeşili
]
const renkAl = (i: number) => PERSONEL_RENK[i % PERSONEL_RENK.length]
const SAAT_SEC = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00—23:00
const hexA = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
// Gündüz: solid pastel + koyu yazı. Gece: yumuşak tint + açık yazı (göze çarpmaz).
const apptStil = (i: number, dark: boolean) => {
  const c = renkAl(i)
  return dark
    ? { background: hexA(c.bg, 0.17), borderLeftColor: c.ac, color: c.bg }
    : { background: c.bg, borderLeftColor: c.ac, color: c.tx }
}
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const hm = (s?: string) => { if (!s) return 0; const [h, m] = s.split(':').map(Number); return h + (m || 0) / 60 }
const fmtTR = (iso: string) =>
  new Date(iso + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })

export default function Takvim() {
  const dark = useTema()
  const personel = useQuery({ queryKey: ['personel'], queryFn: () => apiGet<Personel[]>('personel.php', 'liste') })
  const randevular = useQuery({ queryKey: ['randevular'], queryFn: () => apiGet<Randevu[]>('randevu.php', 'liste') })

  const [tarih, setTarih] = useState(() => toISO(new Date()))
  const [secili, setSecili] = useState<RandevuOzet | null>(null)
  const [yeni, setYeni] = useState<{ personelId?: number; tarih?: string; saat?: string } | null>(null)
  const [duzenleR, setDuzenleR] = useState<RandevuOzet | null>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const timeColInnerRef = useRef<HTMLDivElement>(null)
  const calScrollRef = useRef<HTMLDivElement>(null)
  const onCalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timeColInnerRef.current) timeColInnerRef.current.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`
  }
  const takvimAc = () => { const el = dateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null; el?.showPicker ? el.showPicker() : el?.focus() }

  // ── Mouse ile sürükleyerek kaydırma (masaüstü) — mobildeki touch-scroll'un fare karşılığı ──
  const panRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number; moved: boolean } | null>(null)
  function baslaPan(e: React.PointerEvent) {
    if (e.button !== 0) return
    const el = calScrollRef.current
    if (!el) return
    panRef.current = { startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop, moved: false }
    window.addEventListener('pointermove', onPanMove)
    window.addEventListener('pointerup', onPanUp)
  }
  function onPanMove(e: PointerEvent) {
    const d = panRef.current, el = calScrollRef.current
    if (!d || !el) return
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) { d.moved = true; document.body.style.userSelect = 'none'; el.style.cursor = 'grabbing' }
    el.scrollLeft = d.scrollLeft - dx
    el.scrollTop = d.scrollTop - dy
  }
  function onPanUp() {
    const d = panRef.current, el = calScrollRef.current
    window.removeEventListener('pointermove', onPanMove)
    window.removeEventListener('pointerup', onPanUp)
    document.body.style.userSelect = ''
    if (el) el.style.cursor = 'grab'
    if (d?.moved) { tikBastir.current = true; setTimeout(() => { tikBastir.current = false }, 0) }
    panRef.current = null
  }

  // â”€â”€ Görünüm ayarı (backend'de saklanan işletme ayarı) â”€â”€
  const qc = useQueryClient()
  const { ayar } = useAyar()
  const [ayarAcik, setAyarAcik] = useState(false)
  const [taslak, setTaslak] = useState<Ayar | null>(null)
  const BAS_SAAT = ayar.gorBas, BIT_SAAT = ayar.gorBit, ACIK_BAS = ayar.acikBas, ACIK_BIT = ayar.acikBit, DK = ayar.dakika
  const ayarKaydetMut = useMutation({
    mutationFn: () => apiPost('ayar.php', 'kaydet', { ...(taslak as Ayar) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ayar'] }); setAyarAcik(false) },
  })
  const ayarAc = () => {
    const tumIds = (personel.data ?? []).map((p) => p.id)
    const mevcutSira = ayar.personelSira.filter((id) => tumIds.includes(id))
    const eksikler = tumIds.filter((id) => !mevcutSira.includes(id))
    setTaslak({ ...ayar, personelSira: [...mevcutSira, ...eksikler] })
    setAyarAcik(true)
  }
  const taslakSet = (k: keyof Ayar, v: number) => setTaslak((t) => (t ? { ...t, [k]: v } : t))
  function personelTasi(id: number, yon: -1 | 1) {
    setTaslak((t) => {
      if (!t) return t
      const arr = [...t.personelSira]
      const i = arr.indexOf(id)
      const j = i + yon
      if (i < 0 || j < 0 || j >= arr.length) return t
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...t, personelSira: arr }
    })
  }
  function personelPasifToggle(id: number) {
    setTaslak((t) => {
      if (!t) return t
      const var_ = t.personelPasif.includes(id)
      return { ...t, personelPasif: var_ ? t.personelPasif.filter((x) => x !== id) : [...t.personelPasif, id] }
    })
  }
  // ── Personel sırası: sürükle-bırak ──
  const [surukId, setSurukId] = useState<number | null>(null)
  const [uzerindeId, setUzerindeId] = useState<number | null>(null)
  function personelSuruklemeBitir(hedefId: number) {
    setTaslak((t) => {
      if (!t || surukId === null || surukId === hedefId) return t
      const arr = [...t.personelSira]
      const kaynakIdx = arr.indexOf(surukId)
      const hedefIdx = arr.indexOf(hedefId)
      if (kaynakIdx < 0 || hedefIdx < 0) return t
      arr.splice(kaynakIdx, 1)
      arr.splice(hedefIdx, 0, surukId)
      return { ...t, personelSira: arr }
    })
    setSurukId(null); setUzerindeId(null)
  }

  // â”€â”€ Sürükle-uzat: alt kenar=bitiş, üst kenar=başlangıç â”€â”€
  const resizeMut = useMutation({
    mutationFn: (v: { id: number; body: Record<string, unknown> }) => apiPost('randevu.php', 'guncelle', { id: v.id, ...v.body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['randevular'] }),
  })

  // â”€â”€ Sürükle-taşı: randevuyu başka saate / personele taşı â”€â”€
  const moveRef = useRef<{
    id: number; r: Randevu; startX: number; startY: number; durMin: number; moved: boolean
    w: number; h: number; offX: number; offY: number; stil: React.CSSProperties
  } | null>(null)
  const [surukle, setSurukle] = useState<{ x: number; y: number; hedef: string; gecerli: boolean } | null>(null)
  const tikBastir = useRef(false) // randevu etkileşimi sonrası gelen sahte day-col click'ini yut
  const [onayTasi, setOnayTasi] = useState<{ id: number; hizmet: string; eski: string; yeni: string; body: Record<string, unknown> } | null>(null)
  function tasiTemizle() {
    window.removeEventListener('pointermove', onTasiMove)
    window.removeEventListener('pointerup', onTasiUp)
    window.removeEventListener('keydown', onTasiKey)
    document.body.style.userSelect = ''
    moveRef.current = null
    setSurukle(null)
  }
  function onTasiKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { tasiTemizle() } // sürüklemeden vazgeç
  }
  function hedefHesap(x: number, y: number): { pid: number; basMin: number } | null {
    const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest('.day-col') as HTMLElement | null
    if (!el || !el.dataset.pid) return null
    const rect = el.getBoundingClientRect()
    const dkm = Math.round((y - rect.top) / DK) * DK
    const basMin = Math.max(BAS_SAAT * 60, Math.min((BIT_SAAT - 1) * 60, BAS_SAAT * 60 + dkm))
    return { pid: Number(el.dataset.pid), basMin }
  }
  function onTasiMove(e: PointerEvent) {
    const d = moveRef.current; if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return
    d.moved = true
    const h = hedefHesap(e.clientX, e.clientY)
    const pAd = h ? (kolonlar.find((p) => p.id === h.pid)?.ad ?? '') : ''
    setSurukle({ x: e.clientX, y: e.clientY, hedef: h ? `${pAd} · ${fmtMin(h.basMin)}` : 'Geçersiz alan', gecerli: !!h })
  }
  function onTasiUp(e: PointerEvent) {
    const d = moveRef.current
    const tasindi = !!d?.moved
    const hedef = d ? hedefHesap(e.clientX, e.clientY) : null
    if (d) { tikBastir.current = true; setTimeout(() => { tikBastir.current = false }, 0) }
    tasiTemizle()
    if (!d) return
    if (!tasindi) { setSecili(d.r as RandevuOzet); return } // taşımadıysa = tıklama â†’ detay
    if (!hedef) return // geçersiz alana bırakıldı â†’ değişiklik yok
    const basMin = Math.round(hm(d.r.baslangic) * 60)
    const ayniYer = hedef.pid === d.r.personel_id && hedef.basMin === basMin
    if (ayniYer) return
    const bitMin = hedef.basMin + d.durMin
    const eskiPAd = kolonlar.find((p) => p.id === d.r.personel_id)?.ad ?? ''
    const yeniPAd = kolonlar.find((p) => p.id === hedef.pid)?.ad ?? ''
    // Onay iste, sessizce uygulama
    setOnayTasi({
      id: d.id, hizmet: d.r.hizmet_ad || 'Randevu',
      eski: `${eskiPAd} · ${fmtMin(basMin)}`, yeni: `${yeniPAd} · ${fmtMin(hedef.basMin)}`,
      body: { personel_id: hedef.pid, baslangic: fmtMin(hedef.basMin) + ':00', bitis: fmtMin(bitMin) + ':00' },
    })
  }
  function baslaTasi(e: React.PointerEvent, rr: Randevu, pi: number) {
    e.stopPropagation(); e.preventDefault()
    const basMin = Math.round(hm(rr.baslangic) * 60)
    const bitMin = Math.round((rr.bitis ? hm(rr.bitis) : hm(rr.baslangic) + 1) * 60)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    moveRef.current = {
      id: rr.id, r: rr, startX: e.clientX, startY: e.clientY, durMin: bitMin - basMin, moved: false,
      w: rect.width, h: rect.height, offX: e.clientX - rect.left, offY: e.clientY - rect.top, stil: apptStil(pi, dark),
    }
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onTasiMove)
    window.addEventListener('pointerup', onTasiUp)
    window.addEventListener('keydown', onTasiKey)
  }
  const dragRef = useRef<{ id: number; yon: 'bas' | 'son'; basMin: number; bitMin: number; startY: number } | null>(null)
  const [preview, setPreview] = useState<{ id: number; basMin: number; bitMin: number } | null>(null)
  const fmtMin = (mm: number) => `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`
  function onResizeMove(e: PointerEvent) {
    const d = dragRef.current; if (!d) return
    const delta = e.clientY - d.startY
    if (d.yon === 'son') {
      const nb = Math.max(d.basMin + DK, Math.min(BIT_SAAT * 60, Math.round((d.bitMin + delta) / DK) * DK))
      setPreview({ id: d.id, basMin: d.basMin, bitMin: nb })
    } else {
      const na = Math.max(BAS_SAAT * 60, Math.min(d.bitMin - DK, Math.round((d.basMin + delta) / DK) * DK))
      setPreview({ id: d.id, basMin: na, bitMin: d.bitMin })
    }
  }
  function onResizeUp() {
    window.removeEventListener('pointermove', onResizeMove)
    window.removeEventListener('pointerup', onResizeUp)
    const d = dragRef.current
    setPreview((p) => {
      if (d && p && p.id === d.id) {
        if (d.yon === 'son' && p.bitMin !== d.bitMin) resizeMut.mutate({ id: d.id, body: { bitis: fmtMin(p.bitMin) + ':00' } })
        if (d.yon === 'bas' && p.basMin !== d.basMin) resizeMut.mutate({ id: d.id, body: { baslangic: fmtMin(p.basMin) + ':00' } })
      }
      return null
    })
    dragRef.current = null
  }
  function baslaResize(e: React.PointerEvent, rr: Randevu, yon: 'bas' | 'son') {
    e.stopPropagation(); e.preventDefault()
    const basMin = Math.round(hm(rr.baslangic) * 60)
    const bitMin = Math.round((rr.bitis ? hm(rr.bitis) : hm(rr.baslangic) + 1) * 60)
    dragRef.current = { id: rr.id, yon, basMin, bitMin, startY: e.clientY }
    setPreview({ id: rr.id, basMin, bitMin })
    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', onResizeUp)
  }
  const kolonlar = useMemo(() => {
    const tum = personel.data ?? []
    const pasif = new Set(ayar.personelPasif)
    const gorunur = tum.filter((p) => !pasif.has(p.id))
    const sira = ayar.personelSira
    if (!sira.length) return gorunur
    const siraIdx = new Map(sira.map((id, i) => [id, i]))
    return [...gorunur].sort((a, b) => (siraIdx.get(a.id) ?? 999) - (siraIdx.get(b.id) ?? 999))
  }, [personel.data, ayar.personelSira, ayar.personelPasif])
  const IPTAL_DURUM = ['iptal', 'gelmedi', 'iptal_talebi']
  const gununRandevulari = useMemo(
    () => (randevular.data ?? []).filter((r) => r.tarih === tarih && !IPTAL_DURUM.includes(r.durum)),
    [randevular.data, tarih],
  )

  const kaydir = (gun: number) => {
    const d = new Date((tarih || toISO(new Date())) + 'T00:00')
    d.setDate(d.getDate() + gun)
    setTarih(toISO(d))
  }

  const saatler = Array.from({ length: BIT_SAAT - BAS_SAAT }, (_, i) => BAS_SAAT + i)
  const gridCols = `repeat(${Math.max(kolonlar.length, 1)}, minmax(128px, 1fr))`
  const yukleniyor = personel.isLoading || randevular.isLoading || !tarih

  return (
    <>
      <Topbar title="Takvim" subtitle="Günlük randevu görünümü" search={false} cta="Randevu" onCta={() => setYeni({ tarih })} />
      <Modal open={!!secili} onClose={() => setSecili(null)} title="Randevu Detayı" maxWidth={460}>
        {secili && <RandevuDetay randevu={secili} onClose={() => setSecili(null)} onEdit={(rr) => { setSecili(null); setDuzenleR(rr) }} />}
      </Modal>
      <Modal open={!!yeni} onClose={() => setYeni(null)} title="Yeni Randevu">
        {yeni && <RandevuForm on={yeni} onClose={() => setYeni(null)} />}
      </Modal>
      <Modal open={!!duzenleR} onClose={() => setDuzenleR(null)} title="Randevu Düzenle">
        {duzenleR && <RandevuForm mevcut={duzenleR} onClose={() => setDuzenleR(null)} />}
      </Modal>
      <Modal open={ayarAcik} onClose={() => setAyarAcik(false)} title="Takvim Ayarları" maxWidth={420}>
        {taslak && <>
        <div className="modal-b">
          <div className="form-grid">
            <div className="field" style={{ margin: 0 }}><label>Görünür Başlangıç</label>
              <Select className="input" value={taslak.gorBas} onChange={(e) => taslakSet('gorBas', +e.target.value)}>{SAAT_SEC.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select></div>
            <div className="field" style={{ margin: 0 }}><label>Görünür Bitiş</label>
              <Select className="input" value={taslak.gorBit} onChange={(e) => taslakSet('gorBit', +e.target.value)}>{SAAT_SEC.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select></div>
            <div className="field" style={{ margin: 0 }}><label>Çalışma Başlangıç</label>
              <Select className="input" value={taslak.acikBas} onChange={(e) => taslakSet('acikBas', +e.target.value)}>{SAAT_SEC.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select></div>
            <div className="field" style={{ margin: 0 }}><label>Çalışma Bitiş</label>
              <Select className="input" value={taslak.acikBit} onChange={(e) => taslakSet('acikBit', +e.target.value)}>{SAAT_SEC.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select></div>
            <div className="field full" style={{ margin: 0 }}><label>Randevu Aralığı</label>
              <Select className="input" value={taslak.dakika} onChange={(e) => taslakSet('dakika', +e.target.value)}>{[10, 15, 20, 30, 60].map((d) => <option key={d} value={d}>{d} dakika</option>)}</Select></div>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>Çalışma saati dışı <b>flu</b> görünür ama randevu açılabilir. Bu ayar <b>tüm kullanıcılarda ortaktır</b> (İşletme Ayarları).</p>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>Personel Sırası ve Görünürlüğü</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {taslak.personelSira.map((id, i) => {
                const p = (personel.data ?? []).find((pp) => pp.id === id)
                if (!p) return null
                const pasif = taslak.personelPasif.includes(id)
                return (
                  <div key={id} draggable
                    onDragStart={(e) => { setSurukId(id); e.dataTransfer.effectAllowed = 'move' }}
                    onDragOver={(e) => { e.preventDefault(); if (uzerindeId !== id) setUzerindeId(id) }}
                    onDragLeave={() => setUzerindeId((v) => (v === id ? null : v))}
                    onDrop={(e) => { e.preventDefault(); personelSuruklemeBitir(id) }}
                    onDragEnd={() => { setSurukId(null); setUzerindeId(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, background: 'var(--surface2)', opacity: surukId === id ? 0.35 : pasif ? 0.5 : 1, outline: uzerindeId === id && surukId !== id ? '2px solid var(--gold)' : 'none', outlineOffset: -2 }}>
                    <span style={{ cursor: 'grab', color: 'var(--muted)', display: 'flex', touchAction: 'none' }} title="Sürükleyerek sırala"><GripVertical size={14} /></span>
                    <span style={{ flex: 1, fontSize: 12.5 }}>{p.ad} {p.soyad || ''}</span>
                    <button type="button" className="icon-btn" style={{ width: 26, height: 26 }} disabled={i === 0} onClick={() => personelTasi(id, -1)} aria-label="Yukarı taşı"><ArrowUp size={13} /></button>
                    <button type="button" className="icon-btn" style={{ width: 26, height: 26 }} disabled={i === taslak.personelSira.length - 1} onClick={() => personelTasi(id, 1)} aria-label="Aşağı taşı"><ArrowDown size={13} /></button>
                    <button type="button" className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => personelPasifToggle(id)} aria-label={pasif ? 'Aktif yap' : 'Pasif yap'} title={pasif ? 'Takvimde gizli — göstermek için tıkla' : 'Takvimde görünür — gizlemek için tıkla'}>
                      {pasif ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>Gizlenen personel takvimde kolon olarak görünmez; randevuları etkilenmez.</p>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={() => setAyarAcik(false)}>İptal</button>
          <button className="btn btn-gold" disabled={ayarKaydetMut.isPending} onClick={() => ayarKaydetMut.mutate()}>{ayarKaydetMut.isPending ? <span className="spin" /> : 'Kaydet'}</button>
        </div>
        </>}
      </Modal>
      {surukle && moveRef.current && (
        <div style={{ position: 'fixed', left: surukle.x - moveRef.current.offX, top: surukle.y - moveRef.current.offY, width: moveRef.current.w, height: moveRef.current.h, zIndex: 9999, pointerEvents: 'none', ...moveRef.current.stil, borderLeft: '3px solid', borderLeftColor: (moveRef.current.stil as { borderLeftColor?: string }).borderLeftColor, borderRadius: 9, padding: '7px 9px', overflow: 'hidden', boxShadow: '0 22px 48px rgba(0,0,0,.5)', transform: 'scale(1.05) rotate(2deg)', transition: 'transform .08s', opacity: surukle.gecerli ? 0.97 : 0.6 }}>
          <div className="at">{apptBaslik(moveRef.current.r)}</div>
          <div className="as" style={{ fontWeight: 600 }}>{surukle.hedef}</div>
        </div>
      )}
      <Modal open={!!onayTasi} onClose={() => setOnayTasi(null)} title="Randevuyu Taşı" maxWidth={400}>
        {onayTasi && (
          <>
            <div className="modal-b">
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>{onayTasi.hizmet}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                <div style={{ flex: 1, padding: '10px 12px', borderRadius: 9, background: 'var(--surface3)', color: 'var(--muted)', textAlign: 'center' }}>{onayTasi.eski}</div>
                <span style={{ color: 'var(--gold)', fontSize: 18 }}>â†’</span>
                <div style={{ flex: 1, padding: '10px 12px', borderRadius: 9, background: 'rgba(201,169,110,.14)', color: 'var(--gold-text)', fontWeight: 500, textAlign: 'center' }}>{onayTasi.yeni}</div>
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-ghost" onClick={() => setOnayTasi(null)}>Vazgeç</button>
              <button className="btn btn-gold" onClick={() => { resizeMut.mutate({ id: onayTasi.id, body: onayTasi.body }); setOnayTasi(null) }}>Taşı</button>
            </div>
          </>
        )}
      </Modal>
      <div className="page">
        <div className="takvim-toolbar">
          <button className="cal-nav-btn" onClick={() => kaydir(-1)} aria-label="Önceki gün"><ChevronLeft size={16} /></button>
          <div onClick={takvimAc} title="Tarih seç" className="takvim-tarih" style={{ textTransform: 'capitalize', cursor: 'pointer' }}>
            {tarih ? fmtTR(tarih) : '…'}
          </div>
          <button className="cal-nav-btn" onClick={() => kaydir(1)} aria-label="Sonraki gün"><ChevronRight size={16} /></button>
          <input ref={dateRef} type="date" className="takvim-date-input"
            value={tarih} onChange={(e) => e.target.value && setTarih(e.target.value)} />
          <button className="btn btn-sm btn-ghost" style={{ flexShrink: 0 }} onClick={() => setTarih(toISO(new Date()))}>Bugün</button>
          <button className="cal-nav-btn" style={{ flexShrink: 0 }} onClick={ayarAc} title="Takvim ayarları"><Settings size={15} /></button>
        </div>

        {personel.isError || randevular.isError ? (
          <div className="panel" style={{ textAlign: 'center', color: 'var(--red)', padding: 40 }}>Veri alınamadı.</div>
        ) : yukleniyor ? (
          <div className="panel" style={{ height: 300, opacity: 0.5 }} />
        ) : (
          <div className="cal" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="cal-timecol">
                <div className="cal-corner" title="Bugünkü randevu sayısı">
                  <div className="cal-corner-n">{gununRandevulari.length}</div>
                  <div className="cal-corner-lbl">randevu</div>
                </div>
                <div className="cal-timecol-scroll">
                  <div className="time-col" ref={timeColInnerRef}>
                    {saatler.map((h) => (
                      <div className={'tcell' + (h < ACIK_BAS || h >= ACIK_BIT ? ' kapali-saat' : '')} key={h}>
                        {String(h).padStart(2, '0')}:00
                        {Array.from({ length: Math.max(0, Math.round(60 / DK) - 1) }, (_, k) => (k + 1) * DK).filter((mm) => mm < 60).map((mm) => (
                          <span key={mm} className="tick" style={{ top: `${(mm / 60) * 100}%`, width: mm === 30 ? 13 : 7, height: mm === 30 ? 2 : 1, background: mm === 30 ? 'var(--border2)' : 'var(--border)' }} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="cal-scroll" ref={calScrollRef} onScroll={onCalScroll} onPointerDown={baslaPan} style={{ cursor: 'grab' }}>
              <div className="cal-head" style={{ gridTemplateColumns: gridCols }}>
                {kolonlar.map((p, i) => (
                  <div className="ch" key={p.id}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: renkAl(i).ac, marginRight: 6, verticalAlign: 'middle' }} />{p.ad}
                    <div className="sub">{p.uzmanlik || (p.rol === 'mudur' ? 'Müdür' : 'Personel')}</div>
                  </div>
                ))}
              </div>
              <div className="cal-body" style={{ gridTemplateColumns: gridCols }}>
                {kolonlar.map((p, pi) => {
                  return (
                  <div className="day-col" key={p.id} data-pid={p.id} style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      if (tikBastir.current) { tikBastir.current = false; return } // randevu tıkı/sürüklemesi sonrası sahte click
                      const rect = e.currentTarget.getBoundingClientRect()
                      const dkm = Math.round((e.clientY - rect.top) / DK) * DK
                      const tot = Math.max(BAS_SAAT * 60, Math.min((BIT_SAAT - 1) * 60, BAS_SAAT * 60 + dkm))
                      setYeni({ personelId: p.id, tarih, saat: `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}` })
                    }}>
                    {saatler.map((h) => <div className="line" key={h} />)}
                    {ACIK_BAS > BAS_SAAT && <div className="kapali" style={{ top: 0, height: (ACIK_BAS - BAS_SAAT) * 60 }} />}
                    {ACIK_BIT < BIT_SAAT && <div className="kapali" style={{ top: (ACIK_BIT - BAS_SAAT) * 60, height: (BIT_SAAT - ACIK_BIT) * 60 }} />}
                    {gununRandevulari.filter((r) => r.personel_id === p.id).map((r) => {
                      const bas = hm(r.baslangic)
                      const oBasMin = Math.round(bas * 60)
                      const normBit = Math.round((r.bitis ? hm(r.bitis) : bas + 1) * 60)
                      const aktifResize = preview?.id === r.id
                      const basMin = aktifResize ? preview!.basMin : oBasMin
                      const bitMin = aktifResize ? preview!.bitMin : normBit
                      const top = basMin - BAS_SAAT * 60
                      const yuk = Math.max(bitMin - basMin, 24)
                      const iptal = r.durum === 'iptal'
                      return (
                        <div key={r.id} className="appt" style={{ top, height: yuk, ...apptStil(pi, dark), opacity: surukle && moveRef.current?.id === r.id ? 0.32 : (iptal ? 0.5 : 1), zIndex: aktifResize ? 6 : undefined, cursor: 'grab' }}
                          title={`${apptBaslik(r)} · ${r.musteri_ad}`} onPointerDown={(e) => baslaTasi(e, r, pi)}>
                          <div onPointerDown={(e) => baslaResize(e, r, 'bas')} title="Başlangıcı ayarla"
                            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 8, cursor: 'ns-resize' }} />
                          <div className="at" style={{ textDecoration: iptal ? 'line-through' : 'none' }}>{apptBaslik(r)}</div>
                          <div className="as">{aktifResize ? `${fmtMin(basMin)}—${fmtMin(bitMin)}` : (r.musteri_ad || '')}</div>
                          <div onPointerDown={(e) => baslaResize(e, r, 'son')} title="Bitişi ayarla"
                            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 9, cursor: 'ns-resize' }} />
                        </div>
                      )
                    })}
                  </div>
                  )
                })}
              </div>
              </div>
            </div>
        )}
      </div>
    </>
  )
}
