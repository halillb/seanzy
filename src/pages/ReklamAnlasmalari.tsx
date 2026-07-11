import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, Tag, Percent } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import InfluencerForm, { type Influencer } from '../components/InfluencerForm'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet } from '../lib/api'

const komisyonMetin = (i: Influencer) => {
  if (!i.komisyon_deger) return '—'
  return i.komisyon_tip === 'sabit' ? `${Number(i.komisyon_deger).toLocaleString('tr-TR')} ₺ / müşteri` : `%${i.komisyon_deger}`
}

export default function ReklamAnlasmalari() {
  const erisim = useErisim('reklam')
  const [ekle, setEkle] = useState(false)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['influencerlar'],
    queryFn: () => apiGet<Influencer[]>('influencer.php', 'liste'),
  })

  if (!erisim) return <><Topbar title="Reklam Anlaşmaları" subtitle="Influencer & kampanya takibi" search={false} /><PaketEngeli ozellik="reklam" /></>

  return (
    <>
      <Topbar title="Reklam Anlaşmaları" subtitle={data ? `${data.length} influencer / anlaşma` : 'Yükleniyor…'} search={false} cta="Influencer" onCta={() => setEkle(true)} />
      <Modal open={ekle} onClose={() => setEkle(false)} title="Yeni Influencer / Anlaşma">
        <InfluencerForm onClose={() => setEkle(false)} />
      </Modal>
      <div className="page">
        {isError && <div className="panel" style={{ textAlign: 'center', color: 'var(--red)', padding: 40 }}>{(error as Error)?.message}</div>}
        {!isLoading && !isError && (data ?? []).length === 0 && (
          <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 56 }}>
            <Megaphone size={30} style={{ opacity: 0.4, marginBottom: 10 }} /><br />
            Henüz influencer/reklam anlaşması yok. Sağ üstten ekleyebilirsin.
          </div>
        )}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
          {isLoading && [...Array(4)].map((_, i) => <div key={i} className="card" style={{ height: 130, opacity: 0.5 }} />)}
          {!isLoading && (data ?? []).map((i) => (
            <div key={i.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="mic" style={{ width: 42, height: 42, marginBottom: 0, background: 'rgba(201,169,110,.14)', color: 'var(--gold)' }}><Megaphone size={20} /></div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>{i.ad}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{[i.platform, i.kullanici_adi].filter(Boolean).join(' · ') || '—'}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text2)' }}>
                  <Tag size={14} style={{ color: 'var(--muted)' }} />{i.kod || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text2)' }}>
                  <Percent size={14} style={{ color: 'var(--muted)' }} />{komisyonMetin(i)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
