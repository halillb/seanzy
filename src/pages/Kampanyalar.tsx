import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Plus, Percent, Search, Edit2 } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet, apiPost } from '../lib/api'

interface Musteri {
  id: number; ad: string; soyad?: string; telefon?: string
  email?: string; indirim?: number | string; kaynak?: string
}


export default function Kampanyalar() {
  const erisim = useErisim('kampanyalar')
  const qc = useQueryClient()
  const [ara, setAra] = useState('')
  const [secili, setSecili] = useState<Musteri | null>(null)
  const [yeniIndirim, setYeniIndirim] = useState('')
  const [hata, setHata] = useState('')

  const musteriler = useQuery({
    queryKey: ['musteriler'],
    queryFn: () => apiGet<Musteri[]>('musteri.php', 'liste'),
  })

  const guncelleMut = useMutation({
    mutationFn: (d: { id: number; indirim: number }) =>
      apiPost('musteri.php', 'guncelle', { id: d.id, indirim: d.indirim }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['musteriler'] })
      setSecili(null)
    },
    onError: (e) => setHata((e as Error).message || 'Güncelleme başarısız.'),
  })

  const liste = (musteriler.data ?? []).filter((m) => {
    const q = ara.toLowerCase()
    return !q || `${m.ad} ${m.soyad || ''} ${m.telefon || ''}`.toLowerCase().includes(q)
  })

  // İndirim alan müşteri sayısı
  const indirimliSayi = (musteriler.data ?? []).filter((m) => Number(m.indirim || 0) > 0).length

  function kaydet() {
    setHata('')
    const v = Number(yeniIndirim)
    if (isNaN(v) || v < 0 || v > 100) { setHata('0-100 arası bir değer gir.'); return }
    guncelleMut.mutate({ id: secili!.id, indirim: v })
  }

  function indirimAc(m: Musteri) {
    setSecili(m)
    setYeniIndirim(String(m.indirim ?? 0))
    setHata('')
  }

  if (!erisim) return <><Topbar title="Kampanyalar" subtitle="Müşteri bazlı indirim yönetimi" search={false} /><PaketEngeli ozellik="kampanyalar" /></>

  return (
    <>
      <Topbar title="Kampanyalar" subtitle="Müşteri bazlı indirim yönetimi" search={false} />
      <div className="page">

        {/* Özet */}
        <div className="metric-grid">
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div className="bell-ic" style={{ width: 36, height: 36, background: 'rgba(201,169,110,.13)', color: 'var(--gold)' }}><Tag size={18} /></div>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>İndirimli Müşteri</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)' }}>{indirimliSayi}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Toplam {(musteriler.data ?? []).length} müşteriden</div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div className="bell-ic" style={{ width: 36, height: 36, background: 'rgba(59,130,246,.13)', color: '#3B82F6' }}><Percent size={18} /></div>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Ort. İndirim</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#3B82F6' }}>
              {indirimliSayi > 0
                ? `%${Math.round((musteriler.data ?? []).filter((m) => Number(m.indirim || 0) > 0).reduce((s, m) => s + Number(m.indirim || 0), 0) / indirimliSayi)}`
                : '%0'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>İndirimli müşterilerin ortalaması</div>
          </div>
        </div>

        {/* Arama + Liste */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <input
              className="input"
              style={{ border: 'none', padding: 0, background: 'transparent', fontSize: 13, flex: 1 }}
              placeholder="İsim veya telefon ara..."
              value={ara}
              onChange={(e) => setAra(e.target.value)}
            />
          </div>

          {musteriler.isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Yükleniyor…</div>
          ) : liste.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Müşteri bulunamadı.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Müşteri', 'Telefon', 'İndirim', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.03em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liste.map((m) => {
                  const ind = Number(m.indirim || 0)
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500 }}>{m.ad} {m.soyad || ''}</div>
                        {m.email && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{m.email}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{m.telefon || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {ind > 0 ? (
                          <span className="badge badge-gold">%{ind}</span>
                        ) : (
                          <span style={{ color: 'var(--faint)', fontSize: 12 }}>İndirim yok</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => indirimAc(m)} style={{ padding: '5px 10px', gap: 5 }}>
                          <Edit2 size={12} /> Düzenle
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={!!secili} onClose={() => setSecili(null)} title="Müşteri İndirimi" maxWidth={380}>
        {secili && (
          <>
            <div className="modal-b">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{secili.ad} {secili.soyad || ''}</div>
              {hata && <div className="form-err" style={{ marginBottom: 12 }}>{hata}</div>}
              <div className="field" style={{ margin: 0 }}>
                <label>İndirim Oranı (%)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={yeniIndirim}
                  onChange={(e) => setYeniIndirim(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
                  0 = indirim yok · 100 = ücretsiz
                </div>
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-ghost" onClick={() => setSecili(null)}>İptal</button>
              <button className="btn btn-gold" disabled={guncelleMut.isPending} onClick={kaydet}>
                {guncelleMut.isPending ? <span className="spin" /> : <><Plus size={14} /> Kaydet</>}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
