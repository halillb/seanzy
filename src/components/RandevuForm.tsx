import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import MusteriSecici from './MusteriSecici'
import Select from './Select'
import SaatGrid, { bitisHesap, type DoluSaat } from './SaatGrid'
import HizmetSecici, { type SecilenKalem } from './HizmetSecici'

interface Hizmet { id: number; ad: string; sure_dk: number; fiyat: number | string }
interface Personel { id: number; ad: string; soyad?: string; ad_soyad?: string; hizmet_ids?: number[] }
interface MusteriPaket { id: number; hizmet_id: number; kalan_seans: number; toplam_seans: number; hizmet?: { ad_tr?: string } }
export interface RandevuDuzenle {
  id: number; musteri_id?: number; musteri_ad?: string; hizmet_id?: number; personel_id?: number
  tarih?: string; baslangic?: string; bitis?: string; fiyat?: number | string; musteri_paket_id?: number
}
interface Props {
  onClose: () => void
  on?: { personelId?: number; tarih?: string; saat?: string }
  mevcut?: RandevuDuzenle
}


const BUGUN = new Date().toISOString().slice(0, 10)

export default function RandevuForm({ onClose, on, mevcut }: Props) {
  const qc = useQueryClient()
  const duzenle = !!mevcut
  const { data: hizmetler } = useQuery({ queryKey: ['hizmetler'], queryFn: () => apiGet<Hizmet[]>('hizmet.php', 'liste') })
  const { data: personeller } = useQuery({ queryKey: ['personel'], queryFn: () => apiGet<Personel[]>('personel.php', 'liste') })

  const [musteriId, setMusteriId] = useState(mevcut?.musteri_id ? String(mevcut.musteri_id) : '')
  const [hizmetId, setHizmetId] = useState(mevcut?.hizmet_id ? String(mevcut.hizmet_id) : '')
  const [personelId, setPersonelId] = useState(mevcut?.personel_id ? String(mevcut.personel_id) : (on?.personelId ? String(on.personelId) : ''))
  const [tarih, setTarih] = useState(mevcut?.tarih || on?.tarih || BUGUN)
  const [saat, setSaat] = useState(mevcut ? (mevcut.baslangic?.slice(0, 5) || '09:00') : (on?.saat || '09:00'))
  const [bitis, setBitis] = useState(mevcut ? (mevcut.bitis?.slice(0, 5) || '') : bitisHesap(on?.saat || '09:00', 60))
  const [fiyat, setFiyat] = useState(mevcut?.fiyat != null ? String(mevcut.fiyat) : '')
  const [odemeSec, setOdemeSec] = useState(mevcut?.musteri_paket_id ? 'paket:' + mevcut.musteri_paket_id : 'tek')
  const [hata, setHata] = useState('')

  const secilenHizmet = hizmetler?.find((x) => String(x.id) === hizmetId)

  // ---- Yeni randevu oluşturma (çoklu hizmet + seri + ödeme) ----
  const [kalemler, setKalemler] = useState<SecilenKalem[]>([])
  const [slotlar, setSlotlar] = useState([{ tarih: mevcut?.tarih || on?.tarih || BUGUN, baslangic: on?.saat || '09:00' }])
  const [odemeTip, setOdemeTip] = useState<'pesin' | 'seans' | 'karisik'>('pesin')
  const [odenenTutar, setOdenenTutar] = useState('')
  const [indirimTip, setIndirimTip] = useState<'yok' | 'yuzde' | 'tutar'>('yok')
  const [indirimDeger, setIndirimDeger] = useState('')

  const araToplamYeni = kalemler.reduce((s, k) => s + k.fiyat, 0)
  const toplamSureYeni = kalemler.reduce((s, k) => s + k.sure_dk, 0)
  const indirimDegerSayi = Number(indirimDeger) || 0
  const indirimTutarYeni = indirimTip === 'yuzde' ? araToplamYeni * (indirimDegerSayi / 100) : indirimTip === 'tutar' ? indirimDegerSayi : 0
  const netToplamYeni = Math.max(0, araToplamYeni - indirimTutarYeni)

  function slotEkle() {
    const son = slotlar[slotlar.length - 1]
    setSlotlar([...slotlar, { tarih: son?.tarih || BUGUN, baslangic: son?.baslangic || '09:00' }])
  }
  function slotSil(i: number) {
    setSlotlar(slotlar.filter((_, idx) => idx !== i))
  }
  function slotGuncelle(i: number, patch: Partial<{ tarih: string; baslangic: string }>) {
    setSlotlar(slotlar.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  const yeniMutation = useMutation({
    mutationFn: () => apiPost('randevu.php', 'ekle_coklu', {
      musteri_id: Number(musteriId),
      personel_id: personelId ? Number(personelId) : undefined,
      hizmetler: kalemler.map((k) => ({
        hizmet_id: k.hizmet_id, fiyat: k.fiyat, sure_dk: k.sure_dk,
        hizmet_tipi: k.hizmet_tipi, varsayilan_seans: k.varsayilan_seans,
      })),
      slotlar: slotlar.map((s) => ({ tarih: s.tarih, baslangic: s.baslangic + ':00' })),
      odeme: { tip: odemeTip, odenen: odemeTip === 'pesin' ? netToplamYeni : (Number(odenenTutar) || 0) },
      indirim: { tip: indirimTip, deger: indirimDegerSayi },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['randevular'] }); onClose() },
    onError: (e) => setHata((e as Error).message || 'İşlem başarısız.'),
  })

  function gonderYeni(e: React.FormEvent) {
    e.preventDefault(); setHata('')
    if (!musteriId) { setHata('Müşteri seçin.'); return }
    if (kalemler.length === 0) { setHata('En az bir hizmet seçin.'); return }
    if (!personelId) { setHata('Personel seçin.'); return }
    if (slotlar.some((s) => !s.tarih || !s.baslangic)) { setHata('Tüm seansların tarih/saatini girin.'); return }
    yeniMutation.mutate()
  }

  // Dolu saatler (tarih + personel değişince yenile)
  const { data: doluSaatlerRaw } = useQuery({
    queryKey: ['dolu-saatler', tarih, personelId],
    queryFn: () => apiGet<DoluSaat[]>('randevu.php', 'dolu_saatler', {
      tarih,
      personel_id: personelId || undefined,
      exclude_id: mevcut?.id || undefined,
    }),
    enabled: !!tarih && !!personelId,
  })
  const doluSaatler = doluSaatlerRaw ?? []

  // Müşterinin aktif paketleri
  const { data: musteriPaketleri } = useQuery({
    queryKey: ['musteri-paketleri', musteriId],
    queryFn: () => apiGet<MusteriPaket[]>('musteri.php', 'paketleri', { musteri_id: Number(musteriId) }),
    enabled: !!musteriId,
  })
  const uygunPaketler = (musteriPaketleri ?? []).filter((p) => p.hizmet_id === Number(hizmetId) && p.kalan_seans > 0)
  const paketKalan = new Map<number, number>()
  for (const p of musteriPaketleri ?? []) if (p.kalan_seans > 0) paketKalan.set(p.hizmet_id, (paketKalan.get(p.hizmet_id) || 0) + p.kalan_seans)

  useEffect(() => {
    setOdemeSec(uygunPaketler.length ? 'paket:' + uygunPaketler[0].id : 'tek')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hizmetId, musteriId, musteriPaketleri])
  const paketten = odemeSec.startsWith('paket:')

  // Uygun personeller
  const uygunPersoneller = (personeller ?? []).filter((p) =>
    hizmetId ? (!p.hizmet_ids || p.hizmet_ids.length === 0 || p.hizmet_ids.includes(Number(hizmetId))) : false,
  )

  // Geçmiş randevulardan personel önerisi
  const { data: gecmisRandevular } = useQuery({ queryKey: ['randevular'], queryFn: () => apiGet<RandevuDuzenle[]>('randevu.php', 'liste') })
  const gecmisPersonel = (() => {
    if (!hizmetId || !musteriId) return 0
    const ler = (gecmisRandevular ?? [])
      .filter((r) => r.musteri_id === Number(musteriId) && r.hizmet_id === Number(hizmetId) && r.personel_id)
      .sort((a, b) => String(b.tarih || '').localeCompare(String(a.tarih || '')))
    return ler[0]?.personel_id || 0
  })()
  const listePersonel = (() => {
    if (gecmisPersonel && !uygunPersoneller.some((p) => p.id === gecmisPersonel)) {
      const gp = (personeller ?? []).find((p) => p.id === gecmisPersonel)
      if (gp) return [gp, ...uygunPersoneller]
    }
    return uygunPersoneller
  })()
  const oneriPersonel = gecmisPersonel || (uygunPersoneller[0]?.id ?? 0)
  useEffect(() => {
    if (!personelId && oneriPersonel) setPersonelId(String(oneriPersonel))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oneriPersonel])
  const secilenGecmisten = !!gecmisPersonel && Number(personelId) === gecmisPersonel

  const secHizmet = (id: string) => {
    setHizmetId(id)
    const h = hizmetler?.find((x) => String(x.id) === id)
    if (h) { setFiyat(String(h.fiyat)); setBitis(bitisHesap(saat, h.sure_dk)) }
    if (personelId) {
      const p = personeller?.find((x) => String(x.id) === personelId)
      const uygun = p && (!p.hizmet_ids || p.hizmet_ids.length === 0 || p.hizmet_ids.includes(Number(id)))
      if (!uygun) setPersonelId('')
    }
  }

  const degisSaat = (s: string) => {
    setSaat(s)
    setBitis(bitisHesap(s, secilenHizmet?.sure_dk || 60))
  }

  const m = useMutation({
    mutationFn: () => {
      const paketId = paketten ? Number(odemeSec.slice(6)) : 0
      const body: Record<string, unknown> = {
        personel_id: Number(personelId), hizmet_id: Number(hizmetId),
        tarih, baslangic: saat + ':00', bitis: bitis + ':00',
        fiyat: paketId ? 0 : (fiyat ? Number(fiyat) : undefined),
        musteri_paket_id: paketId || null,
      }
      if (duzenle) { body.id = mevcut!.id; return apiPost('randevu.php', 'guncelle', body) }
      body.musteri_id = Number(musteriId)
      return apiPost('randevu.php', 'ekle', body)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['randevular'] }); onClose() },
    onError: (e) => setHata((e as Error).message || 'İşlem başarısız.'),
  })

  function gonder(e: React.FormEvent) {
    e.preventDefault(); setHata('')
    if (!duzenle && !musteriId) { setHata('Müşteri seçin.'); return }
    if (!hizmetId) { setHata('Hizmet seçin.'); return }
    if (!personelId) { setHata('Personel seçin.'); return }
    m.mutate()
  }

  if (!duzenle) {
    return (
      <form onSubmit={gonderYeni}>
        <div className="modal-b">
          {hata && <div className="form-err">{hata}</div>}

          <div className="field" style={{ marginTop: 0 }}>
            <label>Müşteri *</label>
            <MusteriSecici value={musteriId} onChange={(id) => setMusteriId(id)} />
          </div>

          <div className="field">
            <label>Hizmetler *</label>
            <HizmetSecici value={kalemler} onChange={setKalemler} />
          </div>

          <div className="field">
            <label>Personel *</label>
            <Select className="input" value={personelId} onChange={(e) => setPersonelId(e.target.value)}>
              <option value="">Seçiniz</option>
              {(personeller ?? []).map((p) => {
                const ad = p.ad_soyad || `${p.ad} ${p.soyad || ''}`.trim()
                return <option key={p.id} value={p.id}>{ad}</option>
              })}
            </Select>
          </div>

          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Seans Tarih/Saatleri *{toplamSureYeni ? <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>({toplamSureYeni} dk/seans)</span> : ''}</span>
              <button type="button" onClick={slotEkle} className="btn btn-sm btn-ghost" style={{ padding: '4px 10px' }}><Plus size={13} /> Seans Ekle</button>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slotlar.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--muted)', width: 18 }}>{i + 1}.</span>
                  <input className="input" type="date" min={BUGUN} value={s.tarih} onChange={(e) => slotGuncelle(i, { tarih: e.target.value })} style={{ flex: 1 }} />
                  <input className="input" type="time" value={s.baslangic} onChange={(e) => slotGuncelle(i, { baslangic: e.target.value })} style={{ flex: 1 }} />
                  {slotlar.length > 1 && (
                    <button type="button" onClick={() => slotSil(i)} className="iconmini" style={{ color: '#ff8a7d', flexShrink: 0 }}><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="field" style={{ margin: 0 }}>
              <label>Ödeme Şekli</label>
              <Select className="input" value={odemeTip} onChange={(e) => setOdemeTip(e.target.value as typeof odemeTip)}>
                <option value="pesin">Peşin (sonraki seanslar ücretsiz)</option>
                <option value="seans">Seans Seans Öde</option>
                <option value="karisik">Karışık</option>
              </Select>
            </div>
            {odemeTip !== 'pesin' && (
              <div className="field" style={{ margin: 0 }}>
                <label>Şimdi Alınan Tutar (₺)</label>
                <input className="input" type="number" min={0} value={odenenTutar} onChange={(e) => setOdenenTutar(e.target.value)} />
              </div>
            )}
          </div>

          <div className="form-grid">
            <div className="field" style={{ margin: 0 }}>
              <label>İndirim</label>
              <Select className="input" value={indirimTip} onChange={(e) => setIndirimTip(e.target.value as typeof indirimTip)}>
                <option value="yok">İndirim Yok</option>
                <option value="yuzde">Yüzde (%)</option>
                <option value="tutar">Tutar (₺)</option>
              </Select>
            </div>
            {indirimTip !== 'yok' && (
              <div className="field" style={{ margin: 0 }}>
                <label>{indirimTip === 'yuzde' ? 'Yüzde' : 'Tutar (₺)'}</label>
                <input className="input" type="number" min={0} value={indirimDeger} onChange={(e) => setIndirimDeger(e.target.value)} />
              </div>
            )}
          </div>

          {kalemler.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '11px 13px', background: 'var(--surface2)', borderRadius: 10, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Ara toplam {araToplamYeni.toLocaleString('tr-TR')} ₺{indirimTutarYeni > 0 ? ` − indirim ${indirimTutarYeni.toLocaleString('tr-TR')} ₺` : ''} · {slotlar.length} seans
              </span>
              <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--gold-text)' }}>{netToplamYeni.toLocaleString('tr-TR')} ₺</span>
            </div>
          )}
        </div>

        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button type="submit" className="btn btn-gold" disabled={yeniMutation.isPending}>
            {yeniMutation.isPending ? <span className="spin" /> : 'Randevuyu Oluştur'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={gonder}>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}

        <div className="field" style={{ marginTop: 0 }}>
          <label>Müşteri *</label>
          <input className="input" value={mevcut?.musteri_ad || '–'} disabled style={{ opacity: 0.7 }} />
        </div>

        <div className="form-grid">
          <div className="field full" style={{ margin: 0 }}>
            <label>Hizmet *</label>
            <Select className="input" value={hizmetId} onChange={(e) => secHizmet(e.target.value)}>
              <option value="">Seçiniz</option>
              {paketKalan.size > 0 && (
                <optgroup label="📦 Müşterinin paketli hizmetleri">
                  {(hizmetler ?? []).filter((h) => paketKalan.has(h.id)).map((h) => (
                    <option key={'p' + h.id} value={h.id}>📦 {h.ad} – paketinde {paketKalan.get(h.id)} seans hakkı</option>
                  ))}
                </optgroup>
              )}
              <optgroup label={paketKalan.size > 0 ? 'Tüm hizmetler' : ''}>
                {(hizmetler ?? []).map((h) => <option key={h.id} value={h.id}>{h.ad} · {h.sure_dk}dk · {Number(h.fiyat).toLocaleString('tr-TR')} ₺</option>)}
              </optgroup>
            </Select>
          </div>

          <div className="field full" style={{ margin: 0 }}>
            <label>Personel *</label>
            <Select className="input" value={personelId} onChange={(e) => setPersonelId(e.target.value)} disabled={!hizmetId}>
              <option value="">{hizmetId ? (listePersonel.length ? 'Seçiniz' : 'Bu hizmeti veren personel yok') : 'Önce hizmet seçin'}</option>
              {listePersonel.map((p) => {
                const ad = p.ad_soyad || `${p.ad} ${p.soyad || ''}`.trim()
                const etiket = p.id === gecmisPersonel ? '  ★ en son bu personelle geldi' : ''
                return <option key={p.id} value={p.id}>{ad}{etiket}</option>
              })}
            </Select>
            {hizmetId && listePersonel.length > 0 && (
              <div style={{ fontSize: 12, marginTop: 6, color: secilenGecmisten ? 'var(--gold-text)' : 'var(--muted)' }}>
                {secilenGecmisten
                  ? '★ Bu müşteri bu hizmette en son bu personelle geldi (otomatik seçildi).'
                  : `Bu hizmeti veren ${uygunPersoneller.length} personel · listeden değiştirebilirsiniz.`}
              </div>
            )}
          </div>
        </div>

        {/* Tarih + Saat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Tarih *</label>
            <input
              className="input"
              type="date"
              value={tarih}
              min={BUGUN}
              onChange={(e) => setTarih(e.target.value)}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Bitiş (otomatik)</label>
            <input className="input" type="time" value={bitis} onChange={(e) => setBitis(e.target.value)} />
          </div>
        </div>

        <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Saat *{saat ? <span style={{ color: 'var(--gold-text)', marginLeft: 6, fontWeight: 700 }}>{saat}</span> : ''}</span>
            {!personelId && hizmetId && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>Personel seçince dolu saatler görünür</span>}
          </label>
          <SaatGrid
            tarih={tarih}
            sureDk={secilenHizmet?.sure_dk || 60}
            secili={saat}
            doluSaatler={doluSaatler}
            onChange={degisSaat}
          />
        </div>

        <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
          <label>Tutar (₺)</label>
          <input className="input" type="number" min={0} value={paketten ? '0' : fiyat}
            disabled={paketten} onChange={(e) => setFiyat(e.target.value)}
            style={{ opacity: paketten ? 0.6 : 1 }} />
        </div>

        {uygunPaketler.length > 0 && (
          <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
            <label>Ödeme Şekli</label>
            <Select className="input" value={odemeSec} onChange={(e) => setOdemeSec(e.target.value)}>
              {uygunPaketler.map((p) => (
                <option key={p.id} value={'paket:' + p.id}>📦 Paketten say: {p.hizmet?.ad_tr || 'Paket'} ({p.toplam_seans} Seanstan {p.kalan_seans} Seans Kaldı)</option>
              ))}
              <option value="tek">💳 Tek seferlik ücret{fiyat ? ` (${Number(fiyat).toLocaleString('tr-TR')} ₺)` : ''}</option>
            </Select>
            {paketten && (() => {
              const sp = uygunPaketler.find((p) => 'paket:' + p.id === odemeSec)
              if (!sp) return null
              const az = sp.kalan_seans <= 2
              const kalanSonra = Math.max(sp.kalan_seans - 1, 0)
              return (
                <div style={{ marginTop: 8, padding: '11px 13px', borderRadius: 9, fontSize: 12.5, lineHeight: 1.6,
                  background: az ? 'rgba(231,76,60,.1)' : 'rgba(201,169,110,.1)',
                  border: `1px solid ${az ? 'rgba(231,76,60,.32)' : 'rgba(201,169,110,.25)'}`,
                  color: az ? '#ff8a7d' : 'var(--gold-text)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>{sp.hizmet?.ad_tr || 'Paket'} – {sp.kalan_seans} seans kaldı{az ? ' (bitmek üzere!)' : ''}</div>
                  Bu randevu "Tamamlandı" olunca paketten 1 seans düşülür ve <b>{kalanSonra} seans hakkı kalır</b>.
                </div>
              )
            })()}
          </div>
        )}
      </div>

      <div className="modal-f">
        <button type="button" className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button type="submit" className="btn btn-gold" disabled={m.isPending}>
          {m.isPending ? <span className="spin" /> : duzenle ? 'Güncelle' : 'Randevu Oluştur'}
        </button>
      </div>
    </form>
  )
}
