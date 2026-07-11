import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import Select from './Select'

interface Kategori { id: number; ad_tr: string; cinsiyet_ayrimi?: boolean }
interface HizmetMini { id: number; kategori_id?: number }

export default function KategoriYonet({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { data: kategoriler } = useQuery({ queryKey: ['kategoriler'], queryFn: () => apiGet<Kategori[]>('hizmet.php', 'kategoriler') })
  const { data: hizmetler } = useQuery({ queryKey: ['hizmetler'], queryFn: () => apiGet<HizmetMini[]>('hizmet.php', 'liste') })
  const [yeniAd, setYeniAd] = useState('')
  const [duzId, setDuzId] = useState<number | null>(null)
  const [duzAd, setDuzAd] = useState('')
  const [silId, setSilId] = useState<number | null>(null)
  const [hedef, setHedef] = useState('')
  const [hata, setHata] = useState('')

  const yenile = () => { qc.invalidateQueries({ queryKey: ['kategoriler'] }); qc.invalidateQueries({ queryKey: ['hizmetler'] }) }
  const sayi = (id: number) => (hizmetler ?? []).filter((h) => h.kategori_id === id).length

  const ekle = useMutation({ mutationFn: () => apiPost('hizmet.php', 'kategori_ekle', { ad_tr: yeniAd.trim() }), onSuccess: () => { setYeniAd(''); yenile() }, onError: (e) => setHata((e as Error).message) })
  const guncelle = useMutation({ mutationFn: () => apiPost('hizmet.php', 'kategori_guncelle', { id: duzId, ad_tr: duzAd.trim() }), onSuccess: () => { setDuzId(null); yenile() } })
  const cinsiyetToggle = useMutation({ mutationFn: (v: { id: number; cinsiyet_ayrimi: boolean }) => apiPost('hizmet.php', 'kategori_guncelle', { id: v.id, cinsiyet_ayrimi: v.cinsiyet_ayrimi }), onSuccess: yenile })
  const sil = useMutation({ mutationFn: (v: { id: number; hedef?: string }) => apiPost('hizmet.php', 'kategori_sil', { id: v.id, hedef_kategori_id: v.hedef || undefined }), onSuccess: () => { setSilId(null); setHedef(''); yenile() }, onError: (e) => setHata((e as Error).message) })

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(kategoriler ?? []).map((k) => {
            const n = sayi(k.id)
            if (duzId === k.id) return (
              <div key={k.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
                <input className="input" value={duzAd} onChange={(e) => setDuzAd(e.target.value)} autoFocus />
                <button className="iconmini" onClick={() => guncelle.mutate()} style={{ color: 'var(--green)' }}><Check size={15} /></button>
                <button className="iconmini" onClick={() => setDuzId(null)}><X size={15} /></button>
              </div>
            )
            if (silId === k.id) return (
              <div key={k.id} style={{ padding: '10px 12px', background: 'rgba(231,76,60,.07)', border: '1px solid rgba(231,76,60,.2)', borderRadius: 10 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 8 }}>
                  <b>{k.ad_tr}</b> silinecek.{n > 0 ? ` ${n} hizmet var – taşınacak kategoriyi seç:` : ''}
                </div>
                {n > 0 && (
                  <Select className="input" value={hedef} onChange={(e) => setHedef(e.target.value)} style={{ marginBottom: 8 }}>
                    <option value="">Kategori seç</option>
                    {(kategoriler ?? []).filter((x) => x.id !== k.id).map((x) => <option key={x.id} value={x.id}>{x.ad_tr}</option>)}
                  </Select>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setSilId(null); setHedef('') }}>Vazgeç</button>
                  <button className="btn btn-sm" style={{ background: 'rgba(231,76,60,.15)', color: '#ff8a7d', borderColor: 'rgba(231,76,60,.3)' }}
                    disabled={n > 0 && !hedef}
                    onClick={() => sil.mutate({ id: k.id, hedef })}>{n > 0 ? 'Taşı ve Sil' : 'Sil'}</button>
                </div>
              </div>
            )
            return (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ flex: 1, fontSize: 13.5 }}>{k.ad_tr}</span>
                <span className="badge badge-muted">{n} hizmet</span>
                <button
                  onClick={() => cinsiyetToggle.mutate({ id: k.id, cinsiyet_ayrimi: !k.cinsiyet_ayrimi })}
                  title="Cinsiyet ayrımı (Bayan/Erkek çipi)"
                  style={{ fontSize: 10.5, padding: '4px 9px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${k.cinsiyet_ayrimi ? 'rgba(201,169,110,.4)' : 'var(--border)'}`, background: k.cinsiyet_ayrimi ? 'rgba(201,169,110,.15)' : 'var(--surface2)', color: k.cinsiyet_ayrimi ? 'var(--gold-text)' : 'var(--muted)' }}>
                  Cinsiyet {k.cinsiyet_ayrimi ? 'Açık' : 'Kapalı'}
                </button>
                <button className="iconmini" onClick={() => { setDuzId(k.id); setDuzAd(k.ad_tr) }}><Pencil size={14} /></button>
                <button className="iconmini" onClick={() => { setSilId(k.id); setHata('') }} style={{ color: '#ff8a7d' }}><Trash2 size={14} /></button>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input className="input" value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} placeholder="Yeni kategori adı" />
          <button className="btn btn-gold btn-sm" disabled={!yeniAd.trim() || ekle.isPending} onClick={() => ekle.mutate()}><Plus size={15} /> Ekle</button>
        </div>
      </div>
      <div className="modal-f"><button className="btn btn-ghost" onClick={onClose}>Kapat</button></div>
    </>
  )
}
