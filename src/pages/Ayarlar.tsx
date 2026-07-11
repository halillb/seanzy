import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Check, Bell, User, Lock, Phone, MessageSquare, X, CircleDot } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import { apiGet, apiPost } from '../lib/api'
import { useAyar, type Ayar } from '../hooks/useAyar'
import { useAuth } from '../store/auth'
import Select from '../components/Select'
import PasswordInput from '../components/PasswordInput'
import { ENTEGRASYON_ADIMLARI } from '../lib/entegrasyonAdimlari'

type TalepDurum = 'bekliyor' | 'inceleniyor' | 'tamamlandi' | 'reddedildi'
interface Talep { id: number; kanal: 'sms' | 'whatsapp'; durum: TalepDurum; adim: number; sa_not: string | null; created_at: string }
const TALEP_DURUM_AD: Record<TalepDurum, { ad: string; renk: string; bg: string }> = {
  bekliyor:    { ad: 'Talebiniz alındı — bekliyor', renk: 'var(--muted)', bg: 'var(--surface2)' },
  inceleniyor: { ad: 'İnceleniyor',                  renk: '#3B82F6',      bg: 'rgba(59,130,246,.1)' },
  tamamlandi:  { ad: 'Kurulum tamamlandı',           renk: 'var(--green)', bg: 'rgba(74,222,128,.1)' },
  reddedildi:  { ad: 'Reddedildi',                   renk: '#f87171',      bg: 'rgba(248,113,113,.1)' },
}

const SAAT = Array.from({ length: 18 }, (_, i) => i + 6) // 06—23
const DAKIKALAR = [10, 15, 20, 30, 60]

export default function Ayarlar() {
  const qc = useQueryClient()
  const { ayar } = useAyar()
  const user = useAuth(s => s.user)
  const patchUser = useAuth(s => s.patchUser)
  const [f, setF] = useState<Ayar>(ayar)
  const [kayitli, setKayitli] = useState(false)
  const [kanalOk, setKanalOk] = useState(false)
  const [kanallar, setKanallar] = useState<{ email: boolean; sms: boolean; whatsapp: boolean }>({ email: true, sms: false, whatsapp: false })

  useEffect(() => { setF(ayar) }, [ayar.gorBas, ayar.gorBit, ayar.acikBas, ayar.acikBit, ayar.dakika]) // eslint-disable-line

  const set = (k: keyof Ayar, v: number) => { setF((p) => ({ ...p, [k]: v })); setKayitli(false) }

  const m = useMutation({
    mutationFn: () => apiPost('ayar.php', 'kaydet', { ...f }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ayar'] }); setKayitli(true) },
  })

  useQuery({
    queryKey: ['bildirim-kanallar'],
    queryFn: async () => {
      const d = await apiGet<{ email: boolean; sms: boolean; whatsapp: boolean }>('ayar.php', 'bildirim_kanallar')
      setKanallar(d); return d
    },
    staleTime: 60_000,
  })

  const kanalKaydet = useMutation({
    mutationFn: () => apiPost('ayar.php', 'bildirim_kanallar_kaydet', kanallar),
    onSuccess: () => { setKanalOk(true); setTimeout(() => setKanalOk(false), 3000) },
  })

  // Entegrasyon kurulum talepleri (SMS/WhatsApp)
  const { data: taleplerim = [] } = useQuery({
    queryKey: ['taleplerim'],
    queryFn: () => apiGet<Talep[]>('bildirim.php', 'taleplerim'),
    staleTime: 30_000,
  })
  const sonTalep = (kanal: 'sms' | 'whatsapp') => taleplerim.find((t) => t.kanal === kanal) // en yeni ilk sırada (backend created_at desc döner)

  const [talepModal, setTalepModal] = useState<'sms' | 'whatsapp' | null>(null)
  const [talepBilgi, setTalepBilgi] = useState({ isletme_telefon: '', isletme_adi: '', saglayici_tercih: '', not: '' })
  const talepGonder = useMutation({
    mutationFn: () => apiPost('bildirim.php', 'talep_olustur', { kanal: talepModal, bilgi: talepBilgi }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taleplerim'] })
      setTalepModal(null)
      setTalepBilgi({ isletme_telefon: '', isletme_adi: '', saglayici_tercih: '', not: '' })
    },
  })

  // Profil state
  const [profil, setProfil] = useState({ ad: user?.ad || '', soyad: user?.soyad || '', email: (user?.email as string) || '' })
  const [profilOk, setProfilOk] = useState(false)
  const [profilHata, setProfilHata] = useState('')
  const profilM = useMutation({
    mutationFn: () => apiPost('auth.php', 'profil_guncelle', profil),
    onSuccess: () => {
      patchUser({ ad: profil.ad, soyad: profil.soyad || undefined, email: profil.email || undefined })
      setProfilOk(true); setProfilHata(''); setTimeout(() => setProfilOk(false), 3000)
    },
    onError: (e) => setProfilHata((e as Error).message || 'Güncelleme başarısız.'),
  })

  // Şifre değiştir state
  const [sifre, setSifre] = useState({ mevcut: '', yeni: '', tekrar: '' })
  const [sifreOk, setSifreOk] = useState(false)
  const [sifreHata, setSifreHata] = useState('')
  const sifreM = useMutation({
    mutationFn: () => apiPost('auth.php', 'sifre_degistir', { mevcut_sifre: sifre.mevcut, yeni_sifre: sifre.yeni }),
    onSuccess: () => {
      setSifre({ mevcut: '', yeni: '', tekrar: '' })
      setSifreOk(true); setSifreHata(''); setTimeout(() => setSifreOk(false), 3000)
    },
    onError: (e) => setSifreHata((e as Error).message || 'Şifre değiştirilemedi.'),
  })
  function sifreGonder(e: React.FormEvent) {
    e.preventDefault(); setSifreHata('')
    if (sifre.yeni.length < 8) { setSifreHata('Yeni şifre en az 8 karakter olmalıdır.'); return }
    if (sifre.yeni !== sifre.tekrar) { setSifreHata('Yeni şifreler eşleşmiyor.'); return }
    sifreM.mutate()
  }

  const paket = user?.paket_turu ?? 'basic'
  // Pro+ SMS, Enterprise WhatsApp
  const smsMevcut = paket !== 'basic'
  const waMevcut = paket === 'enterprise'

  return (
    <>
      <Topbar title="İşletme Ayarları" subtitle="Takvim ve çalışma düzeni" search={false} />
      <div className="page">
        <div className="panel" style={{ maxWidth: 640, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, fontSize: 15, fontWeight: 500 }}>
            <Clock size={18} style={{ color: 'var(--gold)' }} /> Takvim & Çalışma Saatleri
          </div>
          <div className="form-grid">
            <div className="field" style={{ margin: 0 }}><label>Takvim Görünür Başlangıç</label>
              <Select className="input" value={f.gorBas} onChange={(e) => set('gorBas', +e.target.value)}>{SAAT.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select></div>
            <div className="field" style={{ margin: 0 }}><label>Takvim Görünür Bitiş</label>
              <Select className="input" value={f.gorBit} onChange={(e) => set('gorBit', +e.target.value)}>{SAAT.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select></div>
            <div className="field" style={{ margin: 0 }}><label>Çalışma Başlangıcı</label>
              <Select className="input" value={f.acikBas} onChange={(e) => set('acikBas', +e.target.value)}>{SAAT.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select></div>
            <div className="field" style={{ margin: 0 }}><label>Çalışma Bitişi</label>
              <Select className="input" value={f.acikBit} onChange={(e) => set('acikBit', +e.target.value)}>{SAAT.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select></div>
            <div className="field full" style={{ margin: 0 }}><label>Randevu Aralığı (dakika)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                {DAKIKALAR.map((d) => (
                  <button type="button" key={d} onClick={() => set('dakika', d)}
                    style={{ fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', padding: '8px 16px', borderRadius: 9,
                      background: f.dakika === d ? 'rgba(201,169,110,.16)' : 'var(--surface)', color: f.dakika === d ? 'var(--gold-text)' : 'var(--text2)',
                      border: `1px solid ${f.dakika === d ? 'rgba(201,169,110,.45)' : 'var(--border)'}` }}>{d} dk</button>
                ))}
              </div></div>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 16, lineHeight: 1.6 }}>
            Görünür aralık takvimde gösterilen saatleri belirler. Çalışma saati dışı <b>flu</b> görünür ama yine de randevu açılabilir.
            Randevu aralığı, takvimdeki tırnak çizgilerini ve boş slota tıklarken yuvarlamayı belirler. <b>Tüm kullanıcılarda ortaktır.</b>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button className="btn btn-gold" disabled={m.isPending} onClick={() => m.mutate()}>
              {m.isPending ? <span className="spin" /> : 'Kaydet'}
            </button>
            {kayitli && <span style={{ fontSize: 12.5, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={15} /> Kaydedildi</span>}
          </div>
        </div>

        {/* Profil Bilgileri */}
        <div className="panel" style={{ maxWidth: 640, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, fontSize: 15, fontWeight: 500 }}>
            <User size={18} style={{ color: 'var(--gold)' }} /> Hesap Bilgileri
          </div>
          {profilHata && <div className="form-err" style={{ marginBottom: 14 }}>{profilHata}</div>}
          <div className="form-grid">
            <div className="field" style={{ margin: 0 }}><label>Ad</label>
              <input className="input" value={profil.ad} onChange={e => setProfil(p => ({ ...p, ad: e.target.value }))} /></div>
            <div className="field" style={{ margin: 0 }}><label>Soyad</label>
              <input className="input" value={profil.soyad} onChange={e => setProfil(p => ({ ...p, soyad: e.target.value }))} /></div>
            <div className="field" style={{ margin: 0 }}><label>Telefon (değiştirilemez)</label>
              <input className="input" value={user?.telefon as string || ''} readOnly style={{ opacity: .6, cursor: 'not-allowed' }} /></div>
            <div className="field" style={{ margin: 0 }}><label>E-posta</label>
              <input className="input" type="email" value={profil.email} onChange={e => setProfil(p => ({ ...p, email: e.target.value }))} placeholder="ornek@eposta.com" /></div>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
            E-posta, "Şifremi Unuttum" akışında OTP göndermek için kullanılır.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button className="btn btn-gold" disabled={profilM.isPending} onClick={() => profilM.mutate()}>
              {profilM.isPending ? <span className="spin" /> : 'Kaydet'}
            </button>
            {profilOk && <span style={{ fontSize: 12.5, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={15} /> Kaydedildi</span>}
          </div>
        </div>

        {/* Şifre Değiştir */}
        <div className="panel" style={{ maxWidth: 640, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, fontSize: 15, fontWeight: 500 }}>
            <Lock size={18} style={{ color: 'var(--gold)' }} /> Şifre Değiştir
          </div>
          <form onSubmit={sifreGonder}>
            {sifreHata && <div className="form-err" style={{ marginBottom: 14 }}>{sifreHata}</div>}
            <div className="form-grid">
              <div className="field full" style={{ margin: 0 }}><label>Mevcut Şifre</label>
                <PasswordInput value={sifre.mevcut} onChange={v => setSifre(p => ({ ...p, mevcut: v }))} autoComplete="current-password" /></div>
              <div className="field" style={{ margin: 0 }}><label>Yeni Şifre</label>
                <PasswordInput value={sifre.yeni} onChange={v => setSifre(p => ({ ...p, yeni: v }))} autoComplete="new-password" placeholder="En az 8 karakter" /></div>
              <div className="field" style={{ margin: 0 }}><label>Yeni Şifre (tekrar)</label>
                <PasswordInput value={sifre.tekrar} onChange={v => setSifre(p => ({ ...p, tekrar: v }))} autoComplete="new-password" /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button type="submit" className="btn btn-gold" disabled={sifreM.isPending}>
                {sifreM.isPending ? <span className="spin" /> : 'Şifreyi Değiştir'}
              </button>
              {sifreOk && <span style={{ fontSize: 12.5, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={15} /> Değiştirildi</span>}
            </div>
          </form>
        </div>

        {/* Bildirim Kanalları */}
        <div className="panel" style={{ maxWidth: 640, padding: 24, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6, fontSize: 15, fontWeight: 500 }}>
            <Bell size={18} style={{ color: 'var(--gold)' }} /> Bildirim Kanalları
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Bu kanallar yalnızca "Şifremi Unuttum" için değil, <b>müşteri bildirimleri</b> (randevu hatırlatma, onay, iptal vb.) ve diğer tüm
            otomatik iletişimler için de kullanılır. E-posta her zaman zorunludur. SMS ve WhatsApp için önce kurulum yapılması gerekir —
            aşağıdan etkinleştirmek istediğinizde gerekli bilgileri girip kurulum talebinde bulunabilirsiniz.
          </p>

          {[
            { k: 'email' as const, ad: 'E-posta', aciklama: 'Her zaman aktif, devre dışı bırakılamaz', zorunlu: true, mevcut: true },
            { k: 'sms' as const, ad: 'SMS', aciklama: smsMevcut ? 'Paketiniz uygun — kurulum tamamlanmadıysa aşağıdan talep açın' : 'Bu özellik Pro ve üzeri paketlerde kullanılabilir', zorunlu: false, mevcut: smsMevcut },
            { k: 'whatsapp' as const, ad: 'WhatsApp', aciklama: waMevcut ? 'Paketiniz uygun — kurulum tamamlanmadıysa aşağıdan talep açın' : 'Bu özellik Enterprise paketinde kullanılabilir', zorunlu: false, mevcut: waMevcut },
          ].map(({ k, ad, aciklama, zorunlu, mevcut }) => {
            const talep = k !== 'email' ? sonTalep(k as 'sms' | 'whatsapp') : undefined
            const kuruluTamamlandi = zorunlu || talep?.durum === 'tamamlandi'
            return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: mevcut ? 'var(--text)' : 'var(--faint)' }}>{ad}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{aciklama}</div>
                {talep && !kuruluTamamlandi && (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, marginTop: 6, display: 'inline-block', color: TALEP_DURUM_AD[talep.durum].renk, background: TALEP_DURUM_AD[talep.durum].bg }}>
                      {TALEP_DURUM_AD[talep.durum].ad}
                    </span>
                    {talep.durum !== 'reddedildi' && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {ENTEGRASYON_ADIMLARI[talep.kanal].map((etiket, i) => {
                          const tamam = i < talep.adim || (i === talep.adim && talep.durum === 'tamamlandi')
                          const suAn = i === talep.adim && talep.durum !== 'tamamlandi'
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: tamam ? 'var(--text)' : suAn ? 'var(--gold-text)' : 'var(--faint)' }}>
                              {tamam ? <Check size={12} style={{ color: 'var(--green)', flexShrink: 0 }} /> : suAn ? <CircleDot size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--border)', flexShrink: 0, display: 'inline-block' }} />}
                              <span style={{ fontWeight: suAn ? 600 : 400 }}>{etiket}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {talep.sa_not && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, background: 'var(--surface2)', borderRadius: 8, padding: '7px 11px', lineHeight: 1.5 }}>
                        <b>Süper admin notu:</b> {talep.sa_not}
                      </div>
                    )}
                  </>
                )}
              </div>
              <button type="button" disabled={zorunlu || !mevcut}
                onClick={() => {
                  if (zorunlu || !mevcut) return
                  if (kuruluTamamlandi) { setKanallar(p => ({ ...p, [k]: !p[k] })); return }
                  if (!kanallar[k] && !talep) setTalepModal(k as 'sms' | 'whatsapp') // henüz kurulmamış + talep yok → talep aç
                }}
                style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: zorunlu || !mevcut ? 'not-allowed' : 'pointer',
                  background: kanallar[k] && mevcut ? 'var(--gold)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0, opacity: !mevcut ? 0.4 : 1 }}>
                <div style={{ position: 'absolute', top: 3, left: (kanallar[k] && mevcut) ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </button>
            </div>
            )
          })}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button className="btn btn-gold" disabled={kanalKaydet.isPending} onClick={() => kanalKaydet.mutate()}>
              {kanalKaydet.isPending ? <span className="spin" /> : 'Kaydet'}
            </button>
            {kanalOk && <span style={{ fontSize: 12.5, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={15} /> Kaydedildi</span>}
          </div>
        </div>
      </div>

      <Modal open={!!talepModal} onClose={() => setTalepModal(null)} title={`${talepModal === 'sms' ? 'SMS' : 'WhatsApp'} Kurulum Talebi`} maxWidth={440}>
        <div className="modal-b">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, background: 'var(--surface2)', borderRadius: 10, padding: '10px 13px', marginBottom: 16 }}>
            {talepModal === 'sms' ? <Phone size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--gold)' }} /> : <MessageSquare size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--gold)' }} />}
            {talepModal === 'sms'
              ? <span>Aşağıdaki bilgileri gönderin, süper admin talebinizi inceleyip sizinle iletişime geçecek. <b>Şifre veya hesap bilgisi istemiyoruz</b> — sadece işletme iletişim bilgileri yeterli.</span>
              : <span>WhatsApp Business kurulumu <b>Meta Business Manager</b> üzerinden yapılır — şifre paylaşmanıza gerek yok. Talebiniz onaylandığında süper admin sizden Business Manager'a "ortak" olarak eklemenizi isteyecek (rol bazlı, geri alınabilir erişim).</span>}
          </div>
          <div className="form-grid">
            <div className="field full" style={{ margin: 0 }}><label>İşletme Telefonu</label>
              <input className="input" value={talepBilgi.isletme_telefon} onChange={(e) => setTalepBilgi((p) => ({ ...p, isletme_telefon: e.target.value }))} placeholder="0532 000 00 00" /></div>
            {talepModal === 'whatsapp' && (
              <div className="field full" style={{ margin: 0 }}><label>WhatsApp Business İşletme Adı</label>
                <input className="input" value={talepBilgi.isletme_adi} onChange={(e) => setTalepBilgi((p) => ({ ...p, isletme_adi: e.target.value }))} placeholder="Salon Adınız" /></div>
            )}
            {talepModal === 'sms' && (
              <div className="field full" style={{ margin: 0 }}><label>Sağlayıcı Tercihi (opsiyonel)</label>
                <input className="input" value={talepBilgi.saglayici_tercih} onChange={(e) => setTalepBilgi((p) => ({ ...p, saglayici_tercih: e.target.value }))} placeholder="Netgsm, İletimerkezi vb. (bilmiyorsanız boş bırakın)" /></div>
            )}
            <div className="field full" style={{ margin: 0 }}><label>Not (opsiyonel)</label>
              <textarea className="input" rows={2} value={talepBilgi.not} onChange={(e) => setTalepBilgi((p) => ({ ...p, not: e.target.value }))} placeholder="Eklemek istediğiniz bir şey var mı?" /></div>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={() => setTalepModal(null)}><X size={14} /> İptal</button>
          <button className="btn btn-gold" disabled={talepGonder.isPending} onClick={() => talepGonder.mutate()}>
            {talepGonder.isPending ? <span className="spin" /> : 'Talep Gönder'}
          </button>
        </div>
      </Modal>
    </>
  )
}
