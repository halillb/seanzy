import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Phone, Mail, AtSign, Clock, Pencil } from 'lucide-react'
import { apiGet } from '../lib/api'
import { telGoster } from '../lib/text'
import { trTarih } from '../lib/tarih'

export interface MusteriOzet {
  id: number; ad: string; soyad?: string; ad_soyad?: string
  telefon?: string; email?: string; instagram?: string
  kaynak?: string; kaynak_detay?: string; notlar?: string; indirim?: number
}
interface Randevu {
  id: number; musteri_id?: number; hizmet_ad?: string; personel_ad?: string
  tarih?: string; baslangic?: string; fiyat?: number | string; durum: string
}
interface MusteriPaket {
  id: number; hizmet?: { ad_tr?: string }; toplam_seans: number; kalan_seans: number
  toplam_tutar?: number | string; bitis_tarihi?: string
}

const tl = (n?: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'
const saat = (s?: string) => (s ? s.slice(0, 5) : '')
const KAYNAK_AD: Record<string, string> = { reklam: 'Reklam', eski_musteri: 'Eski Müşteri', referans: 'Referans', tabela: 'Tabela', diger: 'Diğer' }
const DURUM: Record<string, [string, string]> = {
  bekliyor: ['Bekliyor', 'badge-gold'], onaylandi: ['Onaylı', 'badge-green'],
  tamamlandi: ['Tamamlandı', 'badge-blue'], iptal: ['İptal', 'badge-red'], gelmedi: ['Gelmedi', 'badge-muted'],
}

interface Props { musteri: MusteriOzet; onClose: () => void; onEdit?: () => void }

export default function MusteriDetay({ musteri: m, onEdit }: Props) {
  const randevular = useQuery({ queryKey: ['randevular'], queryFn: () => apiGet<Randevu[]>('randevu.php', 'liste') })
  const paketler = useQuery({ queryKey: ['musteri-paketleri', m.id], queryFn: () => apiGet<MusteriPaket[]>('musteri.php', 'paketleri', { musteri_id: m.id }) })

  const benimRandevular = useMemo(
    () => (randevular.data ?? []).filter((r) => r.musteri_id === m.id)
      .sort((a, b) => `${b.tarih || ''} ${b.baslangic || ''}`.localeCompare(`${a.tarih || ''} ${a.baslangic || ''}`)),
    [randevular.data, m.id],
  )

  const stat = useMemo(() => {
    const tamam = benimRandevular.filter((r) => r.durum === 'tamamlandi')
    const harcamaRnd = tamam.reduce((t, r) => t + Number(r.fiyat || 0), 0)
    const harcamaPaket = (paketler.data ?? []).reduce((t, p) => t + Number(p.toplam_tutar || 0), 0)
    const sonZiyaret = tamam[0]?.tarih || benimRandevular[0]?.tarih
    const aktifPaket = (paketler.data ?? []).filter((p) => p.kalan_seans > 0).length
    return { toplam: benimRandevular.length, tamam: tamam.length, harcama: harcamaRnd + harcamaPaket, sonZiyaret, aktifPaket }
  }, [benimRandevular, paketler.data])

  const ad = m.ad_soyad || `${m.ad} ${m.soyad || ''}`.trim()
  const ini = ((m.ad?.[0] || '') + (m.soyad?.[0] || '')).toUpperCase()

  return (
    <>
    <div className="modal-b" style={{ paddingTop: 4 }}>
      {/* Üst kart */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
        <div className="sb-av" style={{ width: 56, height: 56, fontSize: 20, flexShrink: 0 }}>{ini || '–'}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{ad}</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 5, fontSize: 12.5, color: 'var(--text2)' }}>
            {m.telefon && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={13} />{telGoster(m.telefon)}</span>}
            {m.email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={13} />{m.email}</span>}
            {m.instagram && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><AtSign size={13} />{m.instagram}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {m.kaynak && <span className="badge badge-gold">{KAYNAK_AD[m.kaynak] || m.kaynak}{m.kaynak_detay ? ` · ${m.kaynak_detay}` : ''}</span>}
            {!!m.indirim && <span className="badge badge-green">%{m.indirim} indirim</span>}
          </div>
        </div>
      </div>

      {/* İstatistik özeti — kompakt tek satır */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: 18, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, fontSize: 12.5 }}>
        <span><b>{stat.tamam}/{stat.toplam}</b> <span style={{ color: 'var(--muted)' }}>randevu</span></span>
        <span style={{ color: 'var(--gold-text)', fontWeight: 600 }}>{tl(stat.harcama)} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>harcama</span></span>
        <span><span style={{ color: 'var(--muted)' }}>son ziyaret:</span> {stat.sonZiyaret ? trTarih(stat.sonZiyaret) : '—'}</span>
        <span><b>{stat.aktifPaket}</b> <span style={{ color: 'var(--muted)' }}>aktif paket</span></span>
      </div>

      {/* Aktif paketler */}
      {(paketler.data ?? []).filter((p) => p.kalan_seans > 0).length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <Baslik>Aktif Paketler</Baslik>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(paketler.data ?? []).filter((p) => p.kalan_seans > 0).map((p) => {
              const oran = p.toplam_seans ? ((p.toplam_seans - p.kalan_seans) / p.toplam_seans) * 100 : 0
              return (
                <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}>
                    <span style={{ fontWeight: 500 }}>{p.hizmet?.ad_tr || 'Paket'}</span>
                    <span style={{ color: 'var(--gold-text)' }}><b>{p.kalan_seans}</b>/{p.toplam_seans} seans · son {trTarih(p.bitis_tarihi)}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--surface3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${oran}%`, background: 'var(--gold)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notlar */}
      {m.notlar && (
        <div style={{ marginBottom: 18 }}>
          <Baslik>Not</Baslik>
          <div style={{ fontSize: 13, color: 'var(--text2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 13px', whiteSpace: 'pre-wrap' }}>{m.notlar}</div>
        </div>
      )}

      {/* Geçmiş randevular */}
      <Baslik>Randevu Geçmişi {stat.toplam > 0 ? `(${stat.toplam})` : ''}</Baslik>
      {randevular.isLoading ? (
        <div style={{ height: 80, opacity: 0.4 }} />
      ) : benimRandevular.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '14px 0' }}>Henüz randevu kaydı yok.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 280, overflowY: 'auto' }}>
          {benimRandevular.map((r) => {
            const [lbl, cls] = DURUM[r.durum] || [r.durum, 'badge-muted']
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9 }}>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', minWidth: 92, display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} />{trTarih(r.tarih)} {saat(r.baslangic)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.hizmet_ad || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.personel_ad || ''}</div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{tl(r.fiyat)}</div>
                <span className={`badge ${cls}`}>{lbl}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
    {onEdit && (
      <div className="modal-f">
        <button className="btn btn-gold" onClick={onEdit}><Pencil size={15} /> Düzenle</button>
      </div>
    )}
    </>
  )
}

function Baslik({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.03em' }}>{children}</div>
}
