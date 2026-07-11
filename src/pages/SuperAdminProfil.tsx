import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { User, Phone, Mail, KeyRound, Check } from 'lucide-react'
import Topbar from '../components/Topbar'
import { apiPost } from '../lib/api'
import { useAuth } from '../store/auth'
import PasswordInput from '../components/PasswordInput'
import PhoneInput from '../components/PhoneInput'
import { VARSAYILAN_ULKE, type Ulke } from '../data/countries'

export default function SuperAdminProfil() {
  const { user, setAuth, token } = useAuth()
  const [ad, setAd] = useState(user?.ad || '')
  const [soyad, setSoyad] = useState(user?.soyad || '')
  const [telNat, setTelNat] = useState('')
  const [telUlke, setTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const telefon = telNat ? (telUlke.iso2 === 'tr' ? '0' + telNat : telUlke.dial + telNat) : ''
  const [email, setEmail] = useState('')
  const [mevcutSifre, setMevcutSifre] = useState('')
  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')
  const [bilgiHata, setBilgiHata] = useState('')
  const [bilgiOk, setBilgiOk] = useState(false)
  const [sifreHata, setSifreHata] = useState('')
  const [sifreOk, setSifreOk] = useState(false)

  const bilgiMut = useMutation({
    mutationFn: () => apiPost('auth.php', 'profil_guncelle', {
      ad: ad.trim(), soyad: soyad.trim(),
      ...(telefon.trim() ? { telefon: telefon.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
    }),
    onSuccess: () => {
      setBilgiOk(true)
      setBilgiHata('')
      if (token && user) {
        setAuth(token, {
          ...user,
          ad: ad.trim(),
          soyad: soyad.trim(),
        })
      }
      setTimeout(() => setBilgiOk(false), 3000)
    },
    onError: (e) => setBilgiHata((e as Error).message || 'Güncelleme başarısız.'),
  })

  const sifreMut = useMutation({
    mutationFn: () => apiPost('auth.php', 'sifre_degistir', {
      mevcut_sifre: mevcutSifre,
      yeni_sifre: yeniSifre,
    }),
    onSuccess: () => {
      setSifreOk(true)
      setSifreHata('')
      setMevcutSifre('')
      setYeniSifre('')
      setYeniSifreTekrar('')
      setTimeout(() => setSifreOk(false), 3000)
    },
    onError: (e) => setSifreHata((e as Error).message || 'Şifre değiştirilemedi.'),
  })

  function sifreKaydet() {
    setSifreHata('')
    if (!mevcutSifre) { setSifreHata('Mevcut şifreyi girin.'); return }
    if (yeniSifre.length < 6) { setSifreHata('Yeni şifre en az 6 karakter olmalı.'); return }
    if (yeniSifre !== yeniSifreTekrar) { setSifreHata('Yeni şifreler eşleşmiyor.'); return }
    sifreMut.mutate()
  }

  return (
    <>
      <Topbar title="Hesabım" subtitle="Kişisel bilgiler ve güvenlik" search={false} />
      <div className="page" style={{ maxWidth: 560 }}>

        {/* Kişisel bilgiler */}
        <div className="panel" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="bell-ic" style={{ width: 36, height: 36, background: 'rgba(201,169,110,.13)', color: 'var(--gold)' }}><User size={17} /></div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Kişisel Bilgiler</span>
          </div>

          {bilgiHata && <div className="form-err" style={{ marginBottom: 14 }}>{bilgiHata}</div>}

          <div className="form-grid">
            <div className="field" style={{ margin: 0 }}>
              <label>Ad</label>
              <input className="input" value={ad} onChange={(e) => setAd(e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Soyad</label>
              <input className="input" value={soyad} onChange={(e) => setSoyad(e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label><Phone size={12} style={{ marginRight: 4 }} />Yeni Telefon <span style={{ color: 'var(--faint)', fontSize: 11 }}>(boş bırakırsan değişmez)</span></label>
              <PhoneInput national={telNat} country={telUlke} onNational={setTelNat} onCountry={setTelUlke} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label><Mail size={12} style={{ marginRight: 4 }} />Yeni E-posta <span style={{ color: 'var(--faint)', fontSize: 11 }}>(boş bırakırsan değişmez)</span></label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            {bilgiOk && <span style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}><Check size={14} /> Kaydedildi</span>}
            <button className="btn btn-gold" disabled={bilgiMut.isPending} onClick={() => { setBilgiHata(''); bilgiMut.mutate() }}>
              {bilgiMut.isPending ? <span className="spin" /> : 'Kaydet'}
            </button>
          </div>
        </div>

        {/* Şifre değiştir */}
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="bell-ic" style={{ width: 36, height: 36, background: 'rgba(59,130,246,.13)', color: '#3B82F6' }}><KeyRound size={17} /></div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Şifre Değiştir</span>
          </div>

          {sifreHata && <div className="form-err" style={{ marginBottom: 14 }}>{sifreHata}</div>}

          <div className="field" style={{ margin: '0 0 12px' }}>
            <label>Mevcut Şifre</label>
            <PasswordInput value={mevcutSifre} onChange={setMevcutSifre} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div className="field" style={{ margin: '0 0 12px' }}>
            <label>Yeni Şifre</label>
            <PasswordInput value={yeniSifre} onChange={setYeniSifre} placeholder="En az 6 karakter" autoComplete="new-password" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Yeni Şifre (Tekrar)</label>
            <PasswordInput value={yeniSifreTekrar} onChange={setYeniSifreTekrar} placeholder="••••••••" autoComplete="new-password" />
          </div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            {sifreOk && <span style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}><Check size={14} /> Şifre güncellendi</span>}
            <button className="btn btn-gold" disabled={sifreMut.isPending} onClick={sifreKaydet}>
              {sifreMut.isPending ? <span className="spin" /> : 'Şifreyi Değiştir'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
