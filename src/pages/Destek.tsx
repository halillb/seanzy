import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Plus, Zap, MessageCircle, X, CheckCircle2 } from 'lucide-react'
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

export default function Destek() {
  const loc = useLocation()
  const qc = useQueryClient()
  const [seciliId, setSeciliId] = useState<number | null>(null)
  const [yeniAcik, setYeniAcik] = useState(false)
  const [konu, setKonu] = useState('')
  const [ilkMesaj, setIlkMesaj] = useState('')
  const [ozellikKodu, setOzellikKodu] = useState<string | undefined>(undefined)
  const [mesajMetni, setMesajMetni] = useState('')

  useEffect(() => {
    const state = loc.state as { konu?: string; ozellik_kodu?: string } | null
    if (state?.konu) {
      setYeniAcik(true)
      setKonu(state.konu)
      setOzellikKodu(state.ozellik_kodu)
    }
  }, [loc.state])

  const { data: talepler = [] } = useQuery<Talep[]>({
    queryKey: ['destek-taleplerim'],
    queryFn: () => apiGet<Talep[]>('bildirim.php', 'destek_taleplerim'),
    staleTime: 10_000,
    refetchInterval: 20_000,
  })

  const secili = talepler.find((t) => t.id === seciliId) || null

  const { data: detay } = useQuery<{ talep: Talep; mesajlar: Mesaj[] }>({
    queryKey: ['destek-mesajlar', seciliId],
    queryFn: () => apiGet('bildirim.php', 'destek_mesajlar', { talep_id: seciliId ?? undefined }),
    enabled: !!seciliId,
    refetchInterval: secili?.oncelikli ? 4000 : 15000,
  })

  const acMut = useMutation({
    mutationFn: () => apiPost<{ id: number }>('bildirim.php', 'destek_talep_ac', { konu, mesaj: ilkMesaj, ozellik_kodu: ozellikKodu }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['destek-taleplerim'] })
      setYeniAcik(false); setKonu(''); setIlkMesaj(''); setOzellikKodu(undefined)
      setSeciliId(d.id)
    },
  })

  const gonderMut = useMutation({
    mutationFn: () => apiPost('bildirim.php', 'destek_mesaj_gonder', { talep_id: seciliId, mesaj: mesajMetni }),
    onSuccess: () => {
      setMesajMetni('')
      qc.invalidateQueries({ queryKey: ['destek-mesajlar', seciliId] })
      qc.invalidateQueries({ queryKey: ['destek-taleplerim'] })
    },
  })

  const kapatMut = useMutation({
    mutationFn: () => apiPost('bildirim.php', 'destek_talep_kapat', { talep_id: seciliId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['destek-taleplerim', 'destek-mesajlar'] }),
  })

  return (
    <>
      <Topbar title="Destek" subtitle="Sorularınız ve destek talepleriniz" search={false}
        cta="Yeni Talep" onCta={() => setYeniAcik(true)} />
      <div className="page" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {talepler.length === 0 && (
            <div className="panel" style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Henüz destek talebiniz yok.
            </div>
          )}
          {talepler.map((t) => (
            <div key={t.id} onClick={() => setSeciliId(t.id)}
              className="panel" style={{ padding: '12px 14px', cursor: 'pointer', border: seciliId === t.id ? '1.5px solid var(--gold)' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {t.oncelikli && <Zap size={12} style={{ color: 'var(--gold)' }} />}
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.konu}</span>
              </div>
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
              <div style={{ fontSize: 13 }}>Bir talep seçin veya yeni talep açın.</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {secili.oncelikli && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--gold-text)', background: 'rgba(201,169,110,.15)', borderRadius: 20, padding: '3px 9px' }}>
                    <Zap size={11} /> Canlı Destek
                  </span>
                )}
                <div style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{secili.konu}</div>
                {secili.durum !== 'kapatildi' && (
                  <button className="btn btn-sm btn-ghost" onClick={() => kapatMut.mutate()} disabled={kapatMut.isPending}>
                    <CheckCircle2 size={13} /> Kapat
                  </button>
                )}
              </div>
              <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 440, overflowY: 'auto' }}>
                {(detay?.mesajlar ?? []).map((m) => {
                  const benim = m.gonderen_tip !== 'superadmin'
                  return (
                    <div key={m.id} style={{ alignSelf: benim ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      <div style={{ background: benim ? 'var(--gold)' : 'var(--surface2)', color: benim ? '#0c0c0d' : 'var(--text)', borderRadius: 14, padding: '9px 13px', fontSize: 13.5, lineHeight: 1.5 }}>
                        {m.mesaj}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--faint)', marginTop: 3, textAlign: benim ? 'right' : 'left' }}>
                        {m.gonderen_tip === 'superadmin' ? 'Destek Ekibi' : 'Siz'} · {trTarih(m.created_at)}
                      </div>
                    </div>
                  )
                })}
              </div>
              {secili.durum !== 'kapatildi' && (
                <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input className="input" placeholder="Mesajınızı yazın…" value={mesajMetni}
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

      {yeniAcik && (
        <div className="modal-ov" onMouseDown={(e) => e.target === e.currentTarget && setYeniAcik(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-h">
              <span>Yeni Destek Talebi</span>
              <button className="modal-x" onClick={() => setYeniAcik(false)}><X size={17} /></button>
            </div>
            <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Konu</label>
                <input className="input" value={konu} onChange={(e) => setKonu(e.target.value)} placeholder="Örn. Randevu hatırlatma çalışmıyor" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Mesajınız</label>
                <textarea className="input" rows={4} value={ilkMesaj} onChange={(e) => setIlkMesaj(e.target.value)} placeholder="Sorununuzu detaylı anlatın…" />
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-ghost" onClick={() => setYeniAcik(false)}>İptal</button>
              <button className="btn btn-gold" disabled={!konu.trim() || !ilkMesaj.trim() || acMut.isPending} onClick={() => acMut.mutate()}>
                <Plus size={14} /> Talep Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
