import { useState, useEffect } from 'react'
import { useAuth } from '../store/auth'

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

function selamlama(saat: number): string {
  if (saat >= 5 && saat < 12) return 'Günaydın'
  if (saat >= 12 && saat < 17) return 'İyi günler'
  if (saat >= 17 && saat < 21) return 'İyi akşamlar'
  return 'İyi geceler'
}

export default function KarsilamaBar() {
  const user = useAuth(s => s.user)
  const [simdi, setSimdi] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setSimdi(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const saat = simdi.getHours()
  const dakika = String(simdi.getMinutes()).padStart(2, '0')
  const saniye = String(simdi.getSeconds()).padStart(2, '0')
  const gun = GUNLER[simdi.getDay()]
  const gun_no = simdi.getDate()
  const ay = AYLAR[simdi.getMonth()]
  const yil = simdi.getFullYear()
  const ad = user?.ad || 'Hoş geldiniz'

  return (
    <div className="karsilama-bar" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 16px', borderBottom: '1px solid var(--border)',
      background: 'rgba(201,169,110,.04)', flexShrink: 0,
      flexWrap: 'wrap', gap: 4,
    }}>
      <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>
        <span style={{ color: 'var(--gold-text)', fontWeight: 600 }}>{selamlama(saat)}</span>
        {', '}
        <span style={{ fontWeight: 500 }}>{ad}</span>
        {'! ✦'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text2)', fontVariantNumeric: 'tabular-nums', letterSpacing: '.01em', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="kb-gun">{gun},</span>
        <span>{gun_no} {ay}</span>
        <span className="kb-yil" style={{ color: 'var(--muted)' }}>{yil}</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span style={{ color: 'var(--gold-text)', fontWeight: 600 }}>
          {String(saat).padStart(2, '0')}:{dakika}
        </span>
        <span className="kb-saniye" style={{ color: 'var(--faint)', fontSize: 11 }}>:{saniye}</span>
      </span>
    </div>
  )
}
