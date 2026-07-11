import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CalendarPlus } from 'lucide-react'
import Topbar from '../components/Topbar'
import SaatGrid, { bitisHesap, type DoluSaat } from '../components/SaatGrid'
import { apiGet, apiPost } from '../lib/api'
import { useT } from '../lib/ceviri'
import Select from '../components/Select'

interface Hizmet { id: number; ad: string; ad_tr?: string; sure_dk?: number; fiyat?: number | string; kategori_ad?: string }
interface Personel { id: number; ad: string; soyad?: string; ad_soyad?: string; hizmet_ids?: number[] }
const tl = (n?: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'
const BUGUN = new Date().toISOString().slice(0, 10)

export default function MusteriRandevuAl() {
  const nav = useNavigate()
  const t = useT()
  const { data: hizmetler } = useQuery({ queryKey: ['hizmetler'], queryFn: () => apiGet<Hizmet[]>('hizmet.php', 'liste') })
  const { data: personeller } = useQuery({ queryKey: ['personel'], queryFn: () => apiGet<Personel[]>('personel.php', 'liste') })

  const [hizmetId, setHizmetId] = useState('')
  const [personelId, setPersonelId] = useState('')
  const [tarih, setTarih] = useState(BUGUN)
  const [saat, setSaat] = useState('')
  const [hata, setHata] = useState('')
  const [ok, setOk] = useState(false)

  const hizmet = (hizmetler ?? []).find((h) => String(h.id) === hizmetId)
  const sureDk = hizmet?.sure_dk || 60

  const uygunPersoneller = (personeller ?? []).filter((p) =>
    hizmetId ? (!p.hizmet_ids || p.hizmet_ids.length === 0 || p.hizmet_ids.includes(Number(hizmetId))) : true,
  )

  // Dolu saatler — tarih seçilince yükle (personel seçilmişse onun dolularını, seçilmemişse hepsini)
  const { data: doluSaatlerRaw } = useQuery({
    queryKey: ['dolu-saatler-musteri', tarih, personelId],
    queryFn: () => apiGet<DoluSaat[]>('randevu.php', 'dolu_saatler', {
      tarih,
      personel_id: personelId || undefined,
    }),
    enabled: !!tarih,
  })
  const doluSaatler = doluSaatlerRaw ?? []

  const degisSaat = (s: string) => setSaat(s)

  const m = useMutation({
    mutationFn: () => apiPost('randevu.php', 'online_talep', {
      hizmet_id: Number(hizmetId), tarih, baslangic: saat,
      bitis: bitisHesap(saat, sureDk),
      personel_id: personelId ? Number(personelId) : undefined,
    }),
    onSuccess: () => setOk(true),
    onError: (e) => setHata((e as Error).message || 'Talep gönderilemedi.'),
  })

  function gonder(e: React.FormEvent) {
    e.preventDefault(); setHata('')
    if (!hizmetId) { setHata(t('ra.hataHizmet')); return }
    if (!tarih) { setHata(t('ra.hataTarih')); return }
    if (!saat) { setHata('Lütfen bir saat seçin.'); return }
    m.mutate()
  }

  if (ok) {
    return (
      <>
        <Topbar title={t('ra.baslik')} search={false} />
        <div className="page">
          <div className="panel" style={{ textAlign: 'center', padding: '50px 24px', maxWidth: 460, margin: '0 auto' }}>
            <div className="mic" style={{ width: 60, height: 60, margin: '0 auto 18px', background: 'rgba(46,204,113,.13)', color: 'var(--green)' }}><CheckCircle2 size={30} /></div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{t('ra.alindiBaslik')}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 22 }}>{t('ra.alindiMesaj')}</div>
            <button className="btn btn-gold" onClick={() => nav('/randevularim')} style={{ justifyContent: 'center' }}>{t('ra.donus')}</button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar title={t('ra.baslik')} subtitle={t('ra.altbaslik')} search={false} />
      <div className="page">
        <form onSubmit={gonder} className="panel" style={{ maxWidth: 520, padding: 24 }}>
          {hata && <div className="form-err" style={{ marginBottom: 14 }}>{hata}</div>}

          <div className="field" style={{ marginTop: 0 }}>
            <label>{t('ra.hizmet')} *</label>
            <Select className="input" value={hizmetId} onChange={(e) => { setHizmetId(e.target.value); setSaat('') }} autoFocus>
              <option value="">{t('ra.sec')}</option>
              {(hizmetler ?? []).map((h) => (
                <option key={h.id} value={h.id}>{(h.ad_tr || h.ad)}{h.kategori_ad ? ` · ${h.kategori_ad}` : ''} – {tl(h.fiyat)}</option>
              ))}
            </Select>
          </div>

          <div className="field">
            <label>{t('ra.personel')} <span style={{ color: 'var(--faint)', textTransform: 'none', letterSpacing: 0 }}>{t('ra.opsiyonel')}</span></label>
            <Select className="input" value={personelId} onChange={(e) => { setPersonelId(e.target.value); setSaat('') }} disabled={!hizmetId}>
              <option value="">{hizmetId ? t('ra.farketmez') : 'Önce hizmet seçin'}</option>
              {uygunPersoneller.map((p) => (
                <option key={p.id} value={p.id}>{p.ad_soyad || `${p.ad} ${p.soyad || ''}`.trim()}</option>
              ))}
            </Select>
          </div>

          <div className="field">
            <label>{t('ra.tarih')} *</label>
            <input className="input" type="date" min={BUGUN} value={tarih}
              onChange={(e) => { setTarih(e.target.value); setSaat('') }} />
          </div>

          {hizmet && (
            <div style={{ marginBottom: 6, padding: '9px 12px', background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.2)', borderRadius: 9, fontSize: 12.5, color: 'var(--text2)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{hizmet.sure_dk ? `${hizmet.sure_dk} dk` : ''}</span>
              <span style={{ color: 'var(--gold-text)', fontWeight: 600 }}>{tl(hizmet.fiyat)}</span>
            </div>
          )}

          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('ra.saat')} *{saat ? <span style={{ color: 'var(--gold-text)', marginLeft: 6, fontWeight: 700 }}>{saat}</span> : ''}</span>
              {!hizmetId && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>Önce hizmet seçin</span>}
            </label>
            <SaatGrid
              tarih={tarih}
              sureDk={sureDk}
              secili={saat}
              doluSaatler={doluSaatler}
              onChange={degisSaat}
            />
          </div>

          <button className="btn btn-gold" type="submit" disabled={m.isPending || !saat}
            style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}>
            {m.isPending ? <span className="spin" /> : <><CalendarPlus size={16} /> {t('ra.gonder')}</>}
          </button>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>{t('ra.onayNotu')}</p>
        </form>
      </div>
    </>
  )
}
