import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Mail, MessageSquare, Phone, Check, Eye, EyeOff, AlertTriangle, Send, X, Zap } from 'lucide-react'
import Topbar from '../components/Topbar'
import { apiGet, apiPost } from '../lib/api'
import Select from '../components/Select'

interface EmailCfg {
  aktif: boolean; tip: 'mail' | 'smtp' | 'brevo_api'
  smtp_host: string; smtp_port: number; smtp_sifrele: 'tls' | 'ssl' | 'none'
  smtp_user: string; smtp_sifre: string; smtp_from: string; smtp_from_ad: string
  brevo_api_key: string
}
interface SmsCfg {
  aktif: boolean
  provider: 'netgsm' | 'iletimerkezi' | 'twilio' | 'messagebird' | 'diger'
  netgsm_kullanici: string; netgsm_sifre: string; netgsm_baslik: string
  iletimerkezi_api_key: string; iletimerkezi_baslik: string
  twilio_account_sid: string; twilio_auth_token: string; twilio_from: string
  messagebird_api_key: string; messagebird_from: string
  diger_url: string; diger_method: string
  diger_telefon_alan: string; diger_mesaj_alan: string
  diger_api_key: string; diger_api_key_alan: string
}
interface WaCfg { aktif: boolean; phone_number_id: string; access_token: string }
interface PushCfg { aktif: boolean; app_id: string; api_key: string }
interface EnteCfg { email: EmailCfg; sms: SmsCfg; whatsapp: WaCfg; push: PushCfg }

const DEF_EMAIL: EmailCfg = {
  aktif: true, tip: 'mail', smtp_host: '', smtp_port: 587, smtp_sifrele: 'tls',
  smtp_user: '', smtp_sifre: '', smtp_from: '', smtp_from_ad: 'Seanzy', brevo_api_key: '',
}
const DEF_SMS: SmsCfg = {
  aktif: false, provider: 'netgsm',
  netgsm_kullanici: '', netgsm_sifre: '', netgsm_baslik: 'Seanzy',
  iletimerkezi_api_key: '', iletimerkezi_baslik: 'Seanzy',
  twilio_account_sid: '', twilio_auth_token: '', twilio_from: '',
  messagebird_api_key: '', messagebird_from: 'Seanzy',
  diger_url: '', diger_method: 'POST', diger_telefon_alan: 'to',
  diger_mesaj_alan: 'message', diger_api_key: '', diger_api_key_alan: 'api_key',
}
const DEF_WA: WaCfg = { aktif: false, phone_number_id: '', access_token: '' }
const DEF_PUSH: PushCfg = { aktif: false, app_id: '', api_key: '' }

const SMS_PROVIDERS = [
  { k: 'netgsm',       ad: 'Netgsm' },
  { k: 'iletimerkezi', ad: 'İletimerkezi' },
  { k: 'twilio',       ad: 'Twilio' },
  { k: 'messagebird',  ad: 'MessageBird' },
  { k: 'diger',        ad: 'Diğer (Özel)' },
]

// ── Bağımsız sub-component'ler – render'da yeniden tanımlanmaz ───────────

function Baslik({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12, marginTop: 24 }}>
      {label}
    </div>
  )
}

function Alan({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field" style={{ margin: 0 }}>
      <label>{label}</label>
      {children}
    </div>
  )
}

function SifreAlan({ label, value, onChange, alan, gizli, onToggle }: {
  label: string; value: string; onChange: (v: string) => void
  alan: string; gizli: Record<string, boolean>; onToggle: (alan: string) => void
}) {
  const gizliMi = !gizli[alan]
  return (
    <div className="field" style={{ margin: 0 }}>
      {label && <label>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input className="input" type={gizliMi ? 'password' : 'text'} value={value}
          onChange={e => onChange(e.target.value)} placeholder="••••••••"
          style={{ paddingRight: 38 }} autoComplete="new-password" />
        <button type="button" onClick={() => onToggle(alan)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 0 }}>
          {gizliMi ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      </div>
    </div>
  )
}

function TestKutusu({ placeholder, label, hedef, setHedef, onTest, isPending }: {
  kanal?: string; placeholder: string; label: string
  hedef: string; setHedef: (v: string) => void; onTest: () => void; isPending: boolean
}) {
  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>Test Gönder</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input className="input" value={hedef} onChange={e => setHedef(e.target.value)}
          placeholder={placeholder} style={{ flex: 1, fontSize: 13 }} />
        <button type="button" className="btn btn-ghost" disabled={isPending || !hedef.trim()}
          onClick={onTest} style={{ gap: 7, flexShrink: 0 }}>
          {isPending ? <span className="spin" /> : <><Send size={13} /> {label}</>}
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
        Kaydetmeden önce bağlantıyı doğrulamak için test mesajı gönder.
      </div>
    </div>
  )
}

function AktifToggle({ aktif, onChange, label }: { aktif: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: aktif ? 'rgba(201,169,110,.08)' : 'var(--surface)', border: `1px solid ${aktif ? 'rgba(201,169,110,.3)' : 'var(--border)'}`, marginBottom: 20 }}>
      <button type="button" onClick={() => onChange(!aktif)}
        style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: aktif ? 'var(--gold)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: aktif ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </button>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: aktif ? 'var(--gold-text)' : 'var(--text2)' }}>{label}</span>
    </div>
  )
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    style={{ color: 'var(--gold)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
    {children}
  </a>
)

// Ekran görüntüsü simülatörü – gerçek UI'ı yansıtan stilize önizleme
function EkranOnizleme({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: '10px 0 4px', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', fontSize: 11.5 }}>
      <div style={{ background: '#2a2a2e', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c840', display: 'inline-block' }} />
        <span style={{ color: '#888', fontSize: 10, marginLeft: 4 }}>developers.facebook.com</span>
      </div>
      <div style={{ background: 'var(--surface)', padding: '10px 12px', lineHeight: 1.6, color: 'var(--text2)' }}>
        {children}
      </div>
    </div>
  )
}

const WA_ADIMLAR: { no: number; baslik: string; icerik: React.ReactNode; detay: React.ReactNode; onizleme?: React.ReactNode; vurgulu?: boolean }[] = [
  {
    no: 1,
    baslik: 'Meta Developer Hesabı Aç',
    icerik: <><A href="https://developers.facebook.com">developers.facebook.com</A> adresine git ve Facebook hesabınla giriş yap. Sağ üstten <b>"My Apps"</b> → <b>"Create App"</b> tıkla.</>,
    detay: <>App Name: <b>"Seanzy"</b> yaz. Use case olarak <b>"Connect with customers through WhatsApp"</b> seç. İş portföyü seç veya yeni oluştur.</>,
    onizleme: (
      <EkranOnizleme>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>M</div>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Meta for Developers</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, background: '#1877f2', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>My Apps ▼</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>→ <b>Create App</b> → Use Cases → <b>Connect with customers through WhatsApp</b> ✓</div>
      </EkranOnizleme>
    ),
  },
  {
    no: 2,
    baslik: 'WhatsApp Ürününü Ekle',
    icerik: <>Uygulama Pano'sunda <b>"WhatsApp üzerinden müşterilerle bağlantı kurma"</b> satırına tıkla → <b>"API ile entegre edin"</b> seç → Devam et.</>,
    detay: <>Sol menüde <b>Basic Setup → Step 1. Try it out</b> bölümüne gel.</>,
    onizleme: (
      <EkranOnizleme>
        <div style={{ fontSize: 11 }}>
          <div style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(37,211,102,.1)', border: '1px solid rgba(37,211,102,.3)', marginBottom: 4 }}>
            ✓ <b>WhatsApp üzerinden müşterilerle bağlantı kurma</b> <span style={{ float: 'right' }}>›</span>
          </div>
          <div style={{ color: 'var(--muted)', paddingLeft: 4 }}>Entegrasyon türü: <b>API ile entegre edin</b> (mavi buton seçili)</div>
        </div>
      </EkranOnizleme>
    ),
  },
  {
    no: 3,
    baslik: 'Test Numarası & Token Al',
    icerik: <>Step 1 sayfasında Meta sana ücretsiz bir test numarası verir (<b>+1 555 152-5822</b>). <b>"Token oluştur"</b> butonuna bas.</>,
    detay: <><b>Phone Number ID</b> ve <b>Access Token</b> değerlerini kopyala. Bu token <b>24 saat</b> geçerlidir – kalıcı token için 6. adıma bak.</>,
    onizleme: (
      <EkranOnizleme>
        <div style={{ fontSize: 11 }}>
          <div style={{ marginBottom: 4 }}>Test numarası: <b>+1 (555) 152-5822</b></div>
          <div style={{ marginBottom: 4 }}>Telefon Numarası Kimliği: <b style={{ fontFamily: 'monospace' }}>1220187724507378</b> ğŸ“‹</div>
          <div style={{ marginBottom: 6 }}>WhatsApp İşletme Hesabı Kimliği: <b style={{ fontFamily: 'monospace' }}>1919009998651402</b> ğŸ“‹</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ flex: 1, background: 'rgba(0,0,0,.15)', borderRadius: 4, padding: '3px 8px', fontFamily: 'monospace', color: 'var(--muted)' }}>EAAXoJHnjdj... (token)</span>
            <span style={{ background: '#1877f2', color: '#fff', borderRadius: 4, padding: '3px 8px', fontSize: 10 }}>Token oluştur</span>
          </div>
        </div>
      </EkranOnizleme>
    ),
  },
  {
    no: 4,
    baslik: 'Alıcı Numara Ekle (Test İçin)',
    icerik: <><b>"Alıcı numarasını seçin"</b> → <b>"Telefon numarası ekle"</b> → kendi numaranı gir (<b>905XXXXXXXXX</b> formatı). WhatsApp'a onay kodu gelir.</>,
    detay: <>Test modunda sadece bu listedeki numaralara mesaj gönderebilirsin (max 5 numara). Üretim için 6. adıma bak.</>,
    onizleme: (
      <EkranOnizleme>
        <div style={{ fontSize: 11 }}>
          <div style={{ marginBottom: 4 }}>Alıcı: <b>+90 505 995 48 71</b> ✓ <span style={{ color: 'var(--muted)', fontSize: 10 }}>(onaylandı)</span></div>
          <div style={{ color: 'var(--muted)' }}>Mesaj: Sipariş Onayı şablonu → <span style={{ background: '#1877f2', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>Mesaj gönder</span></div>
        </div>
      </EkranOnizleme>
    ),
  },
  {
    no: 5,
    baslik: 'Phone Number ID ve Token\'ı Buraya Gir',
    icerik: <>Aşağıdaki <b>Phone Number ID</b> ve <b>Access Token</b> alanlarını doldur → <b>Kaydet</b> → <b>Test WhatsApp mesajı gönder</b>.</>,
    detay: <>Test numarası gönderirken alıcıyı uluslararası formatta gir: <b>+905XXXXXXXXX</b> veya <b>905XXXXXXXXX</b>. Mesaj gelmezse önce alıcı numarasının 4. adımda eklendiğinden emin ol.</>,
    vurgulu: true,
  },
  {
    no: 6,
    baslik: 'Kalıcı Token – Üretim İçin',
    icerik: <><A href="https://business.facebook.com">business.facebook.com</A> → Ayarlar → <b>Sistem Kullanıcıları</b> → <b>"Yeni sistem kullanıcısı ekle"</b> → Admin rolü seç.</>,
    detay: <>Oluşturulan sistem kullanıcısına uygulamanı ekle → <b>"Token oluştur"</b> → asla sona ermeyen token al. Gerçek iş numaranı bağlamak için Meta Developer sayfasındaki <b>"Adım 2. Üretim kurulumu"</b>nu tamamla. WhatsApp numaranın başka bir hesapta kayıtlı olmaması gerekir.</>,
    onizleme: (
      <EkranOnizleme>
        <div style={{ fontSize: 11 }}>
          <div style={{ marginBottom: 4 }}><b>Meta Business Suite</b> → Ayarlar → Kullanıcılar → <b>Sistem Kullanıcıları</b></div>
          <div style={{ color: 'var(--muted)' }}>Sistem Kullanıcısı: Seanzy Admin (Admin) → Varlıklar ekle → Uygulama: Seanzy → <b>Token oluştur</b> (süresiz)</div>
        </div>
      </EkranOnizleme>
    ),
  },
]

function WaKurulumRehberi() {
  const [acik, setAcik] = useState(false)
  return (
    <div style={{ marginBottom: 20, borderRadius: 12, border: '1px solid rgba(37,211,102,.25)', overflow: 'hidden' }}>
      <button type="button" onClick={() => setAcik(p => !p)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(37,211,102,.06)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>
          <MessageSquare size={15} style={{ color: '#25d366' }} />
          WhatsApp Kurulum Rehberi – Adım Adım
        </span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{acik ? '▲ Kapat' : '▼ Göster'}</span>
      </button>
      {acik && (
        <div style={{ padding: '4px 16px 16px' }}>
          {WA_ADIMLAR.map((a) => (
            <div key={a.no} style={{ display: 'flex', gap: 14, paddingTop: 16, paddingBottom: 16, borderBottom: a.no < WA_ADIMLAR.length ? '1px solid var(--border)' : 'none' }}>
              <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: a.vurgulu ? 'var(--gold)' : 'rgba(37,211,102,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: a.vurgulu ? '#000' : '#25d366', marginTop: 1 }}>
                {a.no}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: a.vurgulu ? 'var(--gold-text)' : 'var(--text1)', marginBottom: 4 }}>{a.baslik}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 4 }}>{a.icerik}</div>
                {a.onizleme}
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, background: 'var(--surface)', borderRadius: 8, padding: '6px 10px', marginTop: a.onizleme ? 6 : 0 }}>{a.detay}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────

export default function SuperAdminEntegrasyonlar() {
  const [sekme, setSekme] = useState<'email' | 'sms' | 'whatsapp' | 'push'>('email')
  const [cfg, setCfg] = useState<EnteCfg>({ email: DEF_EMAIL, sms: DEF_SMS, whatsapp: DEF_WA, push: DEF_PUSH })
  const [gizli, setGizli] = useState<Record<string, boolean>>({})
  const [ok, setOk] = useState(false)
  const [testSonuc, setTestSonuc] = useState<{ kanal: string; basarili: boolean; mesaj: string } | null>(null)
  const [testHedef, setTestHedef] = useState('')
  const initialized = useRef(false)

  const { data } = useQuery({
    queryKey: ['sa-entegrasyon'],
    queryFn: () => apiGet<EnteCfg>('superadmin.php', 'entegrasyon_getir'),
    staleTime: Infinity,
  })

  useEffect(() => {
    if (data && !initialized.current) {
      initialized.current = true
      setCfg({
        email:    { ...DEF_EMAIL,    ...(data.email    || {}) },
        sms:      { ...DEF_SMS,      ...(data.sms      || {}) },
        whatsapp: { ...DEF_WA,       ...(data.whatsapp || {}) },
        push:     { ...DEF_PUSH,     ...(data.push     || {}) },
      })
    }
  }, [data])

  const kaydet = useMutation({
    mutationFn: () => apiPost('superadmin.php', 'entegrasyon_kaydet', { entegrasyon: cfg }),
    onSuccess: () => { setOk(true); setTimeout(() => setOk(false), 3000) },
  })

  const testGonder = useMutation({
    mutationFn: ({ kanal, hedef }: { kanal: string; hedef: string }) =>
      apiPost<{ basarili: boolean; mesaj: string }>('superadmin.php', 'entegrasyon_test', { kanal, hedef }),
    onSuccess: (d, vars) => { setTestSonuc({ kanal: vars.kanal, basarili: d.basarili, mesaj: d.mesaj }) },
    onError: (e, vars) => { setTestSonuc({ kanal: vars.kanal, basarili: false, mesaj: (e as Error).message }) },
  })

  const setE = (k: keyof EmailCfg, v: unknown) =>
    setCfg(p => ({ ...p, email: { ...p.email, [k]: v } }))
  const setS = (k: keyof SmsCfg, v: unknown) =>
    setCfg(p => ({ ...p, sms: { ...p.sms, [k]: v } }))
  const setW = (k: keyof WaCfg, v: unknown) =>
    setCfg(p => ({ ...p, whatsapp: { ...p.whatsapp, [k]: v } }))
  const setP = (k: keyof PushCfg, v: unknown) =>
    setCfg(p => ({ ...p, push: { ...p.push, [k]: v } }))

  const toggleGizli = (alan: string) => setGizli(p => ({ ...p, [alan]: !p[alan] }))

  const sekmeIkon = { email: Mail, sms: Phone, whatsapp: MessageSquare, push: Zap }
  const sekmeAd   = { email: 'E-posta', sms: 'SMS', whatsapp: 'WhatsApp', push: 'Push' }

  return (
    <>
      <Topbar title="Entegrasyonlar" subtitle="Genel varsayılan yapılandırma — tüm işletmeler için" search={false} />
      <div className="page">
        <div style={{ maxWidth: 660 }}>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.25)', borderRadius: 12, padding: '14px 16px', marginBottom: 24, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            <AlertTriangle size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
            <span>Buradaki ayarlar <b>genel varsayılandır</b> — bir işletmenin kendine özel kaydı yoksa bu ayar kullanılır. E-posta ve SMS için tipik kullanım budur (tek sağlayıcı, tüm işletmeler paylaşır). <b>WhatsApp genelde işletme başınadır</b> — her salon kendi numarasıyla mesaj göndermeli; bunun için buradan değil, <b>Entegrasyon Talepleri</b> sayfasından o işletmeye özel kurulum yapılır.</span>
          </div>

          <div className="panel" style={{ padding: 0 }}>
            {/* Sekmeler */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              {(['email', 'sms', 'whatsapp', 'push'] as const).map((s) => {
                const Ikon = sekmeIkon[s]
                const ak = sekme === s
                return (
                  <button key={s} type="button" onClick={() => setSekme(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 16px', fontSize: 13, fontWeight: ak ? 600 : 400, fontFamily: 'inherit', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${ak ? 'var(--gold)' : 'transparent'}`, color: ak ? 'var(--gold-text)' : 'var(--text2)', transition: 'all .15s', marginBottom: -1 }}>
                    <Ikon size={15} /> {sekmeAd[s]}
                  </button>
                )
              })}
            </div>

            <div style={{ padding: '20px 24px 28px' }}>

              {/* Test sonuç bandı */}
              {testSonuc && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: testSonuc.basarili ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)',
                  border: `1px solid ${testSonuc.basarili ? 'rgba(74,222,128,.3)' : 'rgba(248,113,113,.3)'}` }}>
                  {testSonuc.basarili ? <Check size={15} style={{ color: 'var(--green)', flexShrink: 0 }} /> : <X size={15} style={{ color: '#f87171', flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, color: testSonuc.basarili ? 'var(--green)' : '#f87171', flex: 1 }}>{testSonuc.mesaj}</span>
                  <button type="button" onClick={() => setTestSonuc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}><X size={14} /></button>
                </div>
              )}

              {/* ── E-posta ── */}
              {sekme === 'email' && (
                <>
                  <AktifToggle aktif={cfg.email.aktif} onChange={v => setE('aktif', v)} label="E-posta doğrulamayı aktif et" />

                  {cfg.email.aktif && (
                    <>
                      <Baslik label="Gönderim Yöntemi" />
                      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                        {[
                          { k: 'mail',      ad: 'PHP mail() – Basit' },
                          { k: 'smtp',      ad: 'SMTP – Özel Sunucu' },
                          { k: 'brevo_api', ad: '⚡ Brevo API – Hızlı' },
                        ].map(({ k, ad }) => (
                          <button key={k} type="button" onClick={() => setE('tip', k)}
                            style={{ flex: 1, minWidth: 140, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, border: `1.5px solid ${cfg.email.tip === k ? 'rgba(201,169,110,.5)' : 'var(--border)'}`, background: cfg.email.tip === k ? 'rgba(201,169,110,.08)' : 'var(--surface)', color: cfg.email.tip === k ? 'var(--gold-text)' : 'var(--text2)', fontWeight: cfg.email.tip === k ? 600 : 400 }}>
                            {ad}
                          </button>
                        ))}
                      </div>

                      {cfg.email.tip === 'brevo_api' && (
                        <>
                          <div style={{ fontSize: 12.5, color: 'var(--text2)', background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, lineHeight: 1.65 }}>
                            Brevo HTTP API üzerinden gönderir – GoDaddy gibi SMTP portlarını engelleyen hostinglerde <b>1-3 saniyede</b> teslim eder. API key almak için: <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>app.brevo.com</a> → ⚙️ → SMTP ve API → API Anahtarları → "Yeni API anahtarı oluştur"
                          </div>
                          <div className="form-grid">
                            <SifreAlan label="Brevo API Key" value={cfg.email.brevo_api_key} onChange={v => setE('brevo_api_key', v)} alan="brevo_api_key" gizli={gizli} onToggle={toggleGizli} />
                            <Alan label="Gönderen E-posta">
                              <input className="input" value={cfg.email.smtp_from} onChange={e => setE('smtp_from', e.target.value)} placeholder="info@homedya.com" autoComplete="off" />
                            </Alan>
                            <Alan label="Gönderen Adı">
                              <input className="input" value={cfg.email.smtp_from_ad} onChange={e => setE('smtp_from_ad', e.target.value)} placeholder="Seanzy" />
                            </Alan>
                          </div>
                        </>
                      )}

                      {cfg.email.tip === 'smtp' && (
                        <div className="form-grid">
                          <Alan label="SMTP Host">
                            <input className="input" value={cfg.email.smtp_host} onChange={e => setE('smtp_host', e.target.value)} placeholder="smtp.gmail.com" autoComplete="off" />
                          </Alan>
                          <Alan label="Port">
                            <input className="input" type="number" value={cfg.email.smtp_port} onChange={e => setE('smtp_port', +e.target.value)} placeholder="587" />
                          </Alan>
                          <Alan label="Şifreleme">
                            <Select className="input" value={cfg.email.smtp_sifrele} onChange={e => setE('smtp_sifrele', e.target.value)}>
                              <option value="tls">TLS (önerilen)</option>
                              <option value="ssl">SSL</option>
                              <option value="none">Yok</option>
                            </Select>
                          </Alan>
                          <Alan label="Kullanıcı Adı">
                            <input className="input" value={cfg.email.smtp_user} onChange={e => setE('smtp_user', e.target.value)} placeholder="user@domain.com" autoComplete="off" />
                          </Alan>
                          <SifreAlan label="SMTP Şifre" value={cfg.email.smtp_sifre} onChange={v => setE('smtp_sifre', v)} alan="smtp_sifre" gizli={gizli} onToggle={toggleGizli} />
                          <Alan label="Gönderen E-posta">
                            <input className="input" value={cfg.email.smtp_from} onChange={e => setE('smtp_from', e.target.value)} placeholder="noreply@isletme.com" autoComplete="off" />
                          </Alan>
                          <Alan label="Gönderen Adı">
                            <input className="input" value={cfg.email.smtp_from_ad} onChange={e => setE('smtp_from_ad', e.target.value)} placeholder="Seanzy" />
                          </Alan>
                        </div>
                      )}

                      {cfg.email.tip === 'mail' && (
                        <div style={{ fontSize: 12.5, color: 'var(--text2)', background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', lineHeight: 1.65 }}>
                          Hosting sunucusunun <b>mail()</b> fonksiyonu kullanılır. Hosting panelinizden (cPanel) e-posta ayarlarını yapılandırmanız yeterlidir. Ek bir kurulum gerektirmez.
                        </div>
                      )}

                      <TestKutusu kanal="email" placeholder="test@eposta.com" label="Test e-postası gönder"
                        hedef={testHedef} setHedef={setTestHedef}
                        onTest={() => testGonder.mutate({ kanal: 'email', hedef: testHedef })}
                        isPending={testGonder.isPending} />
                    </>
                  )}
                </>
              )}

              {/* ── SMS ── */}
              {sekme === 'sms' && (
                <>
                  <AktifToggle aktif={cfg.sms.aktif} onChange={v => setS('aktif', v)} label="SMS doğrulamayı aktif et" />

                  {cfg.sms.aktif && (
                    <>
                      <Baslik label="SMS Sağlayıcı" />
                      <div style={{ marginBottom: 20 }}>
                        <Select className="input" value={cfg.sms.provider} onChange={e => setS('provider', e.target.value)}>
                          {SMS_PROVIDERS.map(p => <option key={p.k} value={p.k}>{p.ad}</option>)}
                        </Select>
                      </div>

                      {cfg.sms.provider === 'netgsm' && (
                        <div className="form-grid">
                          <Alan label="Netgsm Kullanıcı Adı">
                            <input className="input" value={cfg.sms.netgsm_kullanici} onChange={e => setS('netgsm_kullanici', e.target.value)} placeholder="API kullanıcı adı" autoComplete="off" />
                          </Alan>
                          <SifreAlan label="Netgsm Şifre" value={cfg.sms.netgsm_sifre} onChange={v => setS('netgsm_sifre', v)} alan="netgsm_sifre" gizli={gizli} onToggle={toggleGizli} />
                          <Alan label="SMS Başlığı (max 11 karakter)">
                            <input className="input" value={cfg.sms.netgsm_baslik} onChange={e => setS('netgsm_baslik', e.target.value.slice(0, 11))} placeholder="Seanzy" />
                          </Alan>
                        </div>
                      )}

                      {cfg.sms.provider === 'iletimerkezi' && (
                        <div className="form-grid">
                          <SifreAlan label="API Key" value={cfg.sms.iletimerkezi_api_key} onChange={v => setS('iletimerkezi_api_key', v)} alan="ili_api_key" gizli={gizli} onToggle={toggleGizli} />
                          <Alan label="Gönderici Adı">
                            <input className="input" value={cfg.sms.iletimerkezi_baslik} onChange={e => setS('iletimerkezi_baslik', e.target.value)} placeholder="Seanzy" />
                          </Alan>
                        </div>
                      )}

                      {cfg.sms.provider === 'twilio' && (
                        <div className="form-grid">
                          <Alan label="Account SID">
                            <input className="input" value={cfg.sms.twilio_account_sid} onChange={e => setS('twilio_account_sid', e.target.value)} placeholder="ACxxxxxxxxxxxxxxxx" autoComplete="off" />
                          </Alan>
                          <SifreAlan label="Auth Token" value={cfg.sms.twilio_auth_token} onChange={v => setS('twilio_auth_token', v)} alan="twilio_token" gizli={gizli} onToggle={toggleGizli} />
                          <Alan label="Gönderen Numara (+1XXX...)">
                            <input className="input" value={cfg.sms.twilio_from} onChange={e => setS('twilio_from', e.target.value)} placeholder="+1XXXXXXXXXX" />
                          </Alan>
                        </div>
                      )}

                      {cfg.sms.provider === 'messagebird' && (
                        <div className="form-grid">
                          <SifreAlan label="API Key" value={cfg.sms.messagebird_api_key} onChange={v => setS('messagebird_api_key', v)} alan="mb_api" gizli={gizli} onToggle={toggleGizli} />
                          <Alan label="Gönderici (Originator)">
                            <input className="input" value={cfg.sms.messagebird_from} onChange={e => setS('messagebird_from', e.target.value)} placeholder="Seanzy" />
                          </Alan>
                        </div>
                      )}

                      {cfg.sms.provider === 'diger' && (
                        <>
                          <div className="form-grid">
                            <Alan label="API URL">
                              <input className="input" value={cfg.sms.diger_url} onChange={e => setS('diger_url', e.target.value)} placeholder="https://api.sms-provider.com/send" autoComplete="off" />
                            </Alan>
                            <Alan label="HTTP Metodu">
                              <Select className="input" value={cfg.sms.diger_method} onChange={e => setS('diger_method', e.target.value)}>
                                <option value="POST">POST</option>
                                <option value="GET">GET</option>
                              </Select>
                            </Alan>
                            <Alan label="Telefon Alan Adı">
                              <input className="input" value={cfg.sms.diger_telefon_alan} onChange={e => setS('diger_telefon_alan', e.target.value)} placeholder="to" />
                            </Alan>
                            <Alan label="Mesaj Alan Adı">
                              <input className="input" value={cfg.sms.diger_mesaj_alan} onChange={e => setS('diger_mesaj_alan', e.target.value)} placeholder="message" />
                            </Alan>
                            <Alan label="API Key Alan Adı (opsiyonel)">
                              <input className="input" value={cfg.sms.diger_api_key_alan} onChange={e => setS('diger_api_key_alan', e.target.value)} placeholder="api_key" />
                            </Alan>
                            <SifreAlan label="API Key Değeri" value={cfg.sms.diger_api_key} onChange={v => setS('diger_api_key', v)} alan="diger_api_key" gizli={gizli} onToggle={toggleGizli} />
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
                            Telefon numarası uluslararası formatta (905XXXXXXXXX) gönderilir. İstek body JSON olarak iletilir.
                          </div>
                        </>
                      )}

                      <TestKutusu kanal="sms" placeholder="05XXXXXXXXX" label="Test SMS gönder"
                        hedef={testHedef} setHedef={setTestHedef}
                        onTest={() => testGonder.mutate({ kanal: 'sms', hedef: testHedef })}
                        isPending={testGonder.isPending} />
                    </>
                  )}
                </>
              )}

              {/* ── WhatsApp ── */}
              {sekme === 'whatsapp' && (
                <>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>
                    <MessageSquare size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--gold)' }} />
                    <span>WhatsApp genelde <b>işletme başına</b> kurulur — her salon kendi numarasıyla mesaj gönderir. Salona özel kurulum için <b>Entegrasyon Talepleri</b> sayfasını kullanın. Buradaki ayar, hiçbir işletmeye özel kayıt olmadığında kullanılacak <b>ortak yedek numaradır</b> (isteğe bağlı, genelde kapalı bırakılır).</span>
                  </div>
                  <AktifToggle aktif={cfg.whatsapp.aktif} onChange={v => setW('aktif', v)} label="Ortak yedek WhatsApp numarasını aktif et" />

                  {cfg.whatsapp.aktif && (
                    <>
                      {/* Kurulum Rehberi */}
                      <WaKurulumRehberi />

                      <div className="form-grid">
                        <Alan label="Phone Number ID">
                          <input className="input" value={cfg.whatsapp.phone_number_id} onChange={e => setW('phone_number_id', e.target.value)} placeholder="1234567890" autoComplete="off" />
                        </Alan>
                        <SifreAlan label="Access Token" value={cfg.whatsapp.access_token} onChange={v => setW('access_token', v)} alan="wa_token" gizli={gizli} onToggle={toggleGizli} />
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.6 }}>
                        ⚠️ Token 24 saatte bir sona erer. Kalıcı token için aşağıdaki rehberin 6. adımına bakın.
                      </div>

                      <TestKutusu kanal="whatsapp" placeholder="05XXXXXXXXX" label="Test WhatsApp mesajı gönder"
                        hedef={testHedef} setHedef={setTestHedef}
                        onTest={() => testGonder.mutate({ kanal: 'whatsapp', hedef: testHedef })}
                        isPending={testGonder.isPending} />
                    </>
                  )}
                </>
              )}

              {/* ── Push (OneSignal) — yedek kanal, tüm işletmeler için tek/ortak ── */}
              {sekme === 'push' && (
                <>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>
                    Sekme kapalı/arka plandayken bile anlık bildirim ulaştırmak için <b>OneSignal</b> entegrasyonu — <b>yedek/opsiyonel</b> bir kanaldır,
                    yalnızca bir tarayıcı web push hizmeti tüm işletmeler için <b>tek ve ortak</b> olabildiğinden burada, süper admin panelinde yönetilir.
                    App ID + REST API Key girip aktif etmediğiniz sürece hiçbir etkisi yoktur.
                  </div>
                  <AktifToggle aktif={cfg.push.aktif} onChange={v => setP('aktif', v)} label="Push bildirimlerini aktif et" />

                  {cfg.push.aktif && (
                    <div className="form-grid">
                      <Alan label="OneSignal App ID">
                        <input className="input" value={cfg.push.app_id} onChange={e => setP('app_id', e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" />
                      </Alan>
                      <SifreAlan label="REST API Key" value={cfg.push.api_key} onChange={v => setP('api_key', v)} alan="push_api_key" gizli={gizli} onToggle={toggleGizli} />
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 10, alignItems: 'center' }}>
            {ok && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--green)' }}>
                <Check size={15} /> Kaydedildi
              </span>
            )}
            <button className="btn btn-gold" disabled={kaydet.isPending} onClick={() => kaydet.mutate()}
              style={{ padding: '11px 28px' }}>
              {kaydet.isPending ? <span className="spin" /> : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
