import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, MessageSquare, TrendingUp, Settings2, Send, ChevronDown, ChevronUp, MapPin, BarChart3, User, Scissors, AtSign } from 'lucide-react'
import Topbar from '../components/Topbar'
import PaketEngeli from '../components/PaketEngeli'
import { useErisim } from '../hooks/useErisim'
import { apiGet, apiPost } from '../lib/api'

interface AnketYanit {
  id: number
  musteri_ad?: string
  personel_ad?: string
  hizmet_ad?: string
  puan: number        // 1-5
  yorum?: string
  created_at: string
}

interface AnketIstatistik {
  ortalama: number
  toplam: number
  dagilim: { puan: number; sayi: number; oran: number }[]
  aylik_trend: { ay: string; sayi: number; ortalama: number | null }[]
}

interface AnketAyar {
  aktif: boolean
  gonderim_saati: number
  hatirlatma: boolean
  soru_metni: string
  google_harita_link?: string
  instagram_url?: string
}

interface KaynakRoiKaynak {
  kaynak: string; toplam: number; tamamlanan: number
  ciro: number; iptal: number; donusum: number; ciro_payi: number
}
interface KaynakRoi {
  donem_gun: number; kaynaklar: KaynakRoiKaynak[]; toplam_ciro: number
  haftalik_trend: { hafta: string; online: number; diger: number }[]
}

function PuanYildiz({ puan, buyuk = false }: { puan: number; buyuk?: boolean }) {
  const s = buyuk ? 18 : 13
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={s} fill={i <= puan ? '#F59E0B' : 'none'} stroke={i <= puan ? '#F59E0B' : 'var(--border)'} />
      ))}
    </div>
  )
}

export default function Anket() {
  const erisim = useErisim('anket')
  const qc = useQueryClient()
  const [tab, setTab] = useState<'yorumlar' | 'istatistik' | 'kaynak' | 'ayarlar'>('istatistik')
  const [filtrePuan, setFiltrePuan] = useState<number | null>(null)
  const [acikYorum, setAcikYorum] = useState<number | null>(null)
  const [hata, setHata] = useState('')

  const { data: istatistik } = useQuery<AnketIstatistik>({
    queryKey: ['anket-istatistik'],
    queryFn: () => apiGet<AnketIstatistik>('anket.php', 'istatistik'),
    enabled: erisim,
  })

  const { data: yanitlar = [], isLoading } = useQuery({
    queryKey: ['anket-yanitlar', filtrePuan],
    queryFn: () => apiGet<AnketYanit[]>('anket.php', 'yanitlar', filtrePuan ? { puan: filtrePuan } : undefined),
    enabled: erisim && tab === 'yorumlar',
  })

  const [roiGun, setRoiGun] = useState(90)
  const { data: kaynakRoi } = useQuery<KaynakRoi>({
    queryKey: ['kaynak-roi', roiGun],
    queryFn: () => apiGet<KaynakRoi>('rapor.php', 'kaynak_roi', { gun: roiGun }),
    enabled: erisim && tab === 'kaynak',
  })

  const { data: ayar } = useQuery<AnketAyar>({
    queryKey: ['anket-ayar'],
    queryFn: () => apiGet<AnketAyar>('anket.php', 'ayar'),
    enabled: erisim,
  })

  const ayarGuncelle = useMutation({
    mutationFn: (a: AnketAyar) => apiPost('anket.php', 'ayar_guncelle', a as unknown as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anket-ayar'] }),
    onError: (e) => setHata((e as Error).message),
  })

  const puanRenk = (p: number) => p >= 4 ? 'var(--green)' : p === 3 ? 'var(--gold)' : '#ff8a7d'

  if (!erisim) return <><Topbar title="Memnuniyet Anketleri" subtitle="Randevu sonrası geri bildirim" search={false} /><PaketEngeli ozellik="anket" /></>

  return (
    <>
      <Topbar title="Memnuniyet Anketleri" subtitle="Randevu sonrası müşteri geri bildirimi" search={false} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        {([['istatistik', 'İstatistik'], ['yorumlar', 'Yorumlar'], ['kaynak', 'Kaynak ROI'], ['ayarlar', 'Ayarlar']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: tab === k ? 600 : 400, color: tab === k ? 'var(--gold-text)' : 'var(--text2)', borderBottom: tab === k ? '2px solid var(--gold)' : '2px solid transparent', marginBottom: -1 }}>
            {l}
          </button>
        ))}
      </div>

      <div className="page">
        {hata && <div className="form-err" style={{ marginBottom: 12 }}>{hata}<button onClick={() => setHata('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}

        {/* ── İstatistik ── */}
        {tab === 'istatistik' && (
          <>
            {!istatistik ? (
              <div className="panel" style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>Henüz yanıt yok. Ayarları yapıp anketi aktif hale getirin.</div>
            ) : (
              <>
                {/* Ana skor */}
                <div className="anket-skor-grid">
                  <div className="panel" style={{ padding: '28px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 56, fontWeight: 800, color: puanRenk(istatistik.ortalama), lineHeight: 1 }}>
                      {istatistik.ortalama.toFixed(1)}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
                      <PuanYildiz puan={Math.round(istatistik.ortalama)} buyuk />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{istatistik.toplam} yanıt</div>
                  </div>

                  {/* Puan dağılımı */}
                  <div className="panel" style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Puan Dağılımı</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[5, 4, 3, 2, 1].map((p) => {
                        const item = istatistik.dagilim.find((d) => d.puan === p)
                        const sayi = item?.sayi ?? 0
                        const oran = item?.oran ?? 0
                        const r = puanRenk(p)
                        return (
                          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, width: 70, flexShrink: 0 }}>
                              {[1,2,3,4,5].map((i) => <Star key={i} size={12} fill={i<=p?'#F59E0B':'none'} stroke={i<=p?'#F59E0B':'var(--border)'} />)}
                            </div>
                            <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--surface3)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${oran}%`, background: r, borderRadius: 5, transition: 'width 1s ease' }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text2)', width: 28, textAlign: 'right', flexShrink: 0 }}>{sayi}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Aylık trend */}
                {(istatistik.aylik_trend ?? []).some((t) => t.sayi > 0) && (
                  <div className="panel" style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TrendingUp size={15} style={{ color: 'var(--gold)' }} /> Aylık Puan Trendi
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
                      {istatistik.aylik_trend.map((t) => {
                        const puan = t.ortalama ?? 0
                        const h = (puan / 5) * 68
                        const r = puanRenk(puan)
                        return (
                          <div key={t.ay} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{puan > 0 ? puan.toFixed(1) : ''}</div>
                            <div style={{ width: '100%', height: h || 4, borderRadius: '4px 4px 0 0', background: r, opacity: .8 }} />
                            <div style={{ fontSize: 10, color: 'var(--faint)' }}>{t.ay}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Yorumlar ── */}
        {tab === 'yorumlar' && (
          <>
            {/* Puan filtresi */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setFiltrePuan(null)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', background: filtrePuan === null ? 'rgba(201,169,110,.15)' : 'var(--surface)', border: `1px solid ${filtrePuan === null ? 'rgba(201,169,110,.4)' : 'var(--border)'}`, color: filtrePuan === null ? 'var(--gold-text)' : 'var(--text2)' }}>
                Tümü
              </button>
              {[5, 4, 3, 2, 1].map((p) => (
                <button key={p} onClick={() => setFiltrePuan(filtrePuan === p ? null : p)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, background: filtrePuan === p ? `color-mix(in srgb, ${puanRenk(p)} 15%, transparent)` : 'var(--surface)', border: `1px solid ${filtrePuan === p ? puanRenk(p) : 'var(--border)'}`, color: filtrePuan === p ? puanRenk(p) : 'var(--text2)' }}>
                  <Star size={11} fill={filtrePuan === p ? puanRenk(p) : 'none'} stroke="currentColor" /> {p} yıldız
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isLoading && [...Array(3)].map((_, i) => <div key={i} className="panel" style={{ height: 80, opacity: .4 }} />)}
              {!isLoading && yanitlar.length === 0 && (
                <div className="panel" style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>
                  <MessageSquare size={32} style={{ marginBottom: 12, opacity: .4 }} />
                  <div>Henüz yorum yok.</div>
                </div>
              )}
              {yanitlar.map((y) => (
                <div key={y.id} className="panel" style={{ padding: '14px 18px', cursor: y.yorum ? 'pointer' : 'default' }}
                  onClick={() => y.yorum && setAcikYorum(acikYorum === y.id ? null : y.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <PuanYildiz puan={y.puan} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>{y.musteri_ad || 'Anonim'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 1 }}>
                        {y.personel_ad && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><User size={11} /> {y.personel_ad}</span>}
                        {y.hizmet_ad && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Scissors size={11} /> {y.hizmet_ad}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--faint)', textAlign: 'right', flexShrink: 0 }}>
                      {y.created_at?.slice(0, 10)}
                    </div>
                    {y.yorum && (acikYorum === y.id ? <ChevronUp size={14} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted)' }} />)}
                  </div>
                  {acikYorum === y.id && y.yorum && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: `3px solid ${puanRenk(y.puan)}` }}>
                      "{y.yorum}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Kaynak ROI ── */}
        {tab === 'kaynak' && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Dönem:</span>
              {[30, 90, 180, 365].map((g) => (
                <button key={g} onClick={() => setRoiGun(g)}
                  style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', background: roiGun === g ? 'rgba(201,169,110,.15)' : 'var(--surface)', border: `1px solid ${roiGun === g ? 'rgba(201,169,110,.4)' : 'var(--border)'}`, color: roiGun === g ? 'var(--gold-text)' : 'var(--text2)' }}>
                  {g} gün
                </button>
              ))}
            </div>

            {!kaynakRoi ? (
              <div className="panel" style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>Yükleniyor…</div>
            ) : (
              <>
                {/* Kaynak tablosu */}
                <div className="panel" style={{ padding: '6px 8px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BarChart3 size={13} /> Müşteri Kaynağı Analizi — Son {kaynakRoi.donem_gun} gün
                  </div>
                  <table className="tbl">
                    <thead><tr>
                      <th>Kaynak</th><th>Randevu</th><th>Tamamlanan</th><th>Dönüşüm</th><th>Ciro</th><th>Ciro Payı</th>
                    </tr></thead>
                    <tbody>
                      {kaynakRoi.kaynaklar.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Veri yok</td></tr>
                      )}
                      {kaynakRoi.kaynaklar.map((k) => (
                        <tr key={k.kaynak}>
                          <td><span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{k.kaynak}</span></td>
                          <td>{k.toplam}</td>
                          <td>{k.tamamlanan}</td>
                          <td>
                            <span style={{ color: k.donusum >= 70 ? 'var(--green)' : k.donusum >= 40 ? 'var(--gold-text)' : '#ff8a7d', fontWeight: 500 }}>
                              %{k.donusum}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{Number(k.ciro).toLocaleString('tr-TR')} ₺</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ height: 6, width: 80, borderRadius: 3, background: 'var(--surface3)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${k.ciro_payi}%`, background: 'var(--gold)', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--text2)' }}>%{k.ciro_payi}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Online vs Diğer trend */}
                {kaynakRoi.haftalik_trend.length > 0 && (
                  <div className="panel" style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TrendingUp size={14} style={{ color: 'var(--gold)' }} /> Online vs Diğer (haftalık)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                      {kaynakRoi.haftalik_trend.map((h) => {
                        const mx = Math.max(...kaynakRoi.haftalik_trend.map((x) => x.online + x.diger), 1)
                        const onlineH = Math.round((h.online / mx) * 70)
                        const digerH = Math.round((h.diger / mx) * 70)
                        return (
                          <div key={h.hafta} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2, height: 72 }}>
                              <div style={{ width: '45%', height: onlineH || 2, background: 'var(--gold)', borderRadius: '3px 3px 0 0', opacity: .85 }} title={`Online: ${h.online}`} />
                              <div style={{ width: '45%', height: digerH || 2, background: '#6495ED', borderRadius: '3px 3px 0 0', opacity: .75 }} title={`Diğer: ${h.diger}`} />
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 4 }}>{h.hafta}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11.5, color: 'var(--text2)' }}>
                      <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--gold)', marginRight: 4 }} />Online</span>
                      <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#6495ED', marginRight: 4 }} />Diğer</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Ayarlar ── */}
        {tab === 'ayarlar' && (
          <div style={{ maxWidth: 500 }}>
            {ayar && <AnketAyarFormu ayar={ayar} onKaydet={(a) => ayarGuncelle.mutate(a)} yukleniyor={ayarGuncelle.isPending} />}
          </div>
        )}
      </div>
    </>
  )
}

function AnketAyarFormu({ ayar, onKaydet, yukleniyor }: { ayar: AnketAyar; onKaydet: (a: AnketAyar) => void; yukleniyor: boolean }) {
  const [f, setF] = useState(ayar)
  return (
    <div className="panel" style={{ padding: '22px 24px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Settings2 size={16} style={{ color: 'var(--gold)' }} /> Anket Ayarları
      </div>

      {/* Aktif toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, padding: '12px 14px', background: 'var(--surface)', borderRadius: 10 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Anket Gönderimi</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Tamamlanan randevulara otomatik anket gönder</div>
        </div>
        <button onClick={() => setF({ ...f, aktif: !f.aktif })}
          style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: f.aktif ? 'var(--gold)' : 'var(--surface3)', transition: 'background .2s', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: f.aktif ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
        </button>
      </div>

      <div className="field" style={{ margin: '0 0 14px' }}>
        <label>Gönderim Süresi <span style={{ fontSize: 11, color: 'var(--muted)' }}>(randevu bitiminden kaç saat sonra)</span></label>
        <input className="input" type="number" min={0} max={72} value={f.gonderim_saati} onChange={(e) => setF({ ...f, gonderim_saati: +e.target.value })} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <label style={{ fontSize: 13.5, cursor: 'pointer', userSelect: 'none' }}>Hatırlatma gönder (24 saat sonra yanıt gelmezse)</label>
        <button onClick={() => setF({ ...f, hatirlatma: !f.hatirlatma })}
          style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: f.hatirlatma ? 'var(--gold)' : 'var(--surface3)', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: f.hatirlatma ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.3)', transition: 'left .2s' }} />
        </button>
      </div>

      <div className="field" style={{ margin: '0 0 20px' }}>
        <label>Anket Sorusu</label>
        <textarea className="input" rows={3} value={f.soru_metni} onChange={(e) => setF({ ...f, soru_metni: e.target.value })} placeholder="Örn: Hizmetimizden ne kadar memnun kaldınız?" />
      </div>

      <div className="field" style={{ margin: '0 0 14px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin size={13} style={{ color: '#4285F4' }} /> Google Haritalar Linki <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>(4-5 yıldız verince gösterilir)</span>
        </label>
        <input className="input" placeholder="https://g.page/r/..." value={f.google_harita_link ?? ''} onChange={(e) => setF({ ...f, google_harita_link: e.target.value })} />
        {f.google_harita_link && (
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
            Google Haritalar → İşletmenizi bulun → "Değerlendirme yaz" butonuna sağ tıkla → Linki kopyala
          </div>
        )}
      </div>

      <div className="field" style={{ margin: '0 0 14px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <AtSign size={13} style={{ color: '#E1306C' }} /> Instagram Profil Linki <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>(müşteri panelinde gösterilir)</span>
        </label>
        <input className="input" placeholder="https://instagram.com/isletmeniz" value={f.instagram_url ?? ''} onChange={(e) => setF({ ...f, instagram_url: e.target.value })} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(201,169,110,.06)', borderRadius: 8, marginBottom: 18, fontSize: 12, color: 'var(--text2)' }}>
        <Send size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
        Müşterilere bildirim kanalından (SMS/WhatsApp/e-posta) gönderilir. Bildirim ayarlarından kanal seçebilirsiniz.
      </div>

      <button className="btn btn-gold" disabled={yukleniyor} onClick={() => onKaydet(f)} style={{ width: '100%', justifyContent: 'center' }}>
        {yukleniyor ? <span className="spin" /> : 'Kaydet'}
      </button>
    </div>
  )
}
