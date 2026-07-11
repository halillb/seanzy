import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCheck, X, Trash2, User, Scissors, Calendar, Info, Pencil, Plus } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'
import { trTarihGun } from '../lib/tarih'

export interface RandevuKalem {
  id: number; hizmet_id: number; hizmet_ad?: string; fiyat: number; sure_dk: number
  hizmet_tipi: 'tek' | 'seansli'; musteri_paket_id?: number | null
  kalan_seans?: number; toplam_seans?: number; seans_dusuldu?: boolean; durum?: string
}
export interface RandevuOzet {
  id: number
  musteri_id?: number; musteri_ad?: string; musteri_tel?: string
  personel_id?: number; personel_ad?: string; hizmet_ad?: string; hizmet_id?: number
  tarih?: string; baslangic?: string; bitis?: string
  fiyat?: number | string; durum: string
  kalemler?: RandevuKalem[]
}
interface HizmetNot { id: number; on_talimat?: string; son_talimat?: string }

const DURUM: Record<string, [string, string]> = {
  bekliyor: ['Bekliyor', 'badge-gold'], onaylandi: ['Onaylı', 'badge-green'],
  tamamlandi: ['Tamamlandı', 'badge-blue'], iptal: ['İptal', 'badge-red'], gelmedi: ['Gelmedi', 'badge-muted'],
}
const saat = (s?: string) => (s ? s.slice(0, 5) : '')
const tl = (n?: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'

interface Props { randevu: RandevuOzet; onClose: () => void; onEdit?: (r: RandevuOzet) => void }

export default function RandevuDetay({ randevu: r, onClose, onEdit }: Props) {
  const qc = useQueryClient()
  const [iptalMod, setIptalMod] = useState(false)
  const [iptalNedeni, setIptalNedeni] = useState('')
  const [hata, setHata] = useState('')
  const bitir = () => { qc.invalidateQueries({ queryKey: ['randevular'] }); onClose() }

  const { data: hizmetler } = useQuery({ queryKey: ['hizmetler'], queryFn: () => apiGet<HizmetNot[]>('hizmet.php', 'liste') })
  const hizmet = hizmetler?.find((h) => h.id === r.hizmet_id)

  const cokluHizmet = (r.kalemler?.length ?? 0) > 0

  const [tamamlaMod, setTamamlaMod] = useState(false)
  const [yapilan, setYapilan] = useState<Set<number>>(new Set())
  const [sonSeans, setSonSeans] = useState<{ hizmet_id: number; musteri_paket_id: number; hizmet_ad?: string }[]>([])

  const m = useMutation({
    mutationFn: (v: { action: string; body: Record<string, unknown> }) => apiPost('randevu.php', v.action, v.body),
    onSuccess: bitir,
    onError: (e) => setHata((e as Error).message || 'İşlem başarısız.'),
  })
  const durumYap = (durum: string) => m.mutate({ action: 'durum_guncelle', body: { id: r.id, durum } })

  const tamamlaAc = () => {
    if (cokluHizmet) {
      setYapilan(new Set((r.kalemler ?? []).map((k) => k.id)))
      setTamamlaMod(true)
    } else {
      durumYap('tamamlandi')
    }
  }
  const yapilanToggle = (id: number) => setYapilan((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const tamamlaMutation = useMutation({
    mutationFn: () => apiPost<{ son_seans?: typeof sonSeans }>('randevu.php', 'tamamla', { randevu_id: r.id, yapilan: [...yapilan] }),
    onSuccess: (data) => {
      const ss = data?.son_seans ?? []
      if (ss.length > 0) { setSonSeans(ss); setTamamlaMod(false) } else { bitir() }
    },
    onError: (e) => setHata((e as Error).message || 'İşlem başarısız.'),
  })

  const seansKararMutation = useMutation({
    mutationFn: (v: { musteri_paket_id: number; islem: 'tamamla' | 'uzat' }) =>
      v.islem === 'tamamla'
        ? apiPost('randevu.php', 'paket_hizmet_tamamla', { musteri_paket_id: v.musteri_paket_id })
        : apiPost('randevu.php', 'seans_ayarla', { musteri_paket_id: v.musteri_paket_id, delta: 2, aciklama: 'Son seansta uzatıldı' }),
    onSuccess: (_d, v) => {
      setSonSeans((s) => s.filter((x) => x.musteri_paket_id !== v.musteri_paket_id))
    },
  })

  useEffect(() => {
    if (sonSeans.length === 0 && tamamlaMutation.isSuccess) bitir()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sonSeans])

  const [lbl, cls] = DURUM[r.durum] || [r.durum, 'badge-muted']

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 500 }}>{r.hizmet_ad || 'Randevu'}</div>
          <span className={`badge ${cls}`}>{lbl}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <Satir ic={<User />} a={r.musteri_ad || '—'} b={r.musteri_tel} />
          <Satir ic={<Scissors />} a={r.personel_ad || '—'} b="Personel" />
          <Satir ic={<Calendar />} a={`${trTarihGun(r.tarih)} · ${saat(r.baslangic)}${r.bitis ? '–' + saat(r.bitis) : ''}`} b={tl(r.fiyat)} />
        </div>

        {cokluHizmet && !tamamlaMod && sonSeans.length === 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(r.kalemler ?? []).map((k) => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, padding: '7px 10px', background: 'var(--surface2)', borderRadius: 8 }}>
                <span>{k.hizmet_ad}{k.hizmet_tipi === 'seansli' && k.kalan_seans != null ? ` · ${k.kalan_seans}/${k.toplam_seans} seans` : ''}</span>
                <span style={{ color: 'var(--gold-text)' }}>{tl(k.fiyat)}</span>
              </div>
            ))}
          </div>
        )}

        {tamamlaMod && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>Yapılan hizmetleri işaretleyin — tikli seanslı hizmetlerden 1 seans düşülecek.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(r.kalemler ?? []).map((k) => {
                const on = yapilan.has(k.id)
                return (
                  <button key={k.id} type="button" onClick={() => yapilanToggle(k.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', background: on ? 'rgba(201,169,110,.1)' : 'var(--surface2)', border: `1.5px solid ${on ? 'var(--gold)' : 'var(--border)'}` }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--gold)' : 'transparent', border: on ? 'none' : '1.5px solid var(--border2)' }}>
                      {on && <Check size={13} color="#0C0C0D" />}
                    </span>
                    <span style={{ fontSize: 13, flex: 1 }}>{k.hizmet_ad}{k.hizmet_tipi === 'seansli' && k.kalan_seans != null ? ` · ${k.kalan_seans}/${k.toplam_seans} seans` : ''}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {sonSeans.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sonSeans.map((s) => (
              <div key={s.musteri_paket_id} style={{ background: 'rgba(231,76,60,.08)', border: '1px solid rgba(231,76,60,.25)', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 12.5, color: '#f0938a', marginBottom: 9 }}><b>{s.hizmet_ad}</b> son seansına ulaştı. Ne yapılsın?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" onClick={() => seansKararMutation.mutate({ musteri_paket_id: s.musteri_paket_id, islem: 'tamamla' })} disabled={seansKararMutation.isPending}>
                    <CheckCheck size={14} /> Kürü Tamamla
                  </button>
                  <button className="btn btn-sm btn-gold" onClick={() => seansKararMutation.mutate({ musteri_paket_id: s.musteri_paket_id, islem: 'uzat' })} disabled={seansKararMutation.isPending}>
                    <Plus size={14} /> 2 Seans Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {hizmet && (hizmet.on_talimat || hizmet.son_talimat) && !iptalMod && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hizmet.on_talimat && (
              <div style={{ background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.2)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: 'var(--gold-text)', marginBottom: 5 }}><Info size={13} /> Hizmet Öncesi</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{hizmet.on_talimat}</div>
              </div>
            )}
            {hizmet.son_talimat && (
              <div style={{ background: 'rgba(59,130,246,.07)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: '#7db1f2', marginBottom: 5 }}><Info size={13} /> Hizmet Sonrası</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{hizmet.son_talimat}</div>
              </div>
            )}
          </div>
        )}

        {iptalMod && (
          <div className="field" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', marginBottom: 0 }}>
            <label>İptal Nedeni (opsiyonel)</label>
            <input className="input" value={iptalNedeni} onChange={(e) => setIptalNedeni(e.target.value)} placeholder="örn. Müşteri iptal etti" />
          </div>
        )}
      </div>

      <div className="modal-f" style={{ flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
        {tamamlaMod && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setTamamlaMod(false)}>Geri</button>
            <button className="btn btn-sm btn-gold" style={{ marginLeft: 'auto' }} disabled={tamamlaMutation.isPending}
              onClick={() => tamamlaMutation.mutate()}>
              {tamamlaMutation.isPending ? <span className="spin" /> : <><CheckCheck size={15} /> Tamamla</>}
            </button>
          </>
        )}
        {!tamamlaMod && sonSeans.length === 0 && !iptalMod && <>
          <button className="btn btn-sm" title="Sil" onClick={async () => { if (await confirmAsync({ message: 'Randevu silinsin mi?', tehlikeli: true, onaylaMetin: 'Sil' })) m.mutate({ action: 'sil', body: { id: r.id } }) }} style={{ marginRight: 'auto', color: 'var(--muted)' }}><Trash2 size={15} /></button>
          {r.durum === 'bekliyor' && <button className="btn btn-sm" onClick={() => durumYap('onaylandi')} disabled={m.isPending}><Check size={15} /> Onayla</button>}
          {r.durum !== 'tamamlandi' && <button className="btn btn-sm" onClick={tamamlaAc} disabled={m.isPending}><CheckCheck size={15} /> Tamamla</button>}
          <button className="btn btn-sm" onClick={() => setIptalMod(true)} style={{ color: '#ff8a7d' }}><X size={15} /> İptal</button>
          <button className="btn btn-sm btn-gold" onClick={() => onEdit?.(r)}><Pencil size={15} /> Düzenle</button>
        </>}
        {iptalMod && <>
          <button className="btn btn-ghost btn-sm" onClick={() => setIptalMod(false)}>Geri</button>
          <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'rgba(231,76,60,.15)', color: '#ff8a7d', borderColor: 'rgba(231,76,60,.3)' }} disabled={m.isPending}
            onClick={() => m.mutate({ action: 'durum_guncelle', body: { id: r.id, durum: 'iptal', iptal_nedeni: iptalNedeni } })}>
            {m.isPending ? <span className="spin" /> : 'İptal Et'}
          </button>
        </>}
      </div>
    </>
  )
}

function Satir({ ic, a, b }: { ic: React.ReactNode; a: string; b?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div className="bell-ic" style={{ background: 'var(--surface3)', color: 'var(--muted)', width: 32, height: 32 }}>{ic}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: 'var(--text)' }}>{a}</div>
        {b && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{b}</div>}
      </div>
    </div>
  )
}
