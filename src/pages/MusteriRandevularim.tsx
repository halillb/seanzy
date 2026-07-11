import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Clock, Scissors, Package, Plus, CalendarCheck, TrendingUp, Star, User, X, ExternalLink } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import { useAuth } from '../store/auth'
import { apiGet, apiPost } from '../lib/api'
import { trTarihGun, trTarih, trSaat } from '../lib/tarih'
import { useT } from '../lib/ceviri'

interface Randevu {
  id: number; hizmet_ad?: string; personel_ad?: string; tarih?: string
  baslangic?: string; bitis?: string; fiyat?: number | string; durum: string
}
interface MusteriPaket { id: number; hizmet?: { ad_tr?: string }; toplam_seans: number; kalan_seans: number; bitis_tarihi?: string }
interface GecmisOzet { toplam_harcama: number; seans_sayisi: number; son_ziyaret?: string; en_cok_personel?: string }

const tl = (n?: number | string) => Number(n || 0).toLocaleString('tr-TR') + ' ₺'
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const DURUM_CLS: Record<string, string> = {
  bekliyor: 'badge-gold', onaylandi: 'badge-green', tamamlandi: 'badge-blue',
  iptal: 'badge-red', gelmedi: 'badge-muted', iptal_talebi: 'badge-red',
}
const DURUM_KEY: Record<string, string> = {
  bekliyor: 'durum.onayBekliyor', onaylandi: 'durum.onaylandi', tamamlandi: 'durum.tamamlandi',
  iptal: 'durum.iptal', gelmedi: 'durum.gelmedi',
}

export default function MusteriRandevularim() {
  const nav = useNavigate()
  const t = useT()
  const qc = useQueryClient()
  const id = useAuth((s) => s.user?.id)
  const ad = useAuth((s) => s.user?.ad)

  const randevular = useQuery({ queryKey: ['randevular'], queryFn: () => apiGet<Randevu[]>('randevu.php', 'liste') })
  const paketler = useQuery({
    queryKey: ['musteri-paketleri', id],
    queryFn: () => apiGet<MusteriPaket[]>('musteri.php', 'paketleri', { musteri_id: Number(id) }),
    enabled: !!id,
  })
  const ozet = useQuery({
    queryKey: ['musteri-gecmis-ozet', id],
    queryFn: () => apiGet<GecmisOzet>('musteri.php', 'gecmis_ozet'),
    enabled: !!id,
  })

  const [iptalModal, setIptalModal] = useState<Randevu | null>(null)
  const [iptalNeden, setIptalNeden] = useState('')
  const [iptalHata, setIptalHata] = useState('')

  const [gecmisAcikId, setGecmisAcikId] = useState<number | null>(null)

  const [anketModal, setAnketModal] = useState<Randevu | null>(null)
  const [anketPuan, setAnketPuan] = useState(0)
  const [anketYorum, setAnketYorum] = useState('')
  const [anketGoogleLink, setAnketGoogleLink] = useState<string | null>(null)
  const [anketHata, setAnketHata] = useState('')

  const anketMutation = useMutation({
    mutationFn: ({ randevuId, puan, yorum }: { randevuId: number; puan: number; yorum: string }) =>
      apiPost<{ google_link?: string | null }>('anket.php', 'yanit_ekle', { randevu_id: randevuId, puan, yorum }),
    onSuccess: (data) => {
      setAnketGoogleLink((data as { google_link?: string | null })?.google_link ?? null)
      qc.invalidateQueries({ queryKey: ['musteri-gecmis-ozet'] })
    },
    onError: (e) => setAnketHata((e as Error).message || 'Gönderilemedi.'),
  })

  const iptalMutation = useMutation({
    mutationFn: ({ id, neden }: { id: number; neden: string }) =>
      apiPost('randevu.php', 'musteri_iptal', { id, neden }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['randevular'] })
      qc.invalidateQueries({ queryKey: ['musteri-gecmis-ozet'] })
      setIptalModal(null)
      setIptalNeden('')
    },
    onError: (e) => setIptalHata((e as Error).message || 'İşlem başarısız.'),
  })

  const today = toISO(new Date())
  const { gelecek, gecmis } = useMemo(() => {
    const arr = [...(randevular.data ?? [])]
    const gelecek = arr
      .filter((r) => (r.tarih || '') >= today && !['iptal', 'iptal_talebi'].includes(r.durum))
      .sort((a, b) => `${a.tarih} ${a.baslangic}`.localeCompare(`${b.tarih} ${b.baslangic}`))
    const gecmis = arr
      .filter((r) => (r.tarih || '') < today || ['iptal', 'iptal_talebi'].includes(r.durum))
      .sort((a, b) => `${b.tarih} ${b.baslangic}`.localeCompare(`${a.tarih} ${a.baslangic}`))
    return { gelecek, gecmis }
  }, [randevular.data, today])

  const aktifPaket = (paketler.data ?? []).filter((p) => p.kalan_seans > 0)
  const o = ozet.data

  function iptalAc(r: Randevu) {
    setIptalNeden('')
    setIptalHata('')
    setIptalModal(r)
  }

  function anketAc(r: Randevu) {
    setAnketPuan(0)
    setAnketYorum('')
    setAnketHata('')
    setAnketGoogleLink(null)
    setAnketModal(r)
  }

  return (
    <>
      <Topbar title={`${t('mp.merhaba')} ${ad || ''}`} subtitle={t('mp.altbaslik')} search={false} cta={t('nav.randevuAl')} onCta={() => nav('/randevu-al')} />
      <div className="page">

        {/* Özet kartları */}
        {o && (o.seans_sayisi > 0 || o.toplam_harcama > 0) && (
          <div className="metric-grid">
            {o.seans_sayisi > 0 && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  <div className="bell-ic" style={{ background: 'rgba(201,169,110,.12)', color: 'var(--gold)', width: 32, height: 32 }}><Star size={16} /></div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold-text)' }}>{o.seans_sayisi}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Tamamlanan Seans</div>
              </div>
            )}
            {o.toplam_harcama > 0 && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  <div className="bell-ic" style={{ background: 'rgba(46,204,113,.1)', color: 'var(--green)', width: 32, height: 32 }}><TrendingUp size={16} /></div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{tl(o.toplam_harcama)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Toplam Harcama</div>
              </div>
            )}
            {o.en_cok_personel && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  <div className="bell-ic" style={{ background: 'rgba(100,149,237,.1)', color: '#6495ED', width: 32, height: 32 }}><User size={16} /></div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{o.en_cok_personel}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Favori Personel</div>
              </div>
            )}
            {o.son_ziyaret && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  <div className="bell-ic" style={{ background: 'rgba(201,169,110,.12)', color: 'var(--gold)', width: 32, height: 32 }}><Clock size={16} /></div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{trTarih(o.son_ziyaret)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Son Ziyaret</div>
              </div>
            )}
          </div>
        )}

        {/* Aktif paketler */}
        {aktifPaket.length > 0 && (
          <div>
            <Baslik><Package size={13} /> {t('mp.aktifPaketler')}</Baslik>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
              {aktifPaket.map((p) => {
                const oran = p.toplam_seans ? ((p.toplam_seans - p.kalan_seans) / p.toplam_seans) * 100 : 0
                const acikMi = gecmisAcikId === p.id
                return (
                  <div key={p.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                      <div className="bell-ic" style={{ background: 'rgba(201,169,110,.12)', color: 'var(--gold)', width: 32, height: 32 }}><Package size={16} /></div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.hizmet?.ad_tr || 'Paket'}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: 'var(--gold-text)', fontWeight: 500 }}>{p.kalan_seans}/{p.toplam_seans} {t('mp.seansKaldi')}</span>
                      <span style={{ color: 'var(--muted)' }}>{p.bitis_tarihi ? `${t('mp.son')} ${trTarih(p.bitis_tarihi)}` : ''}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'var(--surface3)', overflow: 'hidden', marginBottom: 8 }}><div style={{ height: '100%', width: `${oran}%`, background: 'var(--gold)' }} /></div>
                    <button type="button" onClick={() => setGecmisAcikId(acikMi ? null : p.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-text)', fontSize: 11.5, fontFamily: 'inherit', padding: 0 }}>
                      {acikMi ? 'Geçmişi Gizle' : 'Seans Geçmişi'}
                    </button>
                    {acikMi && <SeansGecmisi musteriPaketId={p.id} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Yaklaşan randevular */}
        <div>
          <Baslik><CalendarCheck size={13} /> {t('mp.yaklasan')}</Baslik>
          {randevular.isLoading ? <div className="panel" style={{ height: 90, opacity: 0.4 }} />
            : gelecek.length === 0 ? (
              <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                <CalendarCheck size={28} style={{ opacity: 0.4, marginBottom: 8 }} /><br />
                {t('mp.yaklasanYok')} <a onClick={() => nav('/randevu-al')} style={{ color: 'var(--gold-text)', cursor: 'pointer' }}>{t('mp.randevuAlLink')} →</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {gelecek.map((r) => (
                  <RandevuSatir key={r.id} r={r} t={t} onIptal={() => iptalAc(r)} />
                ))}
              </div>
            )}
        </div>

        {/* Geçmiş randevular */}
        {gecmis.length > 0 && (
          <div>
            <Baslik><Clock size={13} /> {t('mp.gecmis')}</Baslik>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gecmis.slice(0, 20).map((r) => (
                <RandevuSatir key={r.id} r={r} soluk t={t} onAnket={r.durum === 'tamamlandi' ? () => anketAc(r) : undefined} />
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-gold" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/randevu-al')}>
          <Plus size={16} /> {t('mp.yeniRandevu')}
        </button>
      </div>

      {/* Anket modal */}
      <Modal open={!!anketModal} onClose={() => setAnketModal(null)} title="Hizmetimizi Değerlendirin">
        <div className="modal-b">
          {anketHata && <div className="form-err" style={{ marginBottom: 12 }}>{anketHata}</div>}

          {anketGoogleLink !== undefined && anketMutation.isSuccess ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🌟</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Teşekkür ederiz!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Değerlendirmeniz kaydedildi.</div>
              {anketGoogleLink && (
                <a href={anketGoogleLink} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: '#4285F4', color: '#fff', textDecoration: 'none', fontSize: 13.5, fontWeight: 500 }}>
                  <ExternalLink size={15} /> Google'da da Değerlendirin
                </a>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 16, textAlign: 'center' }}>
                {anketModal?.hizmet_ad || 'Randevu'} için memnuniyetinizi paylaşın
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setAnketPuan(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Star size={32} fill={i <= anketPuan ? '#F59E0B' : 'none'} stroke={i <= anketPuan ? '#F59E0B' : 'var(--border)'} />
                  </button>
                ))}
              </div>
              <div className="field">
                <label>Yorumunuz <span style={{ color: 'var(--muted)', fontSize: 11 }}>(isteğe bağlı)</span></label>
                <textarea className="input" rows={3} value={anketYorum} onChange={(e) => setAnketYorum(e.target.value)} placeholder="Deneyiminizi paylaşın…" />
              </div>
            </>
          )}
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={() => setAnketModal(null)}>
            {anketMutation.isSuccess ? 'Kapat' : 'Vazgeç'}
          </button>
          {!anketMutation.isSuccess && (
            <button className="btn btn-gold" disabled={anketPuan === 0 || anketMutation.isPending}
              onClick={() => anketModal && anketMutation.mutate({ randevuId: anketModal.id, puan: anketPuan, yorum: anketYorum })}>
              {anketMutation.isPending ? <span className="spin" /> : <><Star size={14} /> Gönder</>}
            </button>
          )}
        </div>
      </Modal>

      {/* İptal modal */}
      <Modal open={!!iptalModal} onClose={() => setIptalModal(null)} title={iptalModal?.durum === 'bekliyor' ? 'Randevuyu İptal Et' : 'İptal Talebi Gönder'}>
        <div className="modal-b">
          {iptalHata && <div className="form-err" style={{ marginBottom: 12 }}>{iptalHata}</div>}
          {iptalModal?.durum === 'onaylandi' && (
            <div style={{ fontSize: 13, color: 'var(--text2)', background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
              Onaylı randevular için müdüre iptal talebi gönderilir. En kısa sürede işleme alınacaktır.
            </div>
          )}
          <div className="field">
            <label>İptal Nedeni <span style={{ color: 'var(--muted)', fontSize: 11 }}>(isteğe bağlı)</span></label>
            <input className="input" placeholder="Neden iptal etmek istiyorsunuz?" value={iptalNeden} onChange={(e) => setIptalNeden(e.target.value)} />
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={() => setIptalModal(null)}>Vazgeç</button>
          <button
            className="btn"
            style={{ background: 'rgba(255,90,90,.15)', color: '#ff6b6b', border: '1px solid rgba(255,90,90,.3)' }}
            disabled={iptalMutation.isPending}
            onClick={() => iptalModal && iptalMutation.mutate({ id: iptalModal.id, neden: iptalNeden })}
          >
            {iptalMutation.isPending ? <span className="spin" /> : <><X size={15} /> {iptalModal?.durum === 'bekliyor' ? 'İptal Et' : 'Talep Gönder'}</>}
          </button>
        </div>
      </Modal>
    </>
  )
}

function RandevuSatir({ r, soluk, t, onIptal, onAnket }: { r: Randevu; soluk?: boolean; t: (k: string) => string; onIptal?: () => void; onAnket?: () => void }) {
  const cls = DURUM_CLS[r.durum] || 'badge-muted'
  const lbl = r.durum === 'iptal_talebi' ? 'İptal Talebi' : (DURUM_KEY[r.durum] ? t(DURUM_KEY[r.durum]) : r.durum)
  const iptalYapilabilir = onIptal && ['bekliyor', 'onaylandi'].includes(r.durum)

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', opacity: soluk ? 0.7 : 1 }}>
      <div style={{ textAlign: 'center', minWidth: 70 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{trSaat(r.baslangic)}</div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'capitalize' }}>{trTarihGun(r.tarih).replace(/ \w+$/, '')}</div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Scissors size={13} style={{ color: 'var(--muted)' }} />{r.hizmet_ad || 'Randevu'}
        </div>
        {r.personel_ad && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{r.personel_ad}</div>}
      </div>
      {!!Number(r.fiyat) && <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gold-text)' }}>{tl(r.fiyat)}</div>}
      <span className={`badge ${cls}`}>{lbl}</span>
      {iptalYapilabilir && (
        <button className="btn btn-ghost" onClick={onIptal} title="İptal"
          style={{ padding: '4px 8px', color: '#ff8a7d', flexShrink: 0 }}>
          <X size={14} />
        </button>
      )}
      {onAnket && (
        <button className="btn btn-ghost" onClick={onAnket} title="Değerlendir"
          style={{ padding: '4px 8px', color: '#F59E0B', flexShrink: 0 }}>
          <Star size={14} />
        </button>
      )}
    </div>
  )
}

function Baslik({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {children}
    </div>
  )
}

interface SeansHareket { id: number; tip: string; miktar: number; aciklama?: string; olusturan?: string; tarih?: string }
const SEANS_TIP_AD: Record<string, string> = { dusum: 'Seans kullanıldı', ekleme: 'Seans eklendi', azaltma: 'Seans azaltıldı', tamamla: 'Kür tamamlandı', iptal: 'İptal edildi' }

function SeansGecmisi({ musteriPaketId }: { musteriPaketId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['seans-gecmisi', musteriPaketId],
    queryFn: () => apiGet<SeansHareket[]>('musteri.php', 'seans_gecmisi', { musteri_paket_id: musteriPaketId }),
  })
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {isLoading && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Yükleniyor…</div>}
      {!isLoading && (data ?? []).length === 0 && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Henüz hareket yok.</div>}
      {(data ?? []).map((h) => (
        <div key={h.id} style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between', color: 'var(--text2)' }}>
          <span>{SEANS_TIP_AD[h.tip] || h.tip}{h.aciklama ? ` — ${h.aciklama}` : ''}</span>
          <span style={{ color: 'var(--faint)', flexShrink: 0, marginLeft: 8 }}>{h.tarih}</span>
        </div>
      ))}
    </div>
  )
}
