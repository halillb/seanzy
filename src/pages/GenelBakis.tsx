import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, Coins, Users, PieChart, ArrowRight } from 'lucide-react'
import Topbar from '../components/Topbar'
import { useAuth } from '../store/auth'
import { apiGet } from '../lib/api'
import { trSaat } from '../lib/tarih'
import { useT } from '../lib/ceviri'

const bugunYazi = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const tl = (n: number) => Math.round(n).toLocaleString('tr-TR') + ' ₺'
const dk = (a?: string, b?: string) => { const h = (s?: string) => { if (!s) return 0; const [H, M] = s.split(':').map(Number); return H * 60 + (M || 0) }; return Math.max(0, h(b) - h(a)) }
const RENK = ['#C9A96E', '#3B82F6', '#2ECC71', '#A78BFA', '#E74C3C', '#1ABC9C', '#EC4899', '#F0B14E']
const DURUM_CLS: Record<string, string> = { bekliyor: 'badge-gold', onaylandi: 'badge-green', tamamlandi: 'badge-blue', iptal: 'badge-red', gelmedi: 'badge-muted' }
const DURUM_KEY: Record<string, string> = { bekliyor: 'durum.bekliyor', onaylandi: 'durum.onaylandi', tamamlandi: 'durum.tamamlandi', iptal: 'durum.iptal', gelmedi: 'durum.gelmedi' }
const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const KAPASITE_DK = 600 // personel başına ~10 saatlik gün
type Donem = 'gun' | 'hafta' | 'ay'
const DONEMLER: [Donem, string][] = [['gun', 'gb.gunluk'], ['hafta', 'gb.haftalik'], ['ay', 'gb.aylik']]
const OZET_DONEM: Record<Donem, string> = { gun: 'bugun', hafta: 'hafta', ay: 'ay' }
const SAYI_ETIKET: Record<Donem, string> = { gun: 'gb.randevuBugun', hafta: 'gb.randevuHafta', ay: 'gb.randevuAy' }
const GELIR_ETIKET: Record<Donem, string> = { gun: 'gb.gelirGun', hafta: 'gb.gelirHafta', ay: 'gb.gelirAy' }
const donemBaslangic = (p: Donem): string => {
  const d = new Date()
  if (p === 'hafta') d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  else if (p === 'ay') d.setDate(1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Randevu {
  tarih?: string; baslangic?: string; bitis?: string; hizmet_ad?: string
  musteri_ad?: string; personel_id?: number; personel_ad?: string; durum: string; fiyat?: number | string
}
interface Personel { id: number; ad: string; soyad?: string; ad_soyad?: string }
interface Musteri { id: number }
interface Ozet { toplam_gelir: number | string }

export default function GenelBakis() {
  const isletme = useAuth((s) => s.user?.isletme_adi)
  const nav = useNavigate()
  const t = useT()
  const today = toISO(new Date())
  const [donem, setDonem] = useState<Donem>('gun')

  const randevular = useQuery({ queryKey: ['randevular'], queryFn: () => apiGet<Randevu[]>('randevu.php', 'liste') })
  const musteriler = useQuery({ queryKey: ['musteriler'], queryFn: () => apiGet<Musteri[]>('musteri.php', 'liste') })
  const personel = useQuery({ queryKey: ['personel'], queryFn: () => apiGet<Personel[]>('personel.php', 'liste') })
  const ozet = useQuery({ queryKey: ['finans-ozet', donem], queryFn: () => apiGet<Ozet>('finans.php', 'ozet', { donem: OZET_DONEM[donem] }) })

  const hesap = useMemo(() => {
    const rnd = randevular.data ?? []
    const bugun = rnd.filter((r) => r.tarih === today).sort((a, b) => (a.baslangic || '').localeCompare(b.baslangic || ''))
    const aktif = bugun.filter((r) => r.durum !== 'iptal')

    // Dönem randevu sayısı
    const start = donemBaslangic(donem)
    const donemRandevu = rnd.filter((r) => r.tarih && r.tarih >= start && r.tarih <= today).length

    // Gelir grafiği (döneme göre granülerlik: gün=7 gün, hafta=4 hafta, ay=6 ay)
    const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const sumRange = (a: string, b: string) => rnd.filter((r) => r.durum === 'tamamlandi' && r.tarih && r.tarih >= a && r.tarih <= b).reduce((t, r) => t + Number(r.fiyat || 0), 0)
    const grafik: { etiket: string; tutar: number }[] = []
    if (donem === 'gun') {
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const iso = isoOf(d); grafik.push({ etiket: GUN_KISA[d.getDay()], tutar: sumRange(iso, iso) }) }
    } else if (donem === 'hafta') {
      for (let w = 3; w >= 0; w--) { const s = new Date(); s.setDate(s.getDate() - ((s.getDay() + 6) % 7) - w * 7); const e = new Date(s); e.setDate(e.getDate() + 6); grafik.push({ etiket: w === 0 ? 'Bu hf' : `${w} hf`, tutar: sumRange(isoOf(s), isoOf(e)) }) }
    } else {
      for (let mo = 5; mo >= 0; mo--) { const s = new Date(); s.setMonth(s.getMonth() - mo, 1); const e = new Date(s.getFullYear(), s.getMonth() + 1, 0); grafik.push({ etiket: AY_KISA[s.getMonth()], tutar: sumRange(isoOf(s), isoOf(e)) }) }
    }
    const grafikToplam = grafik.reduce((t, g) => t + g.tutar, 0)
    const grafikMax = Math.max(1, ...grafik.map((g) => g.tutar))

    // Personel doluluğu (bugün)
    const pMap = new Map<number, { ad: string; dakika: number }>()
    for (const p of personel.data ?? []) pMap.set(p.id, { ad: p.ad_soyad || `${p.ad} ${p.soyad || ''}`.trim(), dakika: 0 })
    let toplamDk = 0
    for (const r of aktif) {
      const sure = dk(r.baslangic, r.bitis)
      toplamDk += sure
      if (r.personel_id && pMap.has(r.personel_id)) pMap.get(r.personel_id)!.dakika += sure
    }
    const persSay = Math.max(1, (personel.data ?? []).length)
    const doluluk = Math.min(100, Math.round((toplamDk / (persSay * KAPASITE_DK)) * 100))
    const personelDoluluk = [...pMap.values()].filter((p) => p.dakika > 0)
      .sort((a, b) => b.dakika - a.dakika).slice(0, 5)
      .map((p) => ({ ad: p.ad, oran: Math.min(100, Math.round((p.dakika / KAPASITE_DK) * 100)) }))

    return { bugun, aktif, donemRandevu, grafik, grafikToplam, grafikMax, doluluk, personelDoluluk }
  }, [randevular.data, personel.data, today, donem])

  const metrics = [
    { ic: <CalendarCheck size={18} />, bg: 'rgba(201,169,110,.14)', lbl: t(SAYI_ETIKET[donem]), val: String(hesap.donemRandevu) },
    { ic: <Coins size={18} />, bg: 'rgba(46,204,113,.13)', lbl: t(GELIR_ETIKET[donem]), val: ozet.data ? tl(Number(ozet.data.toplam_gelir)) : '…' },
    { ic: <Users size={18} />, bg: 'rgba(59,130,246,.13)', lbl: t('gb.aktifMusteri'), val: musteriler.data ? String(musteriler.data.length) : '…' },
    { ic: <PieChart size={18} />, bg: 'rgba(201,169,110,.14)', lbl: t('gb.doluluk'), val: `%${hesap.doluluk}` },
  ]

  return (
    <>
      <Topbar title={t('nav.genelBakis')} subtitle={isletme || bugunYazi} search={t('genel.ara')} cta={t('genel.randevu')} onCta={() => nav('/takvim')} />
      <div className="page">
        <div style={{ display: 'flex', gap: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: 3, width: 'fit-content' }}>
          {DONEMLER.map(([k, l]) => (
            <button key={k} onClick={() => setDonem(k)}
              style={{ border: 'none', background: donem === k ? 'rgba(201,169,110,.15)' : 'none', color: donem === k ? 'var(--gold-text)' : 'var(--muted)', fontFamily: 'inherit', fontSize: 12.5, padding: '8px 18px', borderRadius: 7, cursor: 'pointer' }}>{t(l)}</button>
          ))}
        </div>
        <div className="metric-grid">
          {metrics.map((m) => (
            <div className="card metric" key={m.lbl}>
              <div className="mic" style={{ background: m.bg, color: 'var(--gold)' }}>{m.ic}</div>
              <div className="mlbl">{m.lbl}</div>
              <div className="mval">{m.val}</div>
            </div>
          ))}
        </div>

        <div className="split">
          <div className="panel">
            <div className="panel-h">
              <div className="panel-t">{t('gb.ajanda')}</div>
              <div className="section-a" style={{ cursor: 'pointer' }} onClick={() => nav('/takvim')}>{t('gb.takvimeGit')} <ArrowRight size={13} /></div>
            </div>
            {randevular.isLoading ? (
              <div style={{ height: 120, opacity: 0.4 }} />
            ) : hesap.bugun.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '34px 0', fontSize: 13 }}>{t('gb.ajandaYok')}</div>
            ) : hesap.bugun.map((a, i) => {
              const cls = DURUM_CLS[a.durum] || 'badge-muted'
              const lbl = DURUM_KEY[a.durum] ? t(DURUM_KEY[a.durum]) : a.durum
              return (
                <div className="row" key={i}>
                  <div className="row-time">{trSaat(a.baslangic)}</div>
                  <div className="sdot" style={{ background: RENK[(a.personel_id || i) % RENK.length] }} />
                  <div className="row-main">
                    <div className="row-title">{a.hizmet_ad || t('genel.randevu')}</div>
                    <div className="row-sub">{a.musteri_ad || ''}{a.bitis ? ` · ${dk(a.baslangic, a.bitis)} dk` : ''}</div>
                  </div>
                  <span className={`badge ${cls}`}>{lbl}</span>
                  {a.personel_ad && <span className="pill">{a.personel_ad}</span>}
                </div>
              )
            })}
          </div>

          <div className="panel">
            <div className="panel-h">
              <div className="panel-t">{t(GELIR_ETIKET[donem])}</div>
              <span className="badge badge-gold">{tl(hesap.grafikToplam)}</span>
            </div>
            <div className="bars">
              {hesap.grafik.map((g, i) => (
                <div key={i} className={'bar' + (g.tutar === hesap.grafikMax && g.tutar > 0 ? ' hi' : '')}
                  title={tl(g.tutar)} style={{ height: `${Math.round((g.tutar / hesap.grafikMax) * 100)}%` }} />
              ))}
            </div>
            <div className="bar-lbls">{hesap.grafik.map((g, i) => <span key={i}>{g.etiket}</span>)}</div>

            <div className="panel-h" style={{ margin: '22px 0 14px' }}><div className="panel-t">{t('gb.personelDoluluk')}</div></div>
            {hesap.personelDoluluk.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '6px 0' }}>{t('gb.doluPersonelYok')}</div>
            ) : hesap.personelDoluluk.map(({ ad, oran }) => (
              <div className="row" key={ad} style={{ border: 'none', padding: '7px 0', gap: 10 }}>
                <span className="pill" style={{ minWidth: 58, textAlign: 'center' }}>{ad.split(' ')[0]}</span>
                <div className="track"><div className="track-fill" style={{ width: `${oran}%` }} /></div>
                <span style={{ fontSize: 11.5, color: 'var(--text2)', width: 34, textAlign: 'right' }}>{oran}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
