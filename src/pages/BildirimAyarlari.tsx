import { useState } from 'react'
import { Bell, Play, Calendar, Users, Coins, Info } from 'lucide-react'
import Topbar from '../components/Topbar'
import Select from '../components/Select'
import { useBildirim, zamanGoster, type BildirimTip } from '../store/bildirim'
import { SESLER, SES_DOSYALARI, sesCal, seciliSes, sesSec } from '../lib/sounds'
import { apiPost } from '../lib/api'
import { useAuth } from '../store/auth'

const IKON: Record<BildirimTip, { ic: React.ReactNode; bg: string; rk: string }> = {
  randevu: { ic: <Calendar size={14} />, bg: 'rgba(201,169,110,.14)', rk: 'var(--gold)' },
  musteri: { ic: <Users size={14} />, bg: 'rgba(59,130,246,.13)', rk: '#3B82F6' },
  finans:  { ic: <Coins size={14} />, bg: 'rgba(46,204,113,.13)', rk: '#2ECC71' },
  sistem:  { ic: <Info size={14} />, bg: 'var(--surface3)', rk: 'var(--muted)' },
}

export default function BildirimAyarlari() {
  const { liste, oku, tumunuOku, ekle } = useBildirim()
  const rol = useAuth((s) => s.user?.rol)
  const [ses, setSes] = useState(seciliSes(rol))
  const okunmamis = liste.filter(b => !b.okundu).length

  function tumunuOkuVeServer() {
    tumunuOku()
    apiPost('bildirim.php', 'app_oku', {}).catch(() => {})
  }

  return (
    <>
      <Topbar title="Bildirim Ayarları" subtitle="Uygulama içi bildirimler ve ses tercihi" search={false} />
      <div className="page">
        <div style={{ maxWidth: 680, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ses ayarları */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} style={{ color: 'var(--gold)' }} /> Bildirim Sesi
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Select className="input" value={ses} style={{ flex: 1 }}
                onChange={(e) => { setSes(e.target.value); sesSec(e.target.value) }}>
                <optgroup label="— Ses Kayıtları —">
                  {SES_DOSYALARI.map(s => (
                    <option key={s.id} value={s.id}>{s.ad}</option>
                  ))}
                </optgroup>
                <optgroup label="— Modern & Elektronik —">
                  {SESLER.filter(s => ['808-kick','hihat','synth-pluck','rhodes','vibrafon','synth-bell','lofi','laser'].includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.ad}</option>
                  ))}
                </optgroup>
                <optgroup label="— Enstrüman Tarzı —">
                  {SESLER.filter(s => ['piyano','gitar','metalofon','ksilofon','kalimba','org','flut'].includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.ad}</option>
                  ))}
                </optgroup>
                <optgroup label="— Kısa (0–0.5s) —">
                  {SESLER.filter(s => ['cingirak','zil','damla','pop','kristal'].includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.ad}</option>
                  ))}
                </optgroup>
                <optgroup label="— Orta & Uzun —">
                  {SESLER.filter(s => ['melodi','ding-dong','kapi-zili','fanfar','randevu-sesi'].includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.ad}</option>
                  ))}
                </optgroup>
              </Select>
              <button type="button" className="btn btn-ghost" style={{ flexShrink: 0, gap: 6 }} onClick={() => sesCal(ses)}>
                <Play size={14} /> Dinle
              </button>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Test bildirimi gönder:</span>
              <button className="btn btn-ghost btn-sm"
                onClick={() => ekle({ baslik: 'Test bildirimi', mesaj: 'Bildirim zili ve ses böyle görünüyor.', tip: 'sistem' })}>
                Test gönder
              </button>
            </div>
          </div>

          {/* Geçmiş bildirimler */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                Geçmiş Bildirimler {okunmamis > 0 && <span style={{ fontSize: 12, color: 'var(--gold)', marginLeft: 6 }}>{okunmamis} yeni</span>}
              </div>
              {okunmamis > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={tumunuOkuVeServer}>Tümünü okundu işaretle</button>
              )}
            </div>

            {liste.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Henüz bildirim yok.</div>
            )}

            {liste.map((b) => {
              const k = IKON[b.tip]
              return (
                <div key={b.id} onClick={() => oku(b.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--border)', background: b.okundu ? 'transparent' : 'rgba(201,169,110,.04)', cursor: 'default' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: k.bg, color: k.rk }}>{k.ic}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: b.okundu ? 400 : 600 }}>{b.baslik}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 2, lineHeight: 1.5 }}>{b.mesaj}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 4 }}>{zamanGoster(b.ts)}</div>
                  </div>
                  {!b.okundu && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, marginTop: 8 }} />}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </>
  )
}
