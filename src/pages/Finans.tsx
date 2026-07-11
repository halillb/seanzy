import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Coins, Trash2, Receipt } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import FinansForm from '../components/FinansForm'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import { trTarih } from '../lib/tarih'

interface Ozet { toplam_gelir: number | string; toplam_gider: number | string; net: number | string }
interface Hareket {
  id: number; tip: 'gelir' | 'gider'; kategori?: string
  tutar: number | string; aciklama?: string; tarih?: string; otomatik?: boolean
}
const tl = (n: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'

export default function Finans() {
  const erisim = useErisim('finans')
  const qc = useQueryClient()
  const [ekle, setEkle] = useState(false)
  const ozet = useQuery({ queryKey: ['finans-ozet'], queryFn: () => apiGet<Ozet>('finans.php', 'ozet', { donem: 'ay' }) })
  const liste = useQuery({ queryKey: ['finans-liste'], queryFn: () => apiGet<Hareket[]>('finans.php', 'liste') })
  const sil = useMutation({
    mutationFn: (id: number) => apiPost('finans.php', 'sil', { id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finans-liste'] }); qc.invalidateQueries({ queryKey: ['finans-ozet'] }) },
  })

  if (!erisim) return <><Topbar title="Finans" subtitle="Gelir & gider takibi" search={false} /><PaketEngeli ozellik="finans" /></>

  return (
    <>
      <Topbar title="Finans" subtitle="Bu ay özeti" search={false} cta="İşlem" onCta={() => setEkle(true)} />
      <Modal open={ekle} onClose={() => setEkle(false)} title="Gelir / Gider Ekle" maxWidth={460}>
        <FinansForm onClose={() => setEkle(false)} />
      </Modal>
      <div className="page">
        <div className="metric-grid">
          <div className="card metric">
            <div className="mic" style={{ background: 'rgba(46,204,113,.13)', color: 'var(--green)' }}><TrendingUp size={18} /></div>
            <div className="mlbl">Bu Ay Gelir</div>
            <div className="mval" style={{ color: 'var(--green)' }}>{ozet.data ? tl(ozet.data.toplam_gelir) : '…'}</div>
          </div>
          <div className="card metric">
            <div className="mic" style={{ background: 'rgba(231,76,60,.13)', color: '#ff8a7d' }}><TrendingDown size={18} /></div>
            <div className="mlbl">Bu Ay Gider</div>
            <div className="mval" style={{ color: '#ff8a7d' }}>{ozet.data ? tl(ozet.data.toplam_gider) : '…'}</div>
          </div>
          <div className="card metric">
            <div className="mic" style={{ background: 'rgba(201,169,110,.14)', color: 'var(--gold)' }}><Coins size={18} /></div>
            <div className="mlbl">Net</div>
            <div className="mval">{ozet.data ? tl(ozet.data.net) : '…'}</div>
          </div>
          <div className="card metric">
            <div className="mic" style={{ background: 'rgba(100,149,237,.13)', color: '#6495ED' }}><Receipt size={18} /></div>
            <div className="mlbl">Toplam Kayıt</div>
            <div className="mval" style={{ color: '#6495ED' }}>{liste.data?.length ?? '…'}</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-h"><div className="panel-t">Son İşlemler</div></div>
          {liste.isLoading && [...Array(4)].map((_, i) => <div key={i} style={{ height: 40, borderRadius: 8, background: 'var(--surface3)', opacity: 0.4, marginBottom: 8 }} />)}
          {liste.isError && <div style={{ textAlign: 'center', color: 'var(--red)', padding: 30 }}>{(liste.error as Error)?.message}</div>}
          {!liste.isLoading && !liste.isError && (liste.data ?? []).length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Henüz gelir-gider kaydı yok.</div>
          )}
          {(liste.data ?? []).map((h) => {
            const gelir = h.tip === 'gelir'
            return (
              <div key={h.id} className="row">
                <div className="mic" style={{ width: 34, height: 34, marginBottom: 0, background: gelir ? 'rgba(46,204,113,.13)' : 'rgba(231,76,60,.13)', color: gelir ? 'var(--green)' : '#ff8a7d' }}>
                  {gelir ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="row-main">
                  <div className="row-title">{h.aciklama || h.kategori || '—'}{h.otomatik && <span className="badge badge-muted" style={{ marginLeft: 7, fontSize: 10 }}>otomatik</span>}</div>
                  <div className="row-sub">{trTarih(h.tarih)}{h.kategori ? ` · ${h.kategori}` : ''}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: gelir ? 'var(--green)' : '#ff8a7d' }}>
                  {gelir ? '+' : '−'}{tl(h.tutar)}
                </div>
                {!h.otomatik && (
                  <button className="icon-btn" style={{ width: 30, height: 30 }} title="Sil"
                    onClick={async () => { if (await confirmAsync({ message: 'Kayıt silinsin mi?', tehlikeli: true, onaylaMetin: 'Sil' })) sil.mutate(h.id) }}><Trash2 size={14} /></button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
