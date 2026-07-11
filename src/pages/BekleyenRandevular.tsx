import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X, Clock, User, Phone, Scissors, Globe, Inbox } from 'lucide-react'
import Topbar from '../components/Topbar'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import { trTarihGun, trSaat } from '../lib/tarih'
import { useT } from '../lib/ceviri'

interface Bekleyen {
  id: number; musteri_ad?: string; musteri_tel?: string; personel_ad?: string
  hizmet_ad?: string; tarih?: string; baslangic?: string; bitis?: string
  fiyat?: number | string; created_at?: string
}
const tl = (n?: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'

export default function BekleyenRandevular() {
  const qc = useQueryClient()
  const t = useT()
  const liste = useQuery({ queryKey: ['bekleyen'], queryFn: () => apiGet<Bekleyen[]>('randevu.php', 'bekleyen_liste') })
  const m = useMutation({
    mutationFn: (v: { id: number; durum: string }) => apiPost('randevu.php', 'durum_guncelle', v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bekleyen'] }); qc.invalidateQueries({ queryKey: ['randevular'] }) },
  })
  const data = liste.data ?? []

  return (
    <>
      <Topbar title={t('bk.baslik')} subtitle={liste.data ? `${data.length} ${t('bk.onayBekliyor')}` : '…'} search={false} />
      <div className="page">
        {liste.isLoading && <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))' }}>{[...Array(3)].map((_, i) => <div key={i} className="card" style={{ height: 150, opacity: 0.5 }} />)}</div>}

        {!liste.isLoading && data.length === 0 && (
          <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 56 }}>
            <Inbox size={34} style={{ opacity: 0.4, marginBottom: 10 }} /><br />
            {t('bk.yok')}
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))' }}>
          {data.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Globe size={12} /> Online</span>
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>{r.created_at}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <Sat ic={<Clock size={14} />} a={`${trTarihGun(r.tarih)} · ${trSaat(r.baslangic)}${r.bitis ? '–' + trSaat(r.bitis) : ''}`} vurgu />
                <Sat ic={<Scissors size={14} />} a={r.hizmet_ad || '—'} b={r.personel_ad ? `Personel: ${r.personel_ad}` : undefined} />
                <Sat ic={<User size={14} />} a={r.musteri_ad || '—'} b={r.musteri_tel} ic2={<Phone size={11} />} />
                {!!Number(r.fiyat) && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold-text)', marginTop: 2 }}>{tl(r.fiyat)}</div>}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} disabled={m.isPending}
                  onClick={() => m.mutate({ id: r.id, durum: 'onaylandi' })}><Check size={15} /> {t('eylem.onayla')}</button>
                <button className="btn" style={{ flex: 1, justifyContent: 'center', color: '#ff8a7d' }} disabled={m.isPending}
                  onClick={async () => { if (await confirmAsync(t('bk.reddetOnay'))) m.mutate({ id: r.id, durum: 'iptal' }) }}><X size={15} /> {t('eylem.reddet')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Sat({ ic, a, b, vurgu, ic2 }: { ic: React.ReactNode; a: string; b?: string; vurgu?: boolean; ic2?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ color: 'var(--muted)', display: 'flex' }}>{ic}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: vurgu ? 600 : 500, color: vurgu ? 'var(--text)' : 'var(--text)', textTransform: vurgu ? 'capitalize' : 'none' }}>{a}</div>
        {b && <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>{ic2}{b}</div>}
      </div>
    </div>
  )
}
