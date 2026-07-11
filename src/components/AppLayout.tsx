import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Lock, LogOut } from 'lucide-react'
import Sidebar from './Sidebar'
import KarsilamaBar from './KarsilamaBar'
import GunlukKarsilama from './GunlukKarsilama'
import BottomNav from './BottomNav'
import ScrollToTop from './ScrollToTop'
import { useAuth } from '../store/auth'
import { useT } from '../lib/ceviri'
import { useMobileNav } from '../store/mobileNav'

function selamlama(saat: number): string {
  if (saat >= 5 && saat < 12) return 'Günaydın'
  if (saat >= 12 && saat < 17) return 'İyi günler'
  if (saat >= 17 && saat < 21) return 'İyi akşamlar'
  return 'İyi geceler'
}

function MobilUst({ ad }: { ad: string }) {
  const [simdi, setSimdi] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setSimdi(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  const saat = simdi.getHours()
  const dakika = String(simdi.getMinutes()).padStart(2, '0')
  const gun = simdi.getDate()
  const ay = simdi.toLocaleDateString('tr-TR', { month: 'short' }).replace('.', '')

  return (
    <div className="sb-mob">
      <span className="sb-mob-selam">{selamlama(saat)}<span className="sb-mob-selam-ad">, {ad}</span></span>
      <span className="sb-mob-logo">Sean<em>zy</em></span>
      <span className="sb-mob-saat">{gun} {ay} · {String(saat).padStart(2, '0')}:{dakika}</span>
    </div>
  )
}

export default function AppLayout() {
  const nav = useNavigate()
  const t = useT()
  const { user, logout } = useAuth()
  const kisitli = user?.erisim === 'kisitli'
  const location = useLocation()
  const sbAcik = useMobileNav((s) => s.sbAcik)
  const kapat = useMobileNav((s) => s.kapat)

  useEffect(() => { kapat() }, [location.pathname, kapat])

  return (
    <div id="shell">
      <Sidebar mobAcik={sbAcik} onKapat={kapat} />
      {sbAcik && <div className="sb-bdrop" onClick={kapat} />}

      <div className="main" style={kisitli ? { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' } : undefined}>
        <MobilUst ad={user?.ad || 'Hoş geldiniz'} />
        <KarsilamaBar />
        <Outlet />
      </div>

      <GunlukKarsilama />
      <BottomNav />
      <ScrollToTop />

      {kisitli && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22, background: 'rgba(10,10,12,.45)', backdropFilter: 'blur(2px)' }}>
          <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: '34px 30px', pointerEvents: 'auto' }}>
            <div className="mic" style={{ width: 60, height: 60, margin: '0 auto 18px', background: 'rgba(231,76,60,.13)', color: '#ff8a7d' }}><Lock size={28} /></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{t('kisitli.baslik')}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 22 }}>
              <b>{user?.isletme_adi || ''}</b> {t('kisitli.mesaj')}
              <br /><br />
              {t('kisitli.iletisim')}
            </div>
            <button className="btn btn-ghost" onClick={() => { logout(); nav('/login') }} style={{ width: '100%', justifyContent: 'center' }}>
              <LogOut size={15} /> {t('genel.cikis')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
