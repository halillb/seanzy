import { useEffect, useRef, type ReactNode } from 'react'
import { audioIsit } from './lib/sounds'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './store/auth'
import { useOzellikHaritasi } from './hooks/useOzellikHaritasi'
import { apiGet } from './lib/api'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import GenelBakis from './pages/GenelBakis'
import Musteriler from './pages/Musteriler'
import Randevular from './pages/Randevular'
import Hizmetler from './pages/Hizmetler'
import Pazarlama from './pages/Pazarlama'
import PersonelSayfa from './pages/Personel'
import Finans from './pages/Finans'
import Takvim from './pages/Takvim'
import ReklamAnlasmalari from './pages/ReklamAnlasmalari'
import PersonelProgram from './pages/PersonelProgram'
import Ayarlar from './pages/Ayarlar'
import Bildirimler from './pages/Bildirimler'
import BildirimAyarlari from './pages/BildirimAyarlari'
import BekleyenRandevular from './pages/BekleyenRandevular'
import DisaAktar from './pages/DisaAktar'
import MusteriRandevularim from './pages/MusteriRandevularim'
import MusteriRandevuAl from './pages/MusteriRandevuAl'
import SuperAdminIsletmeler from './pages/SuperAdminIsletmeler'
import SuperAdminOzet from './pages/SuperAdminOzet'
import SuperAdminProfil from './pages/SuperAdminProfil'
import SuperAdminPaketler from './pages/SuperAdminPaketler'
import SuperAdminEntegrasyonlar from './pages/SuperAdminEntegrasyonlar'
import SuperAdminEntegrasyonTalepleri from './pages/SuperAdminEntegrasyonTalepleri'
import Raporlar from './pages/Raporlar'
import Kampanyalar from './pages/Kampanyalar'
import Fiyatlar from './pages/Fiyatlar'
import Adisyon from './pages/Adisyon'
import UrunStok from './pages/UrunStok'
import PersonelPrim from './pages/PersonelPrim'
import BeklemeListe from './pages/BeklemeListe'
import SalonSkoru from './pages/SalonSkoru'
import Paketlerim from './pages/Paketlerim'
import Parapuan from './pages/Parapuan'
import Anket from './pages/Anket'
import { ConfirmHost } from './lib/confirm'
import { QuickActionHost } from './lib/quickAction'

function Protected({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function useProfilSync() {
  const token = useAuth((s) => s.token)
  const user = useAuth((s) => s.user)
  const setAuth = useAuth((s) => s.setAuth)
  const qc = useQueryClient()
  useQuery({
    queryKey: ['profil-sync'],
    queryFn: async () => {
      const data = await apiGet<Record<string, unknown>>('auth.php', 'profil')
      if (data && token && user) {
        // paket_turu değiştiyse auth store'u güncelle
        const yeniPaket = data['paket_turu'] as string | undefined
        if (yeniPaket && yeniPaket !== user.paket_turu) {
          setAuth(token, { ...user, paket_turu: yeniPaket })
        }
        // paket_listesi her seferinde cache'i güncelle (useErisim için)
        const liste = data['paket_listesi']
        if (Array.isArray(liste) && liste.length > 0) {
          qc.setQueryData(['sa-paketler'], liste)
        }
      }
      return data
    },
    enabled: !!token && !!user && user.rol !== 'superadmin',
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    retry: false,
    staleTime: 0,
  })
}

function Routed() {
  const nav = useNavigate()
  const logout = useAuth((s) => s.logout)
  const rol = useAuth((s) => s.user?.rol)
  useOzellikHaritasi() // Uygulama başlangıcında feature map'i önbellekle
  useProfilSync()      // SA paket değişikliğini sessizce senkronize et
  const personelMod = rol === 'personel'
  const superMod = rol === 'superadmin'
  const musteriMod = rol === 'musteri'
  useEffect(() => {
    const h = () => { logout(); nav('/login') }
    window.addEventListener('estetix-unauthorized', h)
    return () => window.removeEventListener('estetix-unauthorized', h)
  }, [nav, logout])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/fiyatlar" element={<Fiyatlar />} />
      <Route element={<Protected><AppLayout /></Protected>}>
        {superMod ? (
          <>
            <Route path="/sa-genel" element={<SuperAdminOzet />} />
            <Route path="/isletmeler" element={<SuperAdminIsletmeler />} />
            <Route path="/sa-profil" element={<SuperAdminProfil />} />
            <Route path="/sa-paketler"        element={<SuperAdminPaketler />} />
            <Route path="/sa-entegrasyonlar"  element={<SuperAdminEntegrasyonlar />} />
            <Route path="/sa-entegrasyon-talepleri" element={<SuperAdminEntegrasyonTalepleri />} />
            <Route path="/sa-bildirimler"     element={<Bildirimler />} />
          </>
        ) : musteriMod ? (
          <>
            <Route path="/randevularim" element={<MusteriRandevularim />} />
            <Route path="/randevu-al" element={<MusteriRandevuAl />} />
          </>
        ) : personelMod ? (
          <>
            <Route path="/programim" element={<PersonelProgram />} />
            <Route path="/randevular" element={<Randevular />} />
            <Route path="/musteriler" element={<Musteriler />} />
            <Route path="/urun-stok" element={<UrunStok />} />
            <Route path="/bildirim-ayarlari" element={<BildirimAyarlari />} />
          </>
        ) : (
          <>
            <Route path="/genel-bakis" element={<GenelBakis />} />
            <Route path="/takvim" element={<Takvim />} />
            <Route path="/randevular" element={<Randevular />} />
            <Route path="/musteriler" element={<Musteriler />} />
            <Route path="/personel" element={<PersonelSayfa />} />
            <Route path="/hizmetler" element={<Hizmetler />} />
            <Route path="/finans" element={<Finans />} />
            <Route path="/raporlar" element={<Raporlar />} />
            <Route path="/pazarlama" element={<Pazarlama />} />
            <Route path="/reklam-anlasmalari" element={<ReklamAnlasmalari />} />
            <Route path="/kampanyalar" element={<Kampanyalar />} />
            <Route path="/bekleyen" element={<BekleyenRandevular />} />
            <Route path="/bekleme-listesi" element={<BeklemeListe />} />
            <Route path="/adisyon" element={<Adisyon />} />
            <Route path="/urun-stok" element={<UrunStok />} />
            <Route path="/personel-prim" element={<PersonelPrim />} />
            <Route path="/salon-skoru" element={<SalonSkoru />} />
            <Route path="/bildirim-ayarlari" element={<BildirimAyarlari />} />
            <Route path="/disa-aktar" element={<DisaAktar />} />
            <Route path="/paketlerim" element={<Paketlerim />} />
            <Route path="/parapuan" element={<Parapuan />} />
            <Route path="/anket" element={<Anket />} />
            <Route path="/ayarlar" element={<Ayarlar />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to={superMod ? '/sa-genel' : musteriMod ? '/randevularim' : personelMod ? '/programim' : '/genel-bakis'} replace />} />
    </Routes>
  )
}

export default function App() {
  const isitildi = useRef(false)
  useEffect(() => {
    if (!isitildi.current) { isitildi.current = true; audioIsit() }
  }, [])
  return (
    <HashRouter>
      <Routed />
      <ConfirmHost />
      <QuickActionHost />
    </HashRouter>
  )
}
