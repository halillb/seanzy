import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Zap, MessageCircle, CheckCircle2 } from 'lucide-react'
import Topbar from '../components/Topbar'
import { apiGet, apiPost } from '../lib/api'
import { trTarih } from '../lib/tarih'

interface Talep {
  id: number
  konu: string
  ozellik_kodu: string | null
  durum: 'acik' | 'yanitlandi' | 'kapatildi'
  oncelikli: boolean
  isletme_adi?: string
  created_at: string
  updated_at: string
}
interface Mesaj {
  id: number
  gonderen_tip: string
  gonderen_id: number
  mesaj: string
  created_at: string
}

const DURUM_ETIKET: Record<string, { ad: string; renk: string }> = {
  acik: { ad: 'Açık', renk: '#E67E22' },
  yanitlandi: { ad: 'Yanıtlandı', renk: '#3FA76A' },
  kapatildi: { ad: 'Kapatıldı', renk: 'var(--faint)' },
}

export default function SuperAdminDestek() {
  const qc = useQueryClient()
  const [seciliId, setSeciliId] = useState<number | null>(null)
  const [filtre, setFiltre] = useState<'hepsi' | 'acik' | 'yanitlandi' | 'kapatildi'>('hepsi')
  const [mesajMetni, setMesajMetni] = useState('')

  const { data: talepler = [] } = useQuery<Talep[]>({
    queryKey: ['sa-destek-taleplerim'],
    queryFn: () => apiGet<Talep[]>('bildirim.php', 'destek_taleplerim'),
    staleTime: 10_000,
    refetchInterval: 15_000,
  })

  const gorunenler = filtre === 'hepsi' ? talepler : talepler.filter((t) => t.durum === filtre)
  const secili = talepler.find((t) => t.id === seciliId) || null

  const { data: detay } = useQuery<{ talep: Talep; mesajlar: Mesaj[] }>({
    queryKey: ['sa-destek-mesajlar', seciliId],
    queryFn: () => apiGet('bildirim.php', 'destek_mesajlar', { talep_id: seciliId ?? undefined }),
    enabled: !!seciliId,
    refetchInterval: secili?.oncelikli ? 4000 : 10000,
  })

  const gonderMut = useMutation({
    mutationFn: () => apiPost('bildirim.php', 'destek_mesaj_gonder', { talep_id: seciliId, mesaj: mesajMetni }),
    onSuccess: () => {
      setMesajMetni('')
      qc.invalidateQueries({ queryKey: ['sa-destek-mesajlar', seciliId] })
      qc.invalidateQueries({ queryKey: ['sa-destek-taleplerim'] })
    },
  })

  const kapatMut = useMutation({
    mutationFn: () => apiPost('bildirim.php', 'destek_talep_kapat', { talep_id: seciliId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-destek-taleplerim'] })
      qc.invalidateQueries({ queryKey: ['sa-destek-mesajlar', seciliId] })
    },
  })

  return (
    <>
      <Topbar title="Destek Talepleri" subtitle="Tüm işletmelerin destek/canlı destek talepleri" search={false} />
      <div className="page" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['hepsi', 'acik', 'yanitlandi', 'kapatildi'] as const).map((f) => (
              <button key={f} onClick={() => setFiltre(f)}
                className="btn btn-sm" style={{ background: filtre === f ? 'var(--gold)' : 'var(--surface2)', color: filtre === f ? '#0c0c0d' : 'var(--text2)' }}>
                {f === 'hepsi' ? 'Hepsi' : DURUM_ETIKET[f].ad}
              </button>
            ))}
          </div>
          {gorunenler.length === 0 && (
            <div className="panel" style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Talep yok.</div>
          )}
          {gorunenler.map((t) => (
            <div key={t.id} onClick={() => setSeciliId(t.id)}
              className="panel" style={{ padding: '12px 14px', cursor: 'pointer', border: seciliId === t.id ? '1.5px solid var(--gold)' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                {t.oncelikli && <Zap size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.konu}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--gold-text)', marginBottom: 3 }}>{t.isletme_adi}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ color: DURUM_ETIKET[t.durum].renk }}>{DURUM_ETIKET[t.durum].ad}</span>
                <span style={{ color: 'var(--faint)' }}>· {trTarih(t.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="panel" style={{ padding: 0, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          {!secili ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 10, padding: 40 }}>
              <MessageCircle size={28} style={{ opacity: .4 }} />
              <div style={{ fontSize: 13 }}>Bir talep seçin.</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {secili.oncelikli && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--gold-text)', background: 'rgba(201,169,110,.15)', borderRadius: 20, padding: '3px 9px' }}>
                    <Zap size={11} /> Canlı Destek
                  </span>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{secili.konu}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{secili.isletme_adi}</div>
                </div>
                {secili.durum !== 'kapatildi' && (
                  <button className="btn btn-sm btn-ghost" onClick={() => kapatMut.mutate()} disabled={kapatMut.isPending}>
                    <CheckCircle2 size={13} /> Kapat
                  </button>
                )}
              </div>
              <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 440, overflowY: 'auto' }}>
                {(detay?.mesajlar ?? []).map((m) => {
                  const ben = m.gonderen_tip === 'superadmin'
                  return (
                    <div key={m.id} style={{ alignSelf: ben ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      <div style={{ background: ben ? 'var(--gold)' : 'var(--surface2)', color: ben ? '#0c0c0d' : 'var(--text)', borderRadius: 14, padding: '9px 13px', fontSize: 13.5, lineHeight: 1.5 }}>
                        {m.mesaj}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--faint)', marginTop: 3, textAlign: ben ? 'right' : 'left' }}>
                        {ben ? 'Siz' : 'İşletme'} · {trTarih(m.created_at)}
                      </div>
                    </div>
                  )
                })}
              </div>
              {secili.durum !== 'kapatildi' && (
                <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input className="input" placeholder="Yanıtınızı yazın…" value={mesajMetni}
                    onChange={(e) => setMesajMetni(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && mesajMetni.trim()) gonderMut.mutate() }}
                    style={{ flex: 1 }} />
                  <button className="btn btn-gold" disabled={!mesajMetni.trim() || gonderMut.isPending} onClick={() => gonderMut.mutate()}>
                    <Send size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
