import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Coins, Search, Gift, TrendingUp, Edit2 } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet, apiPost } from '../lib/api'

interface MusteriPuan {
  musteri_id: number
  musteri_ad: string
  musteri_tel?: string
  toplam_kazanilan: number
  toplam_harcanan: number
  bakiye: number
  islem_sayisi: number
}

interface PuanIslem {
  id: number
  musteri_id: number
  musteri_ad?: string
  tip: 'kazan' | 'harca' | 'iptal'
  miktar: number
  aciklama?: string
  created_at: string
}

interface PuanAyar {
  kazanim_orani: number   // her 100₺ için kaç puan
  minimum_harcama: number // harcamak için minimum puan
  tl_karsıligi: number    // 1 puan = kaç TL
}

const TIP_RENK: Record<string, string> = { kazan: 'var(--green)', harca: '#ff8a7d', iptal: 'var(--muted)' }
const TIP_AD: Record<string, string> = { kazan: '+', harca: '−', iptal: '⊘' }

export default function Parapuan() {
  const erisim = useErisim('parapuan')
  const qc = useQueryClient()
  const [ara, setAra] = useState('')
  const [tab, setTab] = useState<'musteriler' | 'islemler' | 'ayarlar'>('musteriler')
  const [islemModal, setIslemModal] = useState<{ musteri_id: number; musteri_ad: string } | null>(null)
  const [hata, setHata] = useState('')

  const { data: musteriler = [], isLoading } = useQuery({
    queryKey: ['parapuan-musteriler'],
    queryFn: () => apiGet<MusteriPuan[]>('parapuan.php', 'musteri_puanlari'),
    enabled: erisim,
  })

  const { data: islemler = [] } = useQuery({
    queryKey: ['parapuan-islemler'],
    queryFn: () => apiGet<PuanIslem[]>('parapuan.php', 'islemler'),
    enabled: erisim && tab === 'islemler',
  })

  const { data: ayar } = useQuery<PuanAyar>({
    queryKey: ['parapuan-ayar'],
    queryFn: () => apiGet<PuanAyar>('parapuan.php', 'ayar'),
    enabled: erisim,
  })

  const ayarGuncelle = useMutation({
    mutationFn: (a: PuanAyar) => apiPost('parapuan.php', 'ayar_guncelle', a as unknown as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parapuan-ayar'] }),
    onError: (e) => setHata((e as Error).message),
  })

  const filtreli = musteriler.filter((m) => {
    const q = ara.trim().toLocaleLowerCase('tr')
    return !q || m.musteri_ad.toLocaleLowerCase('tr').includes(q) || (m.musteri_tel || '').includes(q)
  })

  const toplamBakiye = musteriler.reduce((s, m) => s + m.bakiye, 0)
  const aktifMusteri = musteriler.filter((m) => m.bakiye > 0).length

  if (!erisim) return <><Topbar title="Parapuan" subtitle="Müşteri sadakat & puan sistemi" search={false} /><PaketEngeli ozellik="parapuan" /></>

  return (
    <>
      <Topbar title="Parapuan" subtitle="Müşteri sadakat & puan sistemi" search={false} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        {([['musteriler', 'Müşteriler'], ['islemler', 'İşlem Geçmişi'], ['ayarlar', 'Ayarlar']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: tab === k ? 600 : 400, color: tab === k ? 'var(--gold-text)' : 'var(--text2)', borderBottom: tab === k ? '2px solid var(--gold)' : '2px solid transparent', marginBottom: -1 }}>
            {l}
          </button>
        ))}
      </div>

      <div className="page">
        {hata && <div className="form-err" style={{ marginBottom: 12 }}>{hata}<button onClick={() => setHata('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button></div>}

        {/* ── Musteriler ── */}
        {tab === 'musteriler' && (
          <>
            {/* Özet kartlar */}
            <div className="metric-grid metric-grid-3">
              {[
                { ad: 'Toplam Sistem Puanı', deger: toplamBakiye.toLocaleString('tr-TR'), renk: 'var(--gold)', ic: <Coins size={18} /> },
                { ad: 'Aktif Bakiyeli Müşteri', deger: String(aktifMusteri), renk: 'var(--green)', ic: <TrendingUp size={18} /> },
                { ad: 'Toplam Müşteri', deger: String(musteriler.length), renk: 'var(--text2)', ic: <Gift size={18} /> },
              ].map((k) => (
                <div key={k.ad} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="bell-ic" style={{ width: 40, height: 40, background: `color-mix(in srgb, ${k.renk} 15%, transparent)`, color: k.renk, flexShrink: 0 }}>{k.ic}</div>
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 3 }}>{k.ad}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: k.renk }}>{k.deger}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Arama */}
            <div style={{ position: 'relative', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="input" placeholder="Müşteri ara…" value={ara} onChange={(e) => setAra(e.target.value)} style={{ paddingLeft: 32 }} />
            </div>

            {/* Tablo */}
            <div className="panel" style={{ padding: '6px 8px' }}>
              <table className="tbl">
                <thead><tr>
                  <th>Müşteri</th><th>Bakiye (puan)</th><th>Kazanılan</th><th>Harcanan</th><th>İşlem</th><th></th>
                </tr></thead>
                <tbody>
                  {isLoading && [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6}><div style={{ height: 26, borderRadius: 6, background: 'var(--surface3)', opacity: .4 }} /></td></tr>)}
                  {!isLoading && filtreli.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 36, color: 'var(--muted)' }}>Kayıt bulunamadı.</td></tr>}
                  {filtreli.map((m) => (
                    <tr key={m.musteri_id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{m.musteri_ad}</div>
                        {m.musteri_tel && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.musteri_tel}</div>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 15, color: m.bakiye > 0 ? 'var(--gold-text)' : 'var(--muted)' }}>
                          {m.bakiye.toLocaleString('tr-TR')}
                        </span>
                        {ayar && m.bakiye > 0 && (
                          <div style={{ fontSize: 10.5, color: 'var(--faint)' }}>≈ {(m.bakiye * ayar.tl_karsıligi).toLocaleString('tr-TR')} ₺</div>
                        )}
                      </td>
                      <td style={{ color: 'var(--green)', fontSize: 13 }}>+{m.toplam_kazanilan.toLocaleString('tr-TR')}</td>
                      <td style={{ color: '#ff8a7d', fontSize: 13 }}>−{m.toplam_harcanan.toLocaleString('tr-TR')}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{m.islem_sayisi}</td>
                      <td>
                        <button className="btn btn-sm btn-ghost" onClick={() => setIslemModal({ musteri_id: m.musteri_id, musteri_ad: m.musteri_ad })}
                          style={{ padding: '5px 8px', gap: 5, fontSize: 12 }}>
                          <Edit2 size={12} /> Düzenle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── İşlem Geçmişi ── */}
        {tab === 'islemler' && (
          <div className="panel" style={{ padding: '6px 8px' }}>
            <table className="tbl">
              <thead><tr><th>Müşteri</th><th>Tip</th><th>Miktar</th><th>Açıklama</th><th>Tarih</th></tr></thead>
              <tbody>
                {islemler.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 36, color: 'var(--muted)' }}>İşlem yok.</td></tr>}
                {islemler.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 500 }}>{i.musteri_ad || '—'}</td>
                    <td>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: `color-mix(in srgb, ${TIP_RENK[i.tip]} 15%, transparent)`, color: TIP_RENK[i.tip], fontWeight: 600 }}>
                        {i.tip === 'kazan' ? 'Kazanım' : i.tip === 'harca' ? 'Harcama' : 'İptal'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: TIP_RENK[i.tip] }}>{TIP_AD[i.tip]}{Math.abs(i.miktar).toLocaleString('tr-TR')}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text2)' }}>{i.aciklama || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{i.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Ayarlar ── */}
        {tab === 'ayarlar' && ayar && (
          <div style={{ maxWidth: 480 }}>
            <div className="panel" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Puan Sistemi Ayarları</div>
              <AyarForm ayar={ayar} onKaydet={(a) => ayarGuncelle.mutate(a)} yukleniyor={ayarGuncelle.isPending} />
            </div>
            <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(201,169,110,.07)', border: '1px solid rgba(201,169,110,.2)', borderRadius: 10, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--gold-text)' }}>Örnek:</strong> Müşteri 500₺ öderse{' '}
              <strong>{Math.round(500 / 100 * (ayar.kazanim_orani || 0))} puan</strong> kazanır. Bu puan{' '}
              <strong>{((500 / 100 * (ayar.kazanim_orani || 0)) * (ayar.tl_karsıligi || 0)).toFixed(2)} ₺</strong> değerinde.
            </div>
          </div>
        )}
      </div>

      {/* Manuel puan işlemi modal */}
      <Modal open={!!islemModal} onClose={() => setIslemModal(null)} title={`Puan İşlemi — ${islemModal?.musteri_ad}`} maxWidth={380}>
        {islemModal && (
          <PuanIslemModal musteriId={islemModal.musteri_id} onClose={() => { setIslemModal(null); qc.invalidateQueries({ queryKey: ['parapuan-musteriler'] }) }} />
        )}
      </Modal>
    </>
  )
}

function AyarForm({ ayar, onKaydet, yukleniyor }: { ayar: PuanAyar; onKaydet: (a: PuanAyar) => void; yukleniyor: boolean }) {
  const [f, setF] = useState(ayar)
  return (
    <div>
      <div className="field" style={{ margin: '0 0 14px' }}>
        <label>Kazanım Oranı <span style={{ fontSize: 11, color: 'var(--muted)' }}>(her 100 ₺ harcamaya kaç puan)</span></label>
        <input className="input" type="number" min={0} value={f.kazanim_orani} onChange={(e) => setF({ ...f, kazanim_orani: +e.target.value })} />
      </div>
      <div className="field" style={{ margin: '0 0 14px' }}>
        <label>Minimum Harcama Puanı <span style={{ fontSize: 11, color: 'var(--muted)' }}>(en az bu kadar puan olunca kullanılabilir)</span></label>
        <input className="input" type="number" min={0} value={f.minimum_harcama} onChange={(e) => setF({ ...f, minimum_harcama: +e.target.value })} />
      </div>
      <div className="field" style={{ margin: '0 0 18px' }}>
        <label>TL Karşılığı <span style={{ fontSize: 11, color: 'var(--muted)' }}>(1 puan = kaç ₺)</span></label>
        <input className="input" type="number" min={0} step={0.01} value={f.tl_karsıligi} onChange={(e) => setF({ ...f, tl_karsıligi: +e.target.value })} />
      </div>
      <button className="btn btn-gold" disabled={yukleniyor} onClick={() => onKaydet(f)} style={{ width: '100%', justifyContent: 'center' }}>
        {yukleniyor ? <span className="spin" /> : 'Kaydet'}
      </button>
    </div>
  )
}

function PuanIslemModal({ musteriId, onClose }: { musteriId: number; onClose: () => void }) {
  const [tip, setTip] = useState<'kazan' | 'harca'>('kazan')
  const [miktar, setMiktar] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [hata, setHata] = useState('')

  const islem = useMutation({
    mutationFn: () => apiPost('parapuan.php', 'islem_ekle', { musteri_id: musteriId, tip, miktar: +miktar, aciklama }),
    onSuccess: onClose,
    onError: (e) => setHata((e as Error).message),
  })

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err" style={{ marginBottom: 12 }}>{hata}</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['kazan', 'harca'] as const).map((t) => (
            <button key={t} onClick={() => setTip(t)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${tip === t ? TIP_RENK[t] : 'var(--border)'}`, background: tip === t ? `color-mix(in srgb, ${TIP_RENK[t]} 12%, transparent)` : 'transparent', color: tip === t ? TIP_RENK[t] : 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>
              {t === 'kazan' ? '+ Puan Ekle' : '− Puan Düş'}
            </button>
          ))}
        </div>
        <div className="field" style={{ margin: '0 0 12px' }}>
          <label>Miktar (puan)</label>
          <input className="input" type="number" min={1} value={miktar} onChange={(e) => setMiktar(e.target.value)} placeholder="0" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Açıklama</label>
          <input className="input" value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="İsteğe bağlı…" />
        </div>
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button className="btn btn-gold" disabled={islem.isPending || !miktar || +miktar <= 0} onClick={() => islem.mutate()}>
          {islem.isPending ? <span className="spin" /> : 'Kaydet'}
        </button>
      </div>
    </>
  )
}
