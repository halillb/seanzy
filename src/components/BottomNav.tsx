import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar, CalendarPlus, Users, ClipboardList,
  Plus, X, UserPlus, Sparkles, Home, Menu, AtSign, MapPin, ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { useQuickAction, type QuickAction } from '../lib/quickAction'
import { useMobileNav } from '../store/mobileNav'
import { apiGet } from '../lib/api'

interface NavItem { to?: string; label: string; icon: LucideIcon; external?: 'konum' | 'instagram' }
interface DialItem { label: string; sub: string; icon: LucideIcon; color: string; action: QuickAction }

// Rol bazlı sol/sağ grupları — otomatik yarılama yerine elle dengelenmiş dizilim
const MOB_NAV_SIDES: Record<string, { sol: NavItem[]; sag: NavItem[] }> = {
  mudur: {
    sol: [{ to: '/takvim', label: 'Takvim', icon: Calendar }, { to: '/musteriler', label: 'Müşteriler', icon: Users }],
    sag: [{ to: '/randevular', label: 'Randevular', icon: ClipboardList }],
  },
  personel: {
    sol: [{ to: '/musteriler', label: 'Müşteriler', icon: Users }, { to: '/randevular', label: 'Randevular', icon: ClipboardList }],
    sag: [{ to: '/urun-stok', label: 'Ürün/Stok', icon: ShoppingBag }, { to: '/programim', label: 'Programım', icon: Calendar }],
  },
  superadmin: {
    sol: [{ to: '/sa-genel', label: 'Özet', icon: Home }],
    sag: [{ to: '/isletmeler', label: 'İşletmeler', icon: Users }],
  },
  musteri: {
    sol: [{ external: 'instagram', label: 'Instagram', icon: AtSign }, { external: 'konum', label: 'Konum', icon: MapPin }],
    sag: [{ to: '/randevularim', label: 'Randevularım', icon: ClipboardList }],
  },
}

const DIAL: Record<string, DialItem[]> = {
  mudur: [
    { label: 'Yeni Randevu', sub: 'Hızlı randevu oluştur', icon: CalendarPlus, color: 'rgba(201,169,110,.18)', action: 'randevu' },
    { label: 'Yeni Müşteri', sub: 'Müşteri kaydı aç',      icon: UserPlus,     color: 'rgba(59,130,246,.15)',  action: 'musteri' },
    { label: 'Hizmet Ekle',  sub: 'Yeni hizmet tanımla',   icon: Sparkles,     color: 'rgba(167,139,250,.15)', action: 'hizmet' },
  ],
  personel: [
    { label: 'Yeni Randevu', sub: 'Hızlı randevu oluştur', icon: CalendarPlus, color: 'rgba(201,169,110,.18)', action: 'randevu' },
  ],
  superadmin: [],
  musteri: [],
}

export default function BottomNav() {
  const { user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const acAction = useQuickAction((s) => s.ac)
  const dialAcik = useQuickAction((s) => s.dialAcik)
  const dialAc = useQuickAction((s) => s.dialAc)
  const dialKapat = useQuickAction((s) => s.dialKapat)
  const toggleMobileMenu = useMobileNav((s) => s.toggle)
  const rol = user?.rol || 'mudur'
  const musteriMod = rol === 'musteri'

  const { data: isletmeAyar } = useQuery({
    queryKey: ['anket-ayar-linkler'],
    queryFn: () => apiGet<{ google_harita_link?: string; instagram_url?: string }>('anket.php', 'ayar'),
    enabled: musteriMod,
    staleTime: 5 * 60_000,
  })

const { sol, sag } = MOB_NAV_SIDES[rol] || { sol: [], sag: [] }
  const dialItems = DIAL[rol] || []
  const showFab = dialItems.length > 0 || musteriMod

  function itemTikla(it: NavItem) {
    if (it.external === 'instagram') { if (isletmeAyar?.instagram_url) window.open(isletmeAyar.instagram_url, '_blank'); return }
    if (it.external === 'konum') { if (isletmeAyar?.google_harita_link) window.open(isletmeAyar.google_harita_link, '_blank'); return }
    if (it.to) nav(it.to)
  }

  function fabTikla() {
    if (musteriMod) { nav('/randevu-al'); return }
    dialAcik ? dialKapat() : dialAc()
  }

  const solItems = sol
  const sagItems = sag
  const cols = sol.length + sag.length + (showFab ? 1 : 0) + 1 // +1 = menü butonu

  return (
    <>
      {dialAcik && createPortal(
        <>
          <div className="fab-overlay" onClick={dialKapat} />
          <div className="fab-dial">
            {dialItems.map((d, i) => (
              <button key={i} className="fab-item" onClick={() => acAction(d.action)}>
                <div className="fab-item-ic" style={{ background: d.color }}>
                  <d.icon size={19} style={{ stroke: 'var(--gold)' }} />
                </div>
                <div>
                  <div className="fab-item-t">{d.label}</div>
                  <div className="fab-item-s">{d.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}

      <div className="bot-nav" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
        {solItems.map((it) => (
          <button key={it.label} className={'bot-nav-item' + (it.to && loc.pathname === it.to ? ' ak' : '')} onClick={() => itemTikla(it)}>
            <it.icon />
            <span>{it.label}</span>
          </button>
        ))}

        {showFab && (
          <div className="bot-fab" onClick={fabTikla}>
            <div className={'bot-fab-btn' + (dialAcik ? ' acik' : '')}>
              {dialAcik
                ? <X size={24} color="#0C0C0D" />
                : <Plus size={26} color="#0C0C0D" strokeWidth={2.5} />}
            </div>
            <span className="bot-fab-lbl">{musteriMod ? 'Randevu Al' : dialAcik ? 'Kapat' : 'Hızlı İşlem'}</span>
          </div>
        )}

        {sagItems.map((it) => (
          <button key={it.label} className={'bot-nav-item' + (it.to && loc.pathname === it.to ? ' ak' : '')} onClick={() => itemTikla(it)}>
            <it.icon />
            <span>{it.label}</span>
          </button>
        ))}

        <button className="bot-nav-item" onClick={toggleMobileMenu}>
          <Menu />
          <span>Menü</span>
        </button>
      </div>
    </>
  )
}
