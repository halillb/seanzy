import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Check } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'

export interface Hizmet {
  id: number; ad: string; ad_tr?: string; sure_dk?: number; fiyat?: number | string
  renk?: string; kategori_id?: number; kategori_ad?: string; on_talimat?: string; son_talimat?: string
  cinsiyet?: 'genel' | 'bayan' | 'erkek'; hizmet_tipi?: 'tek' | 'seansli'; varsayilan_seans?: number
}
interface Kategori { id: number; ad_tr: string; cinsiyet_ayrimi?: boolean }
interface Props { onClose: () => void; mevcut?: Hizmet }

const RENKLER = ['#C9A96E', '#3B82F6', '#2ECC71', '#A78BFA', '#E74C3C', '#F0B14E', '#1ABC9C', '#EC4899']

function Segment<T extends string>({ options, value, onChange }: { options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, background: 'var(--surface2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
      {options.map((o) => (
        <button type="button" key={o.v} onClick={() => onChange(o.v)}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
            background: value === o.v ? 'var(--grad-gold)' : 'transparent', color: value === o.v ? '#0C0C0D' : 'var(--text2)', transition: 'all .15s',
          }}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

export default function HizmetForm({ onClose, mevcut }: Props) {
  const qc = useQueryClient()
  const duzenle = !!mevcut
  const { data: kategoriler } = useQuery({ queryKey: ['kategoriler'], queryFn: () => apiGet<Kategori[]>('hizmet.php', 'kategoriler') })
  const [kategoriId, setKategoriId] = useState(String(mevcut?.kategori_id || ''))
  const [cinsiyet, setCinsiyet] = useState(mevcut?.cinsiyet || 'genel')
  const [ad, setAd] = useState(mevcut?.ad_tr || mevcut?.ad || '')
  const [hizmetTipi, setHizmetTipi] = useState(mevcut?.hizmet_tipi || 'tek')
  const [varsayilanSeans, setVarsayilanSeans] = useState(String(mevcut?.varsayilan_seans || '8'))
  const [sure, setSure] = useState(String(mevcut?.sure_dk || '60'))
  const [fiyat, setFiyat] = useState(String(mevcut?.fiyat || ''))
  const [renk, setRenk] = useState(mevcut?.renk || RENKLER[0])
  const [on, setOn] = useState(mevcut?.on_talimat || '')
  const [son, setSon] = useState(mevcut?.son_talimat || '')
  const [hata, setHata] = useState('')

  const seciliKategori = (kategoriler ?? []).find((k) => String(k.id) === kategoriId)
  const cinsiyetGoster = !!seciliKategori?.cinsiyet_ayrimi

  const m = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        ad_tr: ad.trim(), kategori_id: kategoriId ? Number(kategoriId) : undefined,
        sure_dk: Number(sure) || 60, fiyat: Number(fiyat) || 0, renk,
        on_talimat: on.trim() || undefined, son_talimat: son.trim() || undefined,
        cinsiyet: cinsiyetGoster ? cinsiyet : 'genel',
        hizmet_tipi: hizmetTipi,
        varsayilan_seans: hizmetTipi === 'seansli' ? (Number(varsayilanSeans) || 1) : 1,
      }
      if (duzenle) body.id = mevcut!.id
      return apiPost('hizmet.php', duzenle ? 'guncelle' : 'ekle', body)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hizmetler'] }); onClose() },
    onError: (e) => setHata((e as Error).message || 'Kayıt başarısız.'),
  })

  const sil = useMutation({
    mutationFn: () => apiPost('hizmet.php', 'sil', { id: mevcut!.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hizmetler'] }); onClose() },
    onError: (e) => setHata((e as Error).message || 'Silinemedi.'),
  })

  function gonder(e: React.FormEvent) {
    e.preventDefault(); setHata('')
    if (!kategoriId) { setHata('Önce bir kategori seçin.'); return }
    if (!ad.trim()) { setHata('Hizmet adı zorunludur.'); return }
    if (!fiyat) { setHata('Fiyat girin.'); return }
    m.mutate()
  }

  return (
    <form onSubmit={gonder}>
      <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {hata && <div className="form-err" style={{ marginBottom: 0 }}>{hata}</div>}

        {/* 1. Kategori */}
        <div>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>1 · Kategori *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(kategoriler ?? []).map((k) => (
              <button type="button" key={k.id} onClick={() => setKategoriId(String(k.id))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5,
                  background: kategoriId === String(k.id) ? 'rgba(201,169,110,.16)' : 'var(--surface2)',
                  border: `1px solid ${kategoriId === String(k.id) ? 'rgba(201,169,110,.45)' : 'var(--border)'}`,
                  color: kategoriId === String(k.id) ? 'var(--gold-text)' : 'var(--text2)',
                }}>
                {kategoriId === String(k.id) && <Check size={13} />}
                {k.ad_tr}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Cinsiyet — sadece kategori cinsiyet ayrımına sahipse */}
        {cinsiyetGoster && (
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>2 · Cinsiyet</label>
            <Segment value={cinsiyet} onChange={setCinsiyet} options={[
              { v: 'genel', l: 'Genel' }, { v: 'bayan', l: 'Bayan' }, { v: 'erkek', l: 'Erkek' },
            ]} />
          </div>
        )}

        {/* 3. Hizmet Adı */}
        <div>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{cinsiyetGoster ? '3' : '2'} · Hizmet Adı *</label>
          <input className="input" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="örn. Koltuk Altı Lazer" autoFocus={!!kategoriId} />
        </div>

        {/* 4. Hizmet Tipi + Seans */}
        <div className="form-grid" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Hizmet Tipi</label>
            <Segment value={hizmetTipi} onChange={setHizmetTipi} options={[
              { v: 'tek', l: 'Tek Seferlik' }, { v: 'seansli', l: 'Seanslı (Kür)' },
            ]} />
          </div>
          {hizmetTipi === 'seansli' && (
            <div className="field" style={{ margin: 0 }}><label>Varsayılan Seans</label>
              <input className="input" type="number" min={1} value={varsayilanSeans} onChange={(e) => setVarsayilanSeans(e.target.value)} /></div>
          )}
          <div className="field" style={{ margin: 0 }}><label>Süre (dk)</label>
            <input className="input" type="number" min={5} step={5} value={sure} onChange={(e) => setSure(e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Fiyat (₺) *</label>
            <input className="input" type="number" min={0} value={fiyat} onChange={(e) => setFiyat(e.target.value)} /></div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Renk Etiketi</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {RENKLER.map((r) => (
              <button type="button" key={r} onClick={() => setRenk(r)}
                style={{ width: 26, height: 26, borderRadius: 7, background: r, cursor: 'pointer', border: renk === r ? '2px solid var(--text)' : '2px solid transparent' }} />
            ))}
          </div>
        </div>

        <div className="form-grid" style={{ gap: 14 }}>
          <div className="field full" style={{ margin: 0 }}><label>Hizmet Öncesi Notlar <span style={{ color: 'var(--faint)', textTransform: 'none', letterSpacing: 0 }}>(randevuda gösterilir)</span></label>
            <textarea className="input" rows={2} value={on} onChange={(e) => setOn(e.target.value)} placeholder="örn. İşlemden 1 gün önce bölge jiletlenmeli…" /></div>
          <div className="field full" style={{ margin: 0 }}><label>Hizmet Sonrası Notlar</label>
            <textarea className="input" rows={2} value={son} onChange={(e) => setSon(e.target.value)} placeholder="örn. İlk 24 saat sıcak su değdirmeyin…" /></div>
        </div>
      </div>
      <div className="modal-f">
        {duzenle && (
          <button type="button" className="btn btn-sm" style={{ marginRight: 'auto', color: '#ff8a7d' }} disabled={sil.isPending}
            onClick={async () => { if (await confirmAsync({ message: `"${mevcut?.ad_tr || mevcut?.ad}" hizmeti silinsin mi?`, tehlikeli: true, onaylaMetin: 'Sil' })) sil.mutate() }}>
            {sil.isPending ? <span className="spin" /> : <><Trash2 size={14} /> Sil</>}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onClose}>İptal</button>
        <button type="submit" className="btn btn-gold" disabled={m.isPending}>
          {m.isPending ? <span className="spin" /> : duzenle ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
