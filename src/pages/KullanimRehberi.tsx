import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Lock, ArrowRight, BookOpen, MessageCircle } from 'lucide-react'
import Topbar from '../components/Topbar'
import { useAuth } from '../store/auth'
import { OZELLIKLER, PAKET_RENK, paketErisi, type SaPaket } from '../lib/ozellikler'
import { KULLANIM_REHBERI } from '../lib/kullanimRehberi'
import type { OzellikHaritasi } from '../hooks/useOzellikHaritasi'

const GRUPLAR = Object.entries(
  Object.entries(OZELLIKLER).reduce<Record<string, { key: string; tanim: typeof OZELLIKLER[string] }[]>>((acc, [key, t]) => {
    if (!acc[t.grup]) acc[t.grup] = []
    acc[t.grup].push({ key, tanim: t })
    return acc
  }, {})
)

export default function KullanimRehberi() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()
  const rol = user?.rol || 'mudur'
  const paket = user?.paket_turu || 'basic'
  const superMod = rol === 'superadmin'
  const [acik, setAcik] = useState<string | null>(null)
  const harita = qc.getQueryData<OzellikHaritasi>(['ozellik-haritasi'])
  const paketler = (qc.getQueryData<SaPaket[]>(['sa-paketler']) ?? []).filter((p) => p.aktif)

  const erisimVar = (key: string, min: string) => superMod || paketErisi(paket, harita?.[key] ?? min, paketler)

  return (
    <>
      <Topbar title="Kullanım Kılavuzu" subtitle={superMod ? 'Tüm özelliklerin nerede ve nasıl kullanıldığı' : 'Paketinize dahil özelliklerin kullanım rehberi'} search={false} />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 12, background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.2)', marginBottom: 6 }}>
          <BookOpen size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            {superMod
              ? 'Sistemdeki tüm özelliklerin nerede bulunduğu ve nasıl kullanıldığına dair referans rehber.'
              : 'Aşağıda mevcut paketinizde açık olan özelliklerin nasıl kullanılacağı anlatılıyor. Kilitli özellikler için paketinizi yükseltebilirsiniz.'}
          </div>
        </div>

        {GRUPLAR.map(([grup, ozellikler]) => (
          <div key={grup} className="panel" style={{ padding: 0 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {grup}
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ozellikler.map(({ key, tanim }) => {
                const rehber = KULLANIM_REHBERI[key as keyof typeof OZELLIKLER]
                const acikMi = erisimVar(key, tanim.min)
                const isAcik = acik === key
                const renk = acikMi ? 'var(--gold-text)' : 'var(--faint)'
                return (
                  <div key={key} style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div onClick={() => setAcik(isAcik ? null : key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', background: 'var(--surface)', opacity: acikMi ? 1 : 0.65 }}>
                      {!acikMi && <Lock size={13} style={{ color: PAKET_RENK[tanim.min] ?? 'var(--faint)', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: renk }}>{tanim.ad}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{tanim.aciklama}</div>
                      </div>
                      {!acikMi && (
                        <span style={{ fontSize: 10, background: 'var(--surface3)', color: 'var(--muted)', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
                          {tanim.min.charAt(0).toUpperCase() + tanim.min.slice(1)}+ gerekli
                        </span>
                      )}
                      {isAcik ? <ChevronUp size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} /> : <ChevronDown size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
                    </div>
                    {isAcik && (
                      <div style={{ padding: '4px 14px 14px 37px', background: 'var(--surface)' }}>
                        {rehber ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Kim yapar:</span>
                              <span style={{ fontSize: 11.5, color: 'var(--gold-text)', background: 'rgba(201,169,110,.12)', borderRadius: 20, padding: '2px 9px', fontWeight: 500 }}>{rehber.kim}</span>
                            </div>
                            <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {rehber.adimlar.map((a, i) => (
                                <li key={i} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{a}</li>
                              ))}
                            </ol>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              {rehber.yol && acikMi && (
                                <button className="btn btn-sm btn-ghost" style={{ gap: 6 }} onClick={() => nav(rehber.yol!)}>
                                  Sayfaya Git <ArrowRight size={13} />
                                </button>
                              )}
                              {!superMod && (
                                <button className="btn btn-sm btn-ghost" style={{ gap: 6 }}
                                  onClick={() => nav('/destek', { state: { konu: `${tanim.ad} hakkında yardım`, ozellik_kodu: key } })}>
                                  <MessageCircle size={13} /> Destek Al
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Bu özellik için rehber içeriği henüz eklenmedi.</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
