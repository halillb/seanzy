import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react'
import { api, type ApiYanit } from '../lib/api'
import { useAuth, type Kullanici } from '../store/auth'
import ThemeToggle from '../components/ThemeToggle'
import DilSecici from '../components/DilSecici'
import PasswordInput from '../components/PasswordInput'
import PhoneInput from '../components/PhoneInput'
import { VARSAYILAN_ULKE, type Ulke } from '../data/countries'
import { useT } from '../lib/ceviri'

const SA_KOD = 'homedyacom'

type Adim = 'giris' | 'kimlik' | 'kanal-sec' | 'otp-sifre' | 'basarili'
interface Kanal { kod: string; ad: string; maske: string }

export default function Login() {
  const nav = useNavigate()
  const t = useT()
  const setAuth = useAuth((s) => s.setAuth)

  // Giriş
  const [superMod, setSuperMod] = useState(false)
  const [slug, setSlug] = useState('')
  const [girisYontemi, setGirisYontemi] = useState<'telefon' | 'eposta'>('telefon')
  const [telNat, setTelNat] = useState('')
  const [telUlke, setTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const [eposta, setEposta] = useState('')
  const telefon = telNat ? (telUlke.iso2 === 'tr' ? '0' + telNat : telUlke.dial + telNat) : ''
  const giris = girisYontemi === 'eposta' ? eposta.trim() : telefon
  const [sifre, setSifre] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  // Şifremi Unuttum
  const [adim, setAdim] = useState<Adim>('giris')
  const [sfYontem, setSfYontem] = useState<'telefon' | 'eposta'>('telefon')
  const [sfTelNat, setSfTelNat] = useState('')
  const [sfTelUlke, setSfTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const [sfEposta, setSfEposta] = useState('')
  const sfTelefon = sfTelNat ? (sfTelUlke.iso2 === 'tr' ? '0' + sfTelNat : sfTelUlke.dial + sfTelNat) : ''
  const sfGiris = sfYontem === 'eposta' ? sfEposta.trim() : sfTelefon
  const [kanallar, setKanallar] = useState<Kanal[]>([])
  const [seciliKanal, setSeciliKanal] = useState('')
  const [sfOtp, setSfOtp] = useState('')
  const [sfSifre, setSfSifre] = useState('')
  const [sfSifreTekrar, setSfSifreTekrar] = useState('')
  const [sfHata, setSfHata] = useState('')
  const [sfYukleniyor, setSfYukleniyor] = useState(false)

  function slugDegisti(val: string) {
    if (val === SA_KOD || val.toLowerCase() === 'superadmin') { setSuperMod(true); setSlug(''); setHata('') }
    else { setSuperMod(false); setSlug(val) }
  }

  function sfBaslat() {
    setSfYontem(girisYontemi); setSfTelNat(telNat); setSfTelUlke(telUlke); setSfEposta(eposta)
    setSfOtp(''); setSfSifre(''); setSfSifreTekrar(''); setSfHata('')
    setKanallar([]); setSeciliKanal('')
    setAdim('kimlik')
  }

  async function girisYap(e: FormEvent) {
    e.preventDefault()
    setHata(''); setYukleniyor(true)
    try {
      const slugVal = slug.trim().toLowerCase()
      const tenant = superMod ? 'superadmin' : slugVal
      const { data: res } = await api.post<ApiYanit<Record<string, unknown>>>('/api/login.php', {
        tenant, giris, sifre,
      })
      if (!res.basari || !res.data?.token) { setHata(res.mesaj || (res.basari ? 'Token alınamadı.' : 'Giriş başarısız.')); return }
      const d = res.data
      const rol = String(d.rol || '')
      const user: Kullanici = {
        id: Number(d.id), ad: String(d.ad || ''), soyad: String(d.soyad || ''),
        rol, tenant_id: Number(d.tenant_id || 0),
        isletme_adi: String(d.isletme_adi || ''), erisim: String(d.erisim || 'aktif'),
        paket_turu: String(d.paket_turu || 'basic'),
      }
      setAuth(String(d.token), user)
      if (rol === 'superadmin') nav('/sa-genel')
      else if (rol === 'personel') nav('/programim')
      else if (rol === 'musteri') nav('/randevularim')
      else nav('/genel-bakis')
    } catch (err: unknown) {
      const e = err as { response?: { data?: ApiYanit; status?: number } }
      const sunucuMesaj = e.response?.data?.mesaj
      const httpKod = e.response?.status
      setHata(sunucuMesaj || (httpKod ? `Sunucu hatası (${httpKod}).` : 'Sunucuya ulaşılamadı.'))
    } finally { setYukleniyor(false) }
  }

  async function kanallarGetir(e: FormEvent) {
    e.preventDefault()
    setSfHata(''); setSfYukleniyor(true)
    const slugVal = slug.trim().toLowerCase()
    if (!slugVal) { setSfHata('Önce işletme kodunu girin.'); setSfYukleniyor(false); return }
    if (!sfGiris.trim()) { setSfHata('Telefon veya e-posta girin.'); setSfYukleniyor(false); return }
    try {
      const { data: res } = await api.get<ApiYanit<{ kanallar: Kanal[] }>>('/api/sifre-kanallar', {
        params: { tenant: slugVal, giris: sfGiris.trim() },
      })
      if (!res.basari || !res.data?.kanallar?.length) {
        setSfHata(res.mesaj || 'Doğrulama kanalı bulunamadı.'); return
      }
      setKanallar(res.data.kanallar)
      setSeciliKanal(res.data.kanallar[0].kod)
      setAdim('kanal-sec')
    } catch (err: unknown) {
      const e = err as { response?: { data?: ApiYanit } }
      setSfHata(e.response?.data?.mesaj || 'Sunucuya ulaşılamadı.')
    } finally { setSfYukleniyor(false) }
  }

  async function otpGonder(e: FormEvent) {
    e.preventDefault()
    if (!seciliKanal) { setSfHata('Bir kanal seçin.'); return }
    setSfHata(''); setSfYukleniyor(true)
    try {
      const { data: res } = await api.post<ApiYanit<null>>('/api/sifre-otp-gonder', {
        tenant: slug.trim().toLowerCase(),
        giris: sfGiris.trim(),
        kanal: seciliKanal,
      })
      if (!res.basari) { setSfHata(res.mesaj || 'Kod gönderilemedi.'); return }
      setSfOtp(''); setAdim('otp-sifre')
    } catch (err: unknown) {
      const e = err as { response?: { data?: ApiYanit } }
      setSfHata(e.response?.data?.mesaj || 'Sunucuya ulaşılamadı.')
    } finally { setSfYukleniyor(false) }
  }

  async function otpDogrula(e: FormEvent) {
    e.preventDefault()
    setSfHata('')
    if (sfOtp.length !== 6) { setSfHata('6 haneli kodu eksiksiz girin.'); return }
    if (sfSifre.length < 6) { setSfHata('Yeni şifre en az 6 karakter olmalıdır.'); return }
    if (sfSifre !== sfSifreTekrar) { setSfHata('Şifreler eşleşmiyor.'); return }
    setSfYukleniyor(true)
    try {
      const { data: res } = await api.post<ApiYanit<null>>('/api/sifre-otp-dogrula', {
        tenant: slug.trim().toLowerCase(),
        giris: sfGiris.trim(),
        kanal: seciliKanal,
        kod: sfOtp.trim(),
        yeni_sifre: sfSifre,
      })
      if (!res.basari) { setSfHata(res.mesaj || 'Doğrulama başarısız.'); return }
      setAdim('basarili')
    } catch (err: unknown) {
      const e = err as { response?: { data?: ApiYanit } }
      setSfHata(e.response?.data?.mesaj || 'Sunucuya ulaşılamadı.')
    } finally { setSfYukleniyor(false) }
  }

  const kanalIkon = (kod: string) => {
    if (kod === 'email') return <Mail size={18} />
    if (kod === 'whatsapp') return <MessageSquare size={18} />
    return <Phone size={18} />
  }

  const ust = (
    <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
      <DilSecici /><ThemeToggle />
    </div>
  )

  const logo = (
    <div style={{ textAlign: 'center', marginBottom: 34 }}>
      <img src="/estetix/icon-192.png" alt="Seanzy" style={{ width: 72, height: 72, borderRadius: 18, margin: '0 auto 20px', display: 'block', boxShadow: '0 8px 24px rgba(201,169,110,.35)' }} />
      <div className="serif" style={{ fontWeight: 400, fontSize: 40, letterSpacing: '.14em' }}>
        Sean<em style={{ color: 'var(--gold)' }}>zy</em>
      </div>
      <div style={{ fontSize: 11, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 8 }}>
        {t('login.slogan')}
      </div>
    </div>
  )

  const kart: React.CSSProperties = {
    background: 'var(--panel-bg)', border: '1px solid rgba(201,169,110,.18)',
    borderRadius: 'var(--r-xl)', padding: '30px 28px',
    backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-lg)',
  }

  const hataKutu = (mesaj: string) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(231,76,60,.1)', border: '1px solid rgba(231,76,60,.25)', borderRadius: 10, padding: '11px 13px', marginBottom: 16, fontSize: 12.5, color: '#e8736a' }}>
      <AlertTriangle size={15} style={{ marginTop: 1, flexShrink: 0 }} /> <span>{mesaj}</span>
    </div>
  )

  const geriBaslik = (baslik: string, geri: () => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
      <button type="button" onClick={geri}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', padding: 0 }}>
        <ArrowLeft size={18} />
      </button>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{baslik}</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 22px', position: 'relative', overflow: 'hidden' }}>
      {ust}
      <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(201,169,110,.13)', top: -140, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        {logo}

        {/* ── Normal giriş ── */}
        {adim === 'giris' && (
          <form onSubmit={girisYap} style={kart}>
            {hata && hataKutu(hata)}

            {!superMod ? (
              <div className="field">
                <label>{t('login.kod')}</label>
                <input className="input" value={slug} onChange={(e) => slugDegisti(e.target.value)} placeholder={t('login.kodIpucu')} autoCapitalize="none" spellCheck={false} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 10, marginBottom: 4, background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.25)', fontSize: 12.5, color: 'var(--gold-text)' }}>
                <span style={{ fontSize: 15 }}>🔐</span> Süper Admin Girişi
              </div>
            )}

            <div className="field">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ margin: 0 }}>{t('login.giris')}</label>
                <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', borderRadius: 8, padding: 2 }}>
                  <button type="button" onClick={() => setGirisYontemi('telefon')}
                    style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: girisYontemi === 'telefon' ? 'var(--surface)' : 'transparent',
                      color: girisYontemi === 'telefon' ? 'var(--text)' : 'var(--muted)',
                      fontWeight: girisYontemi === 'telefon' ? 600 : 400 }}>Telefon</button>
                  <button type="button" onClick={() => setGirisYontemi('eposta')}
                    style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: girisYontemi === 'eposta' ? 'var(--surface)' : 'transparent',
                      color: girisYontemi === 'eposta' ? 'var(--text)' : 'var(--muted)',
                      fontWeight: girisYontemi === 'eposta' ? 600 : 400 }}>E-posta</button>
                </div>
              </div>
              {girisYontemi === 'telefon'
                ? <PhoneInput national={telNat} country={telUlke} onNational={setTelNat} onCountry={setTelUlke} />
                : <input className="input" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} placeholder="ornek@mail.com" autoComplete="username" />}
            </div>

            <div className="field" style={{ marginBottom: 8 }}>
              <label>{t('login.sifre')}</label>
              <PasswordInput value={sifre} onChange={setSifre} placeholder="••••••••" autoComplete="current-password" />
            </div>

            {!superMod && (
              <div style={{ textAlign: 'right', marginBottom: 18 }}>
                <button type="button" onClick={sfBaslat}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--gold-text)', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  Şifremi Unuttum?
                </button>
              </div>
            )}

            <button className="btn btn-gold" type="submit" disabled={yukleniyor}
              style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 13, letterSpacing: '.06em' }}>
              {yukleniyor ? <span className="spin" /> : t('login.girisYap')}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--faint)' }}>{t('login.altbilgi')}</div>
          </form>
        )}

        {/* ── Adım 1: Kimlik bilgisi ── */}
        {adim === 'kimlik' && (
          <form onSubmit={kanallarGetir} style={kart}>
            {geriBaslik('Şifre Sıfırlama', () => setAdim('giris'))}
            {sfHata && hataKutu(sfHata)}

            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6, background: 'var(--surface2)', borderRadius: 10, padding: '10px 13px' }}>
              Telefon numaranızı veya e-postanızı girerek devam edin. Size doğrulama kodu göndereceğiz.
            </div>

            <div className="field">
              <label>İşletme Kodu</label>
              <input className="input" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="İşletme kodu" autoCapitalize="none" spellCheck={false} />
            </div>

            <div className="field" style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ margin: 0 }}>Telefon / E-posta</label>
                <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', borderRadius: 8, padding: 2 }}>
                  <button type="button" onClick={() => setSfYontem('telefon')}
                    style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: sfYontem === 'telefon' ? 'var(--surface)' : 'transparent',
                      color: sfYontem === 'telefon' ? 'var(--text)' : 'var(--muted)',
                      fontWeight: sfYontem === 'telefon' ? 600 : 400 }}>Telefon</button>
                  <button type="button" onClick={() => setSfYontem('eposta')}
                    style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: sfYontem === 'eposta' ? 'var(--surface)' : 'transparent',
                      color: sfYontem === 'eposta' ? 'var(--text)' : 'var(--muted)',
                      fontWeight: sfYontem === 'eposta' ? 600 : 400 }}>E-posta</button>
                </div>
              </div>
              {sfYontem === 'telefon'
                ? <PhoneInput national={sfTelNat} country={sfTelUlke} onNational={setSfTelNat} onCountry={setSfTelUlke} />
                : <input className="input" type="email" value={sfEposta} onChange={(e) => setSfEposta(e.target.value)} placeholder="ornek@mail.com" autoComplete="off" />}
            </div>

            <button className="btn btn-gold" type="submit" disabled={sfYukleniyor}
              style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 13 }}>
              {sfYukleniyor ? <span className="spin" /> : 'Devam Et'}
            </button>
          </form>
        )}

        {/* ── Adım 2: Kanal seçimi ── */}
        {adim === 'kanal-sec' && (
          <form onSubmit={otpGonder} style={kart}>
            {geriBaslik('Doğrulama Kanalı', () => setAdim('kimlik'))}
            {sfHata && hataKutu(sfHata)}

            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
              Kod gönderilecek kanalı seçin:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {kanallar.map((k) => {
                const aktif = seciliKanal === k.kod
                return (
                  <button key={k.kod} type="button" onClick={() => setSeciliKanal(k.kod)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                      border: `1.5px solid ${aktif ? 'rgba(201,169,110,.6)' : 'var(--border)'}`,
                      background: aktif ? 'rgba(201,169,110,.08)' : 'var(--surface)',
                      color: aktif ? 'var(--gold-text)' : 'var(--text)' }}>
                    <span style={{ color: aktif ? 'var(--gold)' : 'var(--text2)' }}>{kanalIkon(k.kod)}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: aktif ? 600 : 400 }}>{k.ad}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{k.maske}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', border: `2px solid ${aktif ? 'var(--gold)' : 'var(--border)'}`, background: aktif ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {aktif && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <button className="btn btn-gold" type="submit" disabled={sfYukleniyor || !seciliKanal}
              style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 13 }}>
              {sfYukleniyor ? <span className="spin" /> : 'Kodu Gönder'}
            </button>
          </form>
        )}

        {/* ── Adım 3+4: OTP + Yeni Şifre ── */}
        {adim === 'otp-sifre' && (
          <form onSubmit={otpDogrula} style={kart}>
            {geriBaslik('Kodu Girin', () => setAdim('kanal-sec'))}
            {sfHata && hataKutu(sfHata)}

            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6, background: 'var(--surface2)', borderRadius: 10, padding: '10px 13px' }}>
              {kanallar.find(k => k.kod === seciliKanal)?.maske ?? ''} adresine gönderilen 6 haneli kodu girin. Kod 10 dakika geçerlidir.
            </div>

            <div className="field">
              <label>Doğrulama Kodu</label>
              <input className="input" value={sfOtp} onChange={(e) => setSfOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} inputMode="numeric" autoComplete="one-time-code"
                style={{ fontSize: 22, letterSpacing: '0.3em', textAlign: 'center', fontWeight: 600 }} />
            </div>

            <div style={{ margin: '4px 0 16px', textAlign: 'right' }}>
              <button type="button" onClick={() => { setSfOtp(''); setAdim('kanal-sec') }}
                style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--gold-text)', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                Yeniden gönder
              </button>
            </div>

            <div className="field">
              <label>Yeni Şifre</label>
              <PasswordInput value={sfSifre} onChange={setSfSifre} placeholder="En az 6 karakter" autoComplete="new-password" />
            </div>

            <div className="field" style={{ marginBottom: 22 }}>
              <label>Yeni Şifre (Tekrar)</label>
              <PasswordInput value={sfSifreTekrar} onChange={setSfSifreTekrar} placeholder="••••••••" autoComplete="new-password" />
            </div>

            <button className="btn btn-gold" type="submit" disabled={sfYukleniyor}
              style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 13 }}>
              {sfYukleniyor ? <span className="spin" /> : 'Şifreyi Güncelle'}
            </button>
          </form>
        )}

        {/* ── Başarı ── */}
        {adim === 'basarili' && (
          <div style={kart}>
            <div style={{ textAlign: 'center', padding: '10px 0 24px' }}>
              <CheckCircle2 size={52} style={{ color: 'var(--green)', margin: '0 auto 18px', display: 'block' }} />
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Şifre Güncellendi!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 26 }}>
                Yeni şifrenizle giriş yapabilirsiniz.
              </div>
              <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: 14 }}
                onClick={() => { setAdim('giris'); setGirisYontemi(sfYontem); setTelNat(sfTelNat); setTelUlke(sfTelUlke); setEposta(sfEposta); setSifre('') }}>
                Giriş Yap
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
