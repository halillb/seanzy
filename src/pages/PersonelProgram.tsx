import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Check, CheckCheck, X, Clock, User } from 'lucide-react'
import Topbar from '../components/Topbar'
import { useAuth } from '../store/auth'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import { trTarihGun, trSaat } from '../lib/tarih'
import { useT } from '../lib/ceviri'

interface Randevu {
  id: number; musteri_ad?: string; musteri_tel?: string; hizmet_ad?: string
  tarih?: string; baslangic?: string; bitis?: string; fiyat?: number | string; durum: string
}
const tl = (n?: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const DURUM_CLS: Record<string, string> = { bekliyor: 'badge-gold', onaylandi: 'badge-green', tamamlandi: 'badge-blue', iptal: 'badge-red', gelmedi: 'badge-muted' }
const DURUM_KEY: Record<string, string> = { bekliyor: 'durum.bekliyor', onaylandi: 'durum.onaylandi', tamamlandi: 'durum.tamamlandi', iptal: 'durum.iptal', gelmedi: 'durum.gelmedi' }

export default function PersonelProgram() {
  const qc = useQueryClient()
  const t = useT()
  const ad = useAuth((s) => s.user?.ad)
  const [tarih, setTarih] = useState(toISO(new Date()))
  const randevular = useQuery({ queryKey: ['randevular'], queryFn: () => apiGet<Randevu[]>('randevu.php', 'liste') })

  const gun = useMemo(
    () => (randevular.data ?? []).filter((r) => r.tarih === tarih).sort((a, b) => (a.baslangic || '').localeCompare(b.baslangic || '')),
    [randevular.data, tarih],
  )
  const aktif = gun.filter((r) => r.durum !== 'iptal')

  const durumMut = useMutation({
    mutationFn: (v: { id: number; durum: string }) => apiPost('randevu.php', 'durum_guncelle', { id: v.id, durum: v.durum }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['randevular'] }),
  })
  const kaydir = (n: number) => { const d = new Date(tarih + 'T00:00'); d.setDate(d.getDate() + n); setTarih(toISO(d)) }

  return (
    <>
      <Topbar title={`${t('mp.merhaba')} ${ad || ''}`} subtitle={t('pp.altbaslik')} search={false} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button className="cal-nav-btn" onClick={() => kaydir(-1)}><ChevronLeft size={16} /></button>
          <div style={{ fontSize: 15, fontWeight: 500, minWidth: 210, textAlign: 'center', textTransform: 'capitalize' }}>{trTarihGun(tarih)}</div>
          <button className="cal-nav-btn" onClick={() => kaydir(1)}><ChevronRight size={16} /></button>
          <button className="btn btn-sm btn-ghost" onClick={() => setTarih(toISO(new Date()))}>{t('eylem.bugun')}</button>
          <span className="badge badge-gold" style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 12px' }}>{aktif.length} {t('pp.randevu')}</span>
        </div>

        {randevular.isLoading ? (
          <div className="panel" style={{ height: 200, opacity: 0.4 }} />
        ) : gun.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 50 }}>{t('pp.randevuYok')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gun.map((r) => {
              const cls = DURUM_CLS[r.durum] || 'badge-muted'
              const lbl = DURUM_KEY[r.durum] ? t(DURUM_KEY[r.durum]) : r.durum
              const iptal = r.durum === 'iptal'
              return (
                <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', opacity: iptal ? 0.55 : 1 }}>
                  <div style={{ textAlign: 'center', minWidth: 64 }}>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{trSaat(r.baslangic)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{trSaat(r.bitis)}</div>
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 500, textDecoration: iptal ? 'line-through' : 'none' }}>{r.hizmet_ad || 'Randevu'}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <User size={13} />{r.musteri_ad || '—'}{r.fiyat ? <span style={{ color: 'var(--gold-text)' }}> · {tl(r.fiyat)}</span> : null}
                    </div>
                  </div>
                  <span className={`badge ${cls}`}>{lbl}</span>
                  {!iptal && r.durum !== 'tamamlandi' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.durum === 'bekliyor' && <button className="btn btn-sm" title={t('eylem.onayla')} disabled={durumMut.isPending} onClick={() => durumMut.mutate({ id: r.id, durum: 'onaylandi' })}><Check size={15} /></button>}
                      <button className="btn btn-sm btn-gold" title={t('eylem.tamamla')} disabled={durumMut.isPending} onClick={() => durumMut.mutate({ id: r.id, durum: 'tamamlandi' })}><CheckCheck size={15} /></button>
                      <button className="btn btn-sm" title={t('durum.iptal')} style={{ color: '#ff8a7d' }} disabled={durumMut.isPending} onClick={async () => { if (await confirmAsync(t('pp.iptalOnay'))) durumMut.mutate({ id: r.id, durum: 'iptal' }) }}><X size={15} /></button>
                    </div>
                  )}
                  {r.durum === 'tamamlandi' && <span style={{ fontSize: 11.5, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{t('pp.bitti')}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
