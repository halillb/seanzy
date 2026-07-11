import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, Users, Coins, Info, Settings2 } from 'lucide-react'
import { useBildirim, zamanGoster, type BildirimTip, type Bildirim } from '../store/bildirim'
import { sesCal, seciliSes } from '../lib/sounds'
import { pushBaslat } from '../lib/push'
import { useAuth } from '../store/auth'
import { apiGet, apiPost } from '../lib/api'

const IKON: Record<BildirimTip, { ic: React.ReactNode; bg: string; rk: string }> = {
  randevu: { ic: <Calendar />, bg: 'rgba(201,169,110,.14)', rk: 'var(--gold)' },
  musteri: { ic: <Users />, bg: 'rgba(59,130,246,.13)', rk: '#3B82F6' },
  finans:  { ic: <Coins />, bg: 'rgba(46,204,113,.13)', rk: '#2ECC71' },
  sistem:  { ic: <Info />, bg: 'var(--surface3)', rk: 'var(--muted)' },
}

interface ServerBildirim {
  id: number; tip: string; baslik: string; mesaj: string
  link?: string; okundu: boolean; ts: number
}

export default function NotificationBell() {
  const { liste, oku, tumunuOku, ekleServer } = useBildirim()
  const nav = useNavigate()
  const rol = useAuth((s) => s.user?.rol)
  const userId = useAuth((s) => s.user?.id)
  const [acik, setAcik] = useState(false)
  const ses = seciliSes(rol)
  const [, setTik] = useState(0)
  const kok = useRef<HTMLDivElement>(null)
  const prevOkunmamisRef = useRef<number | null>(null)
  const okunmamis = liste.filter((b) => !b.okundu).length

  // Tarayıcı bildirim izni: bir kez iste (sekme arka plandayken/simge durumundayken OS bildirimi göstermek için)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const iste = () => { void Notification.requestPermission(); document.removeEventListener('click', iste) }
      document.addEventListener('click', iste, { once: true })
    }
  }, [])

  // Yedek kanal: panelden yapılandırılıp aktif edilmişse OneSignal push aboneliği başlat (aksi halde no-op)
  useEffect(() => {
    if (userId) void pushBaslat(userId)
  }, [userId])

  // Ses çal + sekme arka plandaysa OS bildirimi göster: okunmamis arttığında (ilk yüklemede değil)
  useEffect(() => {
    if (prevOkunmamisRef.current !== null && okunmamis > prevOkunmamisRef.current) {
      sesCal(ses)
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        const son = liste.find((b) => !b.okundu)
        if (son) {
          const n = new Notification(son.baslik || 'Seanzy', { body: son.mesaj, tag: 'estetix-bildirim', icon: '/estetix/favicon.svg' })
          n.onclick = () => { window.focus(); n.close() }
        }
      }
    }
    prevOkunmamisRef.current = okunmamis
  }, [okunmamis, ses, liste])

  // Dakikada bir "X dk önce" yenile
  useEffect(() => {
    const t = setInterval(() => setTik((v) => v + 1), 60 * 1000)
    return () => clearInterval(t)
  }, [])

  // Click-outside
  useEffect(() => {
    if (!acik) return
    const dis = (e: MouseEvent) => { if (kok.current && !kok.current.contains(e.target as Node)) setAcik(false) }
    document.addEventListener('mousedown', dis)
    return () => document.removeEventListener('mousedown', dis)
  }, [acik])

  // DB polling — sadece mudur/superadmin için
  const pollServer = useCallback(async () => {
    if (!rol) return
    try {
      const data = await apiGet<ServerBildirim[]>('bildirim.php', 'app_bildirimler')
      if (!Array.isArray(data)) return
      const items: Bildirim[] = data.map((d) => ({
        id: d.id * -1,           // negatif id = server-kaynaklı (çakışmasın)
        serverId: d.id,
        baslik: d.baslik,
        mesaj: d.mesaj,
        ts: d.ts,
        okundu: d.okundu,
        tip: (d.tip as BildirimTip) || 'sistem',
        link: d.link ?? undefined,
      }))
      ekleServer(items)
    } catch { /* sessiz hata */ }
  }, [rol, ekleServer])

  useEffect(() => {
    pollServer()
    const t = setInterval(pollServer, 30 * 1000)
    return () => clearInterval(t)
  }, [pollServer])

  // Sekme tekrar görünür/odaklı olduğunda hemen tazele (arka plan zamanlayıcı kısıtlamasını telafi eder)
  useEffect(() => {
    const tazele = () => { if (!document.hidden) pollServer() }
    document.addEventListener('visibilitychange', tazele)
    window.addEventListener('focus', tazele)
    return () => { document.removeEventListener('visibilitychange', tazele); window.removeEventListener('focus', tazele) }
  }, [pollServer])

  const tikla = (b: Bildirim) => {
    oku(b.id)
    if (b.serverId) apiPost('bildirim.php', 'app_oku', { id: b.serverId }).catch(() => {})
    if (b.link) { setAcik(false); nav(b.link) }
  }

  const tumunuOkuVeServer = () => {
    tumunuOku()
    if (['mudur', 'superadmin'].includes(rol ?? '')) {
      apiPost('bildirim.php', 'app_oku', {}).catch(() => {})
    }
  }

  return (
    <div className="bell-wrap" ref={kok}>
      <button className={'icon-btn' + (okunmamis ? ' var' : '')} aria-label="Bildirimler" onClick={() => setAcik((v) => !v)}>
        <Bell size={18} />
        {okunmamis > 0 && <span className="bell-badge">{okunmamis > 9 ? '9+' : okunmamis}</span>}
      </button>

      {acik && (
        <div className="bell-pop">
          <div className="bell-h">
            <div className="t">Bildirimler{okunmamis > 0 ? ` · ${okunmamis} yeni` : ''}</div>
            {okunmamis > 0 && <a onClick={tumunuOkuVeServer}>Tümünü oku</a>}
          </div>

          <div className="bell-list">
            {liste.length === 0 && <div className="bell-bos">Bildirim yok.</div>}
            {liste.map((b) => {
              const k = IKON[b.tip]
              return (
                <div key={b.id} className={'bell-item' + (b.okundu ? '' : ' yeni')} onClick={() => tikla(b)} style={{ cursor: b.link ? 'pointer' : 'default' }}>
                  <div className="bell-ic" style={{ background: k.bg, color: k.rk }}>{k.ic}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bt">{b.baslik}</div>
                    <div className="bm">{b.mesaj}</div>
                    <div className="bz">{zamanGoster(b.ts)}</div>
                  </div>
                  {!b.okundu && <span className="bell-new-dot" />}
                </div>
              )
            })}
          </div>

          <div className="bell-foot">
            <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', gap: 6 }}
              onClick={() => { setAcik(false); nav('/bildirim-ayarlari') }}>
              <Settings2 size={13} /> Bildirim ayarları
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
