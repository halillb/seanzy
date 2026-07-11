import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock4, Trash2, CalendarCheck, Phone } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import { trTarih } from '../lib/tarih'
import PhoneInput from '../components/PhoneInput'
import { VARSAYILAN_ULKE, type Ulke } from '../data/countries'

interface BeklemeKayit {
  id: number
  musteri_ad: string; musteri_tel?: string
  hizmet_ad?: string; personel_ad?: string
  tercih_tarih?: string; tercih_saat?: string
  not?: string; olusturma_tarihi: string
}

function EkleModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ musteri_ad: '', hizmet_ad: '', personel_ad: '', tercih_tarih: '', tercih_saat: '', not: '' })
  const [telNat, setTelNat] = useState('')
  const [telUlke, setTelUlke] = useState<Ulke>(VARSAYILAN_ULKE)
  const [hata, setHata] = useState('')

  const ekle = useMutation({
    mutationFn: () => apiPost('bekleme.php', 'ekle', {
      ...f,
      musteri_tel: telNat ? (telUlke.iso2 === 'tr' ? '0' + telNat : telUlke.dial + telNat) : '',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bekleme-listesi'] }); onClose() },
    onError: (e) => setHata((e as Error).message),
  })

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err" style={{ marginBottom: 14 }}>{hata}</div>}
        <div className="form-grid">
          <div className="field" style={{ margin: 0 }}><label>Müşteri Adı *</label><input className="input" value={f.musteri_ad} onChange={(e) => setF((p) => ({ ...p, musteri_ad: e.target.value }))} /></div>
          <div className="field" style={{ margin: 0 }}><label>Telefon</label>
            <PhoneInput national={telNat} country={telUlke} onNational={setTelNat} onCountry={setTelUlke} /></div>
          <div className="field" style={{ margin: 0 }}><label>İstenen Hizmet</label><input className="input" value={f.hizmet_ad} onChange={(e) => setF((p) => ({ ...p, hizmet_ad: e.target.value }))} /></div>
          <div className="field" style={{ margin: 0 }}><label>Tercih Edilen Personel</label><input className="input" value={f.personel_ad} onChange={(e) => setF((p) => ({ ...p, personel_ad: e.target.value }))} /></div>
          <div className="field" style={{ margin: 0 }}><label>Tercih Tarihi</label><input className="input" type="date" value={f.tercih_tarih} onChange={(e) => setF((p) => ({ ...p, tercih_tarih: e.target.value }))} /></div>
          <div className="field" style={{ margin: 0 }}><label>Tercih Saati</label><input className="input" type="time" value={f.tercih_saat} onChange={(e) => setF((p) => ({ ...p, tercih_saat: e.target.value }))} /></div>
          <div className="field full" style={{ margin: 0 }}><label>Not</label><textarea className="input" rows={2} value={f.not} onChange={(e) => setF((p) => ({ ...p, not: e.target.value }))} /></div>
        </div>
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button className="btn btn-gold" disabled={ekle.isPending || !f.musteri_ad} onClick={() => ekle.mutate()}>
          {ekle.isPending ? <span className="spin" /> : 'Listeye Ekle'}
        </button>
      </div>
    </>
  )
}

export default function BeklemeListe() {
  const erisim = useErisim('bekleme_listesi')
  const [yeni, setYeni] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['bekleme-listesi'],
    queryFn: () => apiGet<BeklemeKayit[]>('bekleme.php', 'liste'),
    enabled: erisim,
  })

  const sil = useMutation({
    mutationFn: (id: number) => apiPost('bekleme.php', 'sil', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bekleme-listesi'] }),
  })

  const randevuyaAl = useMutation({
    mutationFn: (id: number) => apiPost('bekleme.php', 'randevuya_al', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bekleme-listesi'] }),
  })

  if (!erisim) return <><Topbar title="Bekleme Listesi" subtitle="Dolu saatler için bekleme yönetimi" search={false} /><PaketEngeli ozellik="bekleme_listesi" /></>

  return (
    <>
      <Topbar title="Bekleme Listesi" subtitle="Dolu saatler için bekleme yönetimi" search={false} cta="Listeye Ekle" onCta={() => setYeni(true)} />
      <Modal open={yeni} onClose={() => setYeni(false)} title="Bekleme Listesine Ekle"><EkleModal onClose={() => setYeni(false)} /></Modal>

      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13.5, color: 'var(--text2)' }}>
          <Clock4 size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          Listede <strong style={{ color: 'var(--text)', marginInline: 4 }}>{data?.length ?? 0}</strong> müşteri bekliyor. Uygun saat açıldığında "Randevuya Al" ile randevu oluşturun.
        </div>

        {isLoading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Yükleniyor…</div>}
        {!isLoading && (data ?? []).length === 0 && (
          <div className="panel" style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>Bekleme listesi boş.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(data ?? []).map((k, i) => (
            <div key={k.id} className="panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(201,169,110,.15)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{k.musteri_ad}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {k.musteri_tel && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{k.musteri_tel}</span>}
                  {k.hizmet_ad && <span>🔸 {k.hizmet_ad}</span>}
                  {k.personel_ad && <span>👤 {k.personel_ad}</span>}
                  {k.tercih_tarih && <span>📅 {trTarih(k.tercih_tarih)}{k.tercih_saat ? ` ${k.tercih_saat}` : ''}</span>}
                </div>
                {k.not && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, fontStyle: 'italic' }}>"{k.not}"</div>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--faint)', textAlign: 'right', flexShrink: 0 }}>
                <div>{trTarih(k.olusturma_tarihi)}</div>
                <div>Eklendi</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-sm btn-ghost" onClick={() => randevuyaAl.mutate(k.id)} title="Randevuya Al" style={{ padding: '6px 10px', gap: 5, fontSize: 12, color: 'var(--green)' }}>
                  <CalendarCheck size={13} /> Randevuya Al
                </button>
                <button className="btn btn-sm btn-ghost" onClick={async () => { if (await confirmAsync('Listeden çıkarılsın mı?')) sil.mutate(k.id) }} style={{ padding: '6px 8px', color: '#ff8a7d' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
