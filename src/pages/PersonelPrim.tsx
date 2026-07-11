import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, Settings2, TrendingUp, Users, Printer } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet, apiPost } from '../lib/api'
import Select from '../components/Select'

const tl = (n: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

interface PrimOran {
  personel_id: number; personel_ad: string; personel_soyad?: string
  hizmet_prim: number; urun_prim: number; paket_prim: number
}

interface PrimOzet {
  personel_id: number; personel_ad: string; personel_soyad?: string
  toplam_ciro: number; prim_tutari: number; randevu_sayisi: number
  hizmet_ciro: number; urun_ciro: number; paket_ciro: number
}

function OranModal({ mevcut, onClose }: { mevcut: PrimOran; onClose: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ hizmet_prim: mevcut.hizmet_prim, urun_prim: mevcut.urun_prim, paket_prim: mevcut.paket_prim })
  const [hata, setHata] = useState('')

  const kaydet = useMutation({
    mutationFn: () => apiPost('prim.php', 'oran_guncelle', { personel_id: mevcut.personel_id, ...f }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prim-oranlar'] }); onClose() },
    onError: (e) => setHata((e as Error).message),
  })

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err" style={{ marginBottom: 14 }}>{hata}</div>}
        <div style={{ fontWeight: 600, marginBottom: 16 }}>{mevcut.personel_ad} {mevcut.personel_soyad || ''}</div>
        {[
          { key: 'hizmet_prim', label: 'Hizmet Primi (%)', val: f.hizmet_prim },
          { key: 'urun_prim', label: 'Ürün Satış Primi (%)', val: f.urun_prim },
          { key: 'paket_prim', label: 'Paket Satış Primi (%)', val: f.paket_prim },
        ].map(({ key, label, val }) => (
          <div key={key} className="field" style={{ margin: '0 0 12px' }}>
            <label>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input className="input" type="range" min={0} max={50} step={1} value={val}
                onChange={(e) => setF((p) => ({ ...p, [key]: +e.target.value }))} style={{ flex: 1 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold-text)', minWidth: 36 }}>%{val}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button className="btn btn-gold" disabled={kaydet.isPending} onClick={() => kaydet.mutate()}>
          {kaydet.isPending ? <span className="spin" /> : 'Kaydet'}
        </button>
      </div>
    </>
  )
}

export default function PersonelPrim() {
  const erisim = useErisim('personel_prim')
  const now = new Date()
  const [ay, setAy] = useState(now.getMonth() + 1)
  const [yil, setYil] = useState(now.getFullYear())
  const [duzenle, setDuzenle] = useState<PrimOran | null>(null)

  const oranlar = useQuery({ queryKey: ['prim-oranlar'], queryFn: () => apiGet<PrimOran[]>('prim.php', 'oranlar'), enabled: erisim })
  const ozet = useQuery({ queryKey: ['prim-ozet', ay, yil], queryFn: () => apiGet<PrimOzet[]>('prim.php', 'ozet', { ay, yil }), enabled: erisim })

  const toplamPrim = useMemo(() => (ozet.data ?? []).reduce((s, p) => s + p.prim_tutari, 0), [ozet.data])
  const toplamCiro = useMemo(() => (ozet.data ?? []).reduce((s, p) => s + p.toplam_ciro, 0), [ozet.data])

  if (!erisim) return <><Topbar title="Personel Prim" subtitle="Hakediş ve prim hesaplama" search={false} /><PaketEngeli ozellik="personel_prim" /></>

  return (
    <>
      <Topbar title="Personel Prim" subtitle="Hakediş ve prim hesaplama" search={false}
        actions={<button className="btn btn-ghost" onClick={() => window.print()} style={{ gap: 6 }}><Printer size={14} /> Yazdır / PDF</button>} />
      <Modal open={!!duzenle} onClose={() => setDuzenle(null)} title="Prim Oranları" maxWidth={420}>
        {duzenle && <OranModal mevcut={duzenle} onClose={() => setDuzenle(null)} />}
      </Modal>

      <div className="page">
        {/* Dönem seçici */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Select className="input" value={ay} onChange={(e) => setAy(+e.target.value)} style={{ width: 140 }}>
            {AYLAR.map((a, i) => <option key={i} value={i + 1}>{a}</option>)}
          </Select>
          <Select className="input" value={yil} onChange={(e) => setYil(+e.target.value)} style={{ width: 100 }}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
          </Select>
        </div>

        {/* Özet — kompakt tek satır */}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', padding: '2px 2px 4px' }}>
          {[
            { ad: 'Toplam Ciro', deger: tl(toplamCiro), ikon: TrendingUp, renk: 'var(--gold)' },
            { ad: 'Toplam Prim', deger: tl(toplamPrim), ikon: Trophy, renk: 'var(--green)' },
            { ad: 'Prim Oranı', deger: toplamCiro > 0 ? `%${((toplamPrim / toplamCiro) * 100).toFixed(1)}` : '–', ikon: Users, renk: '#C084FC' },
          ].map((k) => (
            <div key={k.ad} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="bell-ic" style={{ background: `color-mix(in srgb, ${k.renk} 12%, transparent)`, color: k.renk, width: 30, height: 30 }}><k.ikon size={14} /></div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{k.ad}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: k.renk }}>{k.deger}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="pp-grid">
          {/* Prim özet tablosu */}
          <div className="panel" style={{ padding: '6px 8px' }}>
            <div style={{ padding: '12px 12px 8px', fontSize: 13, fontWeight: 600 }}>{AYLAR[ay - 1]} {yil} – Personel Hakedişleri</div>
            <table className="tbl">
              <thead><tr><th>Personel</th><th>Randevu</th><th>Ciro</th><th>Prim</th></tr></thead>
              <tbody>
                {ozet.isLoading && [...Array(3)].map((_, i) => <tr key={i}><td colSpan={4}><div style={{ height: 28, borderRadius: 6, background: 'var(--surface3)', opacity: .4 }} /></td></tr>)}
                {(ozet.data ?? []).map((p) => (
                  <tr key={p.personel_id}>
                    <td style={{ fontWeight: 500 }}>{p.personel_ad} {p.personel_soyad || ''}</td>
                    <td style={{ color: 'var(--text2)' }}>{p.randevu_sayisi}</td>
                    <td>{tl(p.toplam_ciro)}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--green)' }}>{tl(p.prim_tutari)}</span></td>
                  </tr>
                ))}
                {!ozet.isLoading && (ozet.data ?? []).length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Bu dönemde veri yok.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Prim oranları */}
          <div className="panel">
            <div style={{ padding: '14px 16px 8px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings2 size={15} /> Prim Oranları
            </div>
            {oranlar.isLoading && <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)' }}>Yükleniyor…</div>}
            {(oranlar.data ?? []).map((p) => (
              <div key={p.personel_id} style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.personel_ad} {p.personel_soyad || ''}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    Hizmet %{p.hizmet_prim} · Ürün %{p.urun_prim} · Paket %{p.paket_prim}
                  </div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setDuzenle(p)} style={{ padding: '5px 10px', fontSize: 12 }}>
                  <Settings2 size={13} /> Düzenle
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
