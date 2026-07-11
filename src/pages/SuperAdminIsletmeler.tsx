import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Users, UserCheck, CalendarDays, Search } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import IsletmeForm from '../components/IsletmeForm'
import IsletmeDuzenle from '../components/IsletmeDuzenle'
import { apiGet } from '../lib/api'
import { trTarih } from '../lib/tarih'

interface Isletme {
  id: number; isletme_adi: string; slug: string; telefon?: string; paket_turu?: string
  durum: boolean; mod: string; abonelik_bitis?: string; musteri_say: number; personel_say: number; randevu_say: number; created_at?: string
}
const PAKET_RENK: Record<string, string> = { basic: 'badge-muted', pro: 'badge-gold', enterprise: 'badge-green' }
export const MOD_BILGI: Record<string, { ad: string; cls: string }> = {
  aktif: { ad: 'Aktif', cls: 'badge-green' },
  kisitli: { ad: 'Kısıtlı', cls: 'badge-gold' },
  kapali: { ad: 'Kapalı', cls: 'badge-red' },
}

export default function SuperAdminIsletmeler() {
  const [q, setQ] = useState('')
  const [yeni, setYeni] = useState(false)
  const [duzenleId, setDuzenleId] = useState<number | null>(null)
  const liste = useQuery({ queryKey: ['sa-isletmeler'], queryFn: () => apiGet<Isletme[]>('superadmin.php', 'isletmeler') })

  const data = useMemo(() => {
    const arr = liste.data ?? []
    if (!q.trim()) return arr
    const t = q.toLocaleLowerCase('tr')
    return arr.filter((i) => `${i.isletme_adi} ${i.slug} ${i.telefon || ''}`.toLocaleLowerCase('tr').includes(t))
  }, [liste.data, q])

  const aktifSay = (liste.data ?? []).filter((i) => i.mod === 'aktif').length

  return (
    <>
      <Topbar title="İşletmeler" subtitle={liste.data ? `${liste.data.length} işletme · ${aktifSay} aktif` : 'Yükleniyor…'} search={false} cta="İşletme" onCta={() => setYeni(true)} />
      <Modal open={yeni} onClose={() => setYeni(false)} title="Yeni İşletme" maxWidth={520}><IsletmeForm onClose={() => setYeni(false)} /></Modal>
      <Modal open={duzenleId != null} onClose={() => setDuzenleId(null)} title="İşletme Yönetimi" maxWidth={520}>
        {duzenleId != null && <IsletmeDuzenle id={duzenleId} onClose={() => setDuzenleId(null)} />}
      </Modal>
      <div className="page">
        <div style={{ position: 'relative', maxWidth: 320, width: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input className="input" style={{ padding: '9px 12px 9px 34px' }} placeholder="İşletme / kod / telefon ara…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {liste.isLoading && <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>{[...Array(4)].map((_, i) => <div key={i} className="card" style={{ height: 150, opacity: 0.5 }} />)}</div>}
        {!liste.isLoading && data.length === 0 && <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 46 }}>İşletme bulunamadı.</div>}

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
          {data.map((i) => (
            <div key={i.id} className="card" style={{ opacity: i.mod === 'kapali' ? 0.55 : 1, cursor: 'pointer' }} onClick={() => setDuzenleId(i.id)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <div className="bell-ic" style={{ background: 'rgba(201,169,110,.12)', color: 'var(--gold)', width: 38, height: 38 }}><Building2 size={19} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.isletme_adi}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>kod: {i.slug}{i.telefon ? ` · ${i.telefon}` : ''}</div>
                </div>
                <span className={`badge ${PAKET_RENK[i.paket_turu || ''] || 'badge-muted'}`}>{i.paket_turu || '—'}</span>
              </div>

              <div style={{ display: 'flex', gap: 14, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Users size={13} />{i.musteri_say} müşteri</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><UserCheck size={13} />{i.personel_say} personel</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><CalendarDays size={13} />{i.randevu_say} rndv</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>{i.abonelik_bitis ? `Abonelik: ${trTarih(i.abonelik_bitis)}` : i.created_at ? `Kayıt: ${trTarih(i.created_at)}` : ''}</span>
                <span className={`badge ${(MOD_BILGI[i.mod] || MOD_BILGI.aktif).cls}`}>{(MOD_BILGI[i.mod] || MOD_BILGI.aktif).ad}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
