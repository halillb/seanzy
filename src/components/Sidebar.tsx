import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, ClipboardList, Users, Package, UserCheck,
  Sparkles, Coins, BarChart3, Gift, Hourglass, Settings, LogOut, Megaphone,
  TrendingUp, Building2, Download, Lock, ShoppingBag, Star, Clock4,
  Receipt, Trophy, MessageSquare, Plug, X, Bell, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { useT } from '../lib/ceviri'
import DilSecici from './DilSecici'
import UygulamaYukle from './UygulamaYukle'
import { OZELLIKLER, PAKET_RENK, paketErisi, type PaketTuru } from '../lib/ozellikler'

interface NavItem { to: string; label: string; icon: LucideIcon; ozellik?: keyof typeof OZELLIKLER }
interface NavGroup { g: string; items: NavItem[] }
interface Props { mobAcik?: boolean; onKapat?: () => void }

const NAV: Record<string, NavGroup[]> = {
  mudur: [
    { g: 'grp.calisma', items: [
      { to: '/genel-bakis',        label: 'nav.genelBakis',      icon: LayoutDashboard },
      { to: '/takvim',             label: 'nav.takvim',          icon: Calendar,    ozellik: 'takvim'          },
      { to: '/randevular',         label: 'nav.randevular',      icon: ClipboardList, ozellik: 'randevu'       },
      { to: '/bekleyen',           label: 'nav.bekleyen',        icon: Hourglass,   ozellik: 'bekleyen'        },
      { to: '/bekleme-listesi',    label: 'nav.beklemeListe',    icon: Clock4,      ozellik: 'bekleme_listesi' },
    ]},
    { g: 'grp.musteriler', items: [
      { to: '/musteriler',         label: 'nav.musteriler',      icon: Users,       ozellik: 'musteri'         },
      { to: '/parapuan',           label: 'nav.parapuan',        icon: Coins,       ozellik: 'parapuan'        },
      { to: '/anket',              label: 'nav.anket',           icon: MessageSquare, ozellik: 'anket'         },
    ]},
    { g: 'grp.salon', items: [
      { to: '/personel',           label: 'nav.personel',        icon: UserCheck,   ozellik: 'personel'        },
      { to: '/personel-prim',      label: 'nav.personelPrim',    icon: Trophy,      ozellik: 'personel_prim'   },
      { to: '/hizmetler',          label: 'nav.hizmetler',       icon: Sparkles,    ozellik: 'hizmetler'       },
      { to: '/urun-stok',          label: 'nav.urunStok',        icon: ShoppingBag, ozellik: 'urun_stok'       },
    ]},
    { g: 'grp.finans', items: [
      { to: '/finans',             label: 'nav.finans',          icon: Coins,       ozellik: 'finans'          },
      { to: '/adisyon',            label: 'nav.adisyon',         icon: Receipt,     ozellik: 'adisyon'         },
      { to: '/raporlar',           label: 'nav.raporlar',        icon: BarChart3,   ozellik: 'raporlar'        },
      { to: '/salon-skoru',        label: 'nav.salonSkoru',      icon: Star,        ozellik: 'salon_skoru'     },
    ]},
    { g: 'grp.pazarlama', items: [
      { to: '/pazarlama',          label: 'nav.pazarlamaAnaliz', icon: TrendingUp,  ozellik: 'pazarlama'       },
      { to: '/reklam-anlasmalari', label: 'nav.reklam',          icon: Megaphone,   ozellik: 'reklam'          },
      { to: '/kampanyalar',        label: 'nav.kampanyalar',     icon: Gift,        ozellik: 'kampanyalar'     },
    ]},
    { g: 'grp.sistem', items: [
      { to: '/bildirim-ayarlari',  label: 'nav.bildirimAyarlari', icon: Bell },
      { to: '/disa-aktar',         label: 'nav.disaAktar',       icon: Download,    ozellik: 'disa_aktar'      },
      { to: '/paketlerim',         label: 'nav.paketlerim',      icon: Package },
      { to: '/ayarlar',            label: 'nav.ayarlar',         icon: Settings },
    ]},
  ],
  personel: [
    { g: 'grp.panelim', items: [
      { to: '/programim',         label: 'nav.programim',       icon: Calendar },
      { to: '/randevular',        label: 'nav.randevularim',    icon: ClipboardList },
      { to: '/bildirim-ayarlari', label: 'nav.bildirimAyarlari', icon: Bell },
    ]},
  ],
  superadmin: [
    { g: 'grp.yonetim', items: [
      { to: '/sa-genel',          label: 'nav.genelBakis',    icon: LayoutDashboard },
      { to: '/isletmeler',        label: 'nav.isletmeler',    icon: Building2 },
      { to: '/sa-paketler',       label: 'nav.paketler',      icon: Package },
      { to: '/sa-entegrasyonlar', label: 'nav.entegrasyonlar', icon: Plug },
      { to: '/sa-entegrasyon-talepleri', label: 'nav.entegrasyonTalepleri', icon: Clock4 },
      { to: '/sa-bildirimler',    label: 'nav.bildirimler',   icon: Bell },
    ]},
    { g: 'grp.hesabim', items: [
      { to: '/sa-profil',   label: 'nav.ayarlar',    icon: Settings },
    ]},
  ],
  musteri: [
    { g: 'grp.hesabim', items: [
      { to: '/randevularim', label: 'nav.randevularim', icon: ClipboardList },
      { to: '/randevu-al',   label: 'nav.randevuAl',    icon: Calendar },
    ]},
  ],
}

interface KilitModal { label: string; min: PaketTuru; renk: string }

export default function Sidebar({ mobAcik, onKapat }: Props) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const t = useT()
  const rol = user?.rol || 'mudur'
  const paket = user?.paket_turu || 'basic'
  const groups = NAV[rol] || NAV.mudur
  const ad = user ? `${user.ad} ${user.soyad || ''}`.trim() : 'Kullanıcı'
  const initials = (user?.ad?.[0] || '') + (user?.soyad?.[0] || '')
  const rolAd = t('rol.' + rol)
  const [kilitModal, setKilitModal] = useState<KilitModal | null>(null)

  function itemErisim(item: NavItem): boolean {
    if (!item.ozellik || rol !== 'mudur') return true
    const tanim = OZELLIKLER[item.ozellik]
    return tanim ? paketErisi(paket, tanim.min) : true
  }

  function kilitTikla(item: NavItem) {
    const tanim = item.ozellik ? OZELLIKLER[item.ozellik] : null
    const min = (tanim?.min || 'pro') as PaketTuru
    setKilitModal({ label: t(item.label), min, renk: PAKET_RENK[min] })
  }

  return (
    <aside className={'sb' + (mobAcik ? ' mob-acik' : '')}>
      <div className="sb-logo">
        <div className="sb-mark">S</div>
        <div>
          <div className="sb-wm">Sean<em>zy</em></div>
          <div className="sb-wsub">{rolAd}</div>
        </div>
      </div>
      <nav className="sb-nav">
        {groups.map((grp) => (
          <div key={grp.g}>
            <div className="sb-grp">{t(grp.g)}</div>
            {grp.items.map((it) => {
              const acik = itemErisim(it)
              if (!acik) {
                const tanim = it.ozellik ? OZELLIKLER[it.ozellik] : null
                const kilitRenk = tanim ? PAKET_RENK[tanim.min as PaketTuru] : 'var(--faint)'
                return (
                  <div key={it.to} className="sb-link sb-kilitli" style={{ opacity: 0.5, cursor: 'pointer' }}
                    onClick={() => kilitTikla(it)}>
                    <it.icon />
                    <span className="lbl" style={{ flex: 1 }}>{t(it.label)}</span>
                    <Lock size={10} style={{ color: kilitRenk, flexShrink: 0 }} />
                  </div>
                )
              }
              return (
                <NavLink key={it.to} to={it.to} className={({ isActive }) => 'sb-link' + (isActive ? ' ak' : '')} onClick={() => onKapat?.()}>
                  <it.icon />
                  <span className="lbl">{t(it.label)}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
        <UygulamaYukle />
        <div style={{ padding: '10px 8px 4px' }}><DilSecici /></div>
      </nav>
      <div className="sb-user">
        <div className="sb-av">{initials || 'SZ'}</div>
        <div className="sb-uinfo">
          <div className="sb-uname">{ad}</div>
          <div className="sb-urole">{rolAd}</div>
        </div>
        <button className="sb-out" title={t('genel.cikis')} onClick={() => { logout(); nav('/login') }}>
          <LogOut size={18} />
        </button>
      </div>
      {kilitModal && createPortal(
        <div className="modal-ov" onMouseDown={(e) => e.target === e.currentTarget && setKilitModal(null)}>
          <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }}>
            <div className="modal-h" style={{ justifyContent: 'flex-end', borderBottom: 'none', paddingBottom: 0 }}>
              <button className="modal-x" onClick={() => setKilitModal(null)}><X size={17} /></button>
            </div>
            <div style={{ padding: '4px 28px 28px' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${kilitModal.renk}22`, border: `1.5px solid ${kilitModal.renk}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Lock size={22} style={{ color: kilitModal.renk }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{kilitModal.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>
                Bu özellik <strong style={{ color: kilitModal.renk }}>{kilitModal.min.charAt(0).toUpperCase() + kilitModal.min.slice(1)}</strong> paketi veya üzeri gerektiriyor.
                Paketinizi yükseltmek için salon yöneticinize başvurun.
              </div>
              <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '11px 0' }}
                onClick={() => { setKilitModal(null); nav('/paketlerim') }}>
                Paketleri İncele
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  )
}
