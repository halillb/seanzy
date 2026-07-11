import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../store/auth'

const ANAHTAR = 'estetix-karsilama-gun'

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

const MESAJLAR: { baslik: string; mesaj: string }[] = [
  { baslik: 'Harika bir gün seni bekliyor!', mesaj: 'Her müşteri memnuniyeti, salonunun itibarını bir adım daha ileri taşır. Bugün de en iyisini sun.' },
  { baslik: 'Bugün de fark yarat!', mesaj: 'Güzellik sadece dış görünüşle değil, müşterilerin yüzündeki gülümsemeyle ölçülür. Bugün kaç gülümseme katacaksın?' },
  { baslik: 'Başarı küçük adımlarla gelir.', mesaj: 'Her tamamlanan randevu, her memnun müşteri seni hedefe bir adım daha yaklaştırır. Devam et!' },
  { baslik: 'Sen bu işin ustasısın!', mesaj: 'Yılların verdiği deneyim ve tutkuyla bugün de müşterilerine en iyisini sunmaya hazırsın.' },
  { baslik: 'Ekibinle birlikte güçlüsün!', mesaj: 'Güçlü bir ekip, başarılı bir salon demektir. Bugün birlikte harika işler çıkaracaksınız.' },
  { baslik: 'Her gün yeni bir fırsat!', mesaj: 'Dün geride kaldı, yarın henüz gelmedi. Bugünün potansiyelini en iyi şekilde değerlendir.' },
  { baslik: 'Güven, başarının temelidir.', mesaj: 'Müşterilerinizin güvenini kazanmak en büyük başarıdır. Bugün de bu güveni pekiştir.' },
  { baslik: 'Detaylar fark yaratır!', mesaj: 'Küçük dokunuşlar, büyük farklar yaratır. Bugün dikkat ettiğin her detay salonunu öne çıkarır.' },
  { baslik: 'Enerji bulaşıcıdır!', mesaj: 'Senin pozitif enerjin ekibine ve müşterilerine yansır. Bugün o enerjiyi herkese taşı.' },
  { baslik: 'Hedeflerine emin adımlarla yürü!', mesaj: 'Her büyük başarı, kararlı küçük adımların toplamıdır. Bugünkü adımını sağlam at.' },
  { baslik: 'Müşteri mutluluğu her şeydir!', mesaj: 'Kapıdan çıkan her mutlu müşteri, en iyi reklam senin için. Bugün de mutluluk yarat!' },
  { baslik: 'Güzellik bir sanattır!', mesaj: 'Sen sadece hizmet sunmuyorsun; insanların kendilerini daha iyi hissetmesini sağlıyorsun. Bu çok değerli.' },
]

function bugun(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function gosterilmeli(): boolean {
  try {
    const kayitli = localStorage.getItem(ANAHTAR)
    return kayitli !== bugun()
  } catch { return true }
}

function kapat() {
  try { localStorage.setItem(ANAHTAR, bugun()) } catch { /* ignore */ }
}

export default function GunlukKarsilama() {
  const user = useAuth(s => s.user)
  const [acik, setAcik] = useState(false)
  const [mesaj] = useState(() => MESAJLAR[Math.floor(Math.random() * MESAJLAR.length)])

  useEffect(() => {
    const t = setTimeout(() => {
      if (gosterilmeli()) setAcik(true)
    }, 800)
    return () => clearTimeout(t)
  }, [])

  function kapa() {
    kapat()
    setAcik(false)
  }

  if (!acik) return null

  const now = new Date()
  const gun = GUNLER[now.getDay()]
  const gunNo = now.getDate()
  const ay = AYLAR[now.getMonth()]
  const yil = now.getFullYear()
  const saat = now.getHours()
  const selamlama = saat >= 5 && saat < 12 ? 'Günaydın' : saat >= 12 && saat < 17 ? 'İyi günler' : saat >= 17 && saat < 21 ? 'İyi akşamlar' : 'İyi geceler'
  const ad = user?.ad || ''

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
      padding: 20, animation: 'fadeIn .25s ease',
    }} onClick={kapa}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid rgba(201,169,110,.3)',
          borderRadius: 18, padding: '36px 32px', maxWidth: 440, width: '100%',
          position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,.5)',
          animation: 'slideUp .3s ease',
        }}>

        {/* Kapat */}
        <button onClick={kapa} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', padding: 6, borderRadius: 8,
          display: 'flex', alignItems: 'center',
        }}>
          <X size={16} />
        </button>

        {/* Tarih */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, rgba(201,169,110,.18), rgba(201,169,110,.06))',
            border: '1px solid rgba(201,169,110,.25)',
            borderRadius: 12, padding: '10px 22px',
          }}>
            <div style={{ fontSize: 11.5, color: 'var(--gold)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>{gun}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-.01em' }}>{gunNo} {ay}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{yil}</div>
          </div>
        </div>

        {/* Selamlama */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            {selamlama}{ad ? `, ${ad}` : ''}! ✦
          </div>
          <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', margin: '0 auto' }} />
        </div>

        {/* Motivasyon */}
        <div style={{
          background: 'rgba(201,169,110,.06)', borderRadius: 12,
          padding: '16px 18px', marginBottom: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--gold-text)', marginBottom: 8 }}>{mesaj.baslik}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75 }}>{mesaj.mesaj}</div>
        </div>

        <button onClick={kapa} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}>
          Hadi başlayalım!
        </button>
      </div>
    </div>
  )
}
