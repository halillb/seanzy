import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Select from '../components/Select'
import {
  Bell, Send, Clock, Settings2, Check, ChevronDown, ChevronUp,
  RotateCcw, AlertCircle, MessageSquare,
  Smartphone, Mail, Info, ExternalLink,
} from 'lucide-react'
import Topbar from '../components/Topbar'
import { apiGet, apiPost } from '../lib/api'
import { confirmAsync } from '../lib/confirm'

interface Sablon {
  kod: string; ad: string; hedef: 'musteri' | 'personel'; zamanlama: 'cron' | 'olay' | 'manuel'
  aktif: boolean; baslik: string; icerik: string; kanal: string; ozellestirildi: boolean
}
interface Log {
  id: number; tetikleyici: string; kanal: string; hedef_tipi: string; hedef_ad: string
  hedef_telefon?: string; hedef_email?: string; icerik: string; durum: string; hata?: string
  created_at: string
}

const TETIKLEYICI_GRUBU: { baslik: string; kodlar: string[] }[] = [
  { baslik: 'Randevu Bildirimleri', kodlar: ['randevu_olusturuldu', 'randevu_iptal', 'randevu_hatirlatma_1g', 'randevu_hatirlatma_2s', 'randevu_sonrasi'] },
  { baslik: 'Personel Bildirimleri', kodlar: ['personel_gunluk', 'ay_sonu_performans'] },
  { baslik: 'Özel Günler', kodlar: ['musteri_dogum_gunu', 'personel_dogum_gunu'] },
  { baslik: 'Manuel / Kampanya', kodlar: ['kampanya'] },
]

const ZAMANLAMA_RENK: Record<string, string> = {
  cron: 'var(--gold)', olay: 'var(--green)', manuel: '#3B82F6',
}
const ZAMANLAMA_AD: Record<string, string> = {
  cron: 'Zamanlanmış', olay: 'Otomatik', manuel: 'Manuel',
}
const KANAL_ETIKET: Record<string, string> = {
  hepsi: 'Tümü', email: 'E-posta', sms: 'SMS', whatsapp: 'WhatsApp',
}

const DEGISKENLER_MUSTERI = ['{{isletme_adi}}', '{{musteri_ad}}', '{{randevu_tarih}}', '{{randevu_saat}}', '{{hizmet_ad}}', '{{personel_ad}}', '{{kalan_seans}}']
const DEGISKENLER_PERSONEL = ['{{isletme_adi}}', '{{personel_ad}}', '{{tarih}}', '{{randevu_sayisi}}', '{{ilk_randevu_saat}}', '{{toplam_tutar}}', '{{prim_tutar}}', '{{ay}}']

export default function Bildirimler() {
  const qc = useQueryClient()
  const [sekme, setSekme] = useState<'sablonlar' | 'gonderimler' | 'kurulum' | 'manuel'>('sablonlar')
  const [acikSablon, setAcikSablon] = useState<string | null>(null)
  const [editSablon, setEditSablon] = useState<Partial<Sablon> & { dirty?: boolean }>({})
  const [kayitOk, setKayitOk] = useState<string | null>(null)
  const [hata, setHata] = useState('')
  const [manuelHedef, setManuelHedef] = useState('hepsi_musteri')
  const [manuelKanal, setManuelKanal] = useState('hepsi')
  const [manuelMesaj, setManuelMesaj] = useState('')
  const [manuelBaslik, setManuelBaslik] = useState('')
  const [manuelOk, setManuelOk] = useState(false)

  const sablonlarQ = useQuery<Sablon[]>({
    queryKey: ['bildirim-sablonlar'],
    queryFn: () => apiGet('bildirim.php', 'sablonlar'),
    staleTime: 30_000,
  })

  const loglarQ = useQuery<Log[]>({
    queryKey: ['bildirim-loglar'],
    queryFn: () => apiGet('bildirim.php', 'loglar'),
    enabled: sekme === 'gonderimler',
    staleTime: 10_000,
  })

  const kaydetM = useMutation({
    mutationFn: (s: Partial<Sablon>) => apiPost('bildirim.php', 'sablon_kaydet', {
      tetikleyici: s.kod, baslik: s.baslik, icerik: s.icerik, kanal: s.kanal, aktif: s.aktif,
    }),
    onSuccess: (_, s) => {
      qc.invalidateQueries({ queryKey: ['bildirim-sablonlar'] })
      setKayitOk(s.kod ?? null); setHata('')
      setTimeout(() => setKayitOk(null), 3000)
    },
    onError: (e) => setHata((e as Error).message),
  })

  const sifirlaM = useMutation({
    mutationFn: (kod: string) => apiPost('bildirim.php', 'sablon_sifirla', { tetikleyici: kod }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bildirim-sablonlar'] }); setAcikSablon(null) },
  })

  const manuelM = useMutation({
    mutationFn: () => apiPost('bildirim.php', 'gonder', {
      hedef_tipi: manuelHedef, kanal: manuelKanal, mesaj: manuelMesaj, baslik: manuelBaslik,
    }),
    onSuccess: () => {
      setManuelOk(true); setManuelMesaj(''); setManuelBaslik('')
      qc.invalidateQueries({ queryKey: ['bildirim-loglar'] })
      setTimeout(() => setManuelOk(false), 4000)
    },
    onError: (e) => setHata((e as Error).message),
  })

  const sablonlar = sablonlarQ.data ?? []

  function acSablon(kod: string) {
    if (acikSablon === kod) { setAcikSablon(null); setEditSablon({}); return }
    const s = sablonlar.find(x => x.kod === kod)
    if (s) { setEditSablon({ ...s }); setAcikSablon(kod) }
  }

  function editSet(k: keyof Sablon, v: unknown) {
    setEditSablon(p => ({ ...p, [k]: v, dirty: true }))
  }

  return (
    <>
      <Topbar title="Bildirim Botu" subtitle="İşletme bildirimleri — şablon, gönderim ve kurulum yönetimi" search={false} />
      <div className="page">

        {/* Sekme başlıkları */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {([
            ['sablonlar', 'Şablonlar', Bell],
            ['manuel', 'Manuel Gönder', Send],
            ['gonderimler', 'Gönderimler', Clock],
            ['kurulum', 'Kurulum Rehberi', Settings2],
          ] as const).map(([k, ad, Ikon]) => (
            <button key={k} type="button" onClick={() => setSekme(k)}
              style={{ padding: '10px 16px', fontSize: 13, fontWeight: sekme === k ? 600 : 400, fontFamily: 'inherit', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${sekme === k ? 'var(--gold)' : 'transparent'}`, color: sekme === k ? 'var(--gold-text)' : 'var(--text2)', transition: 'all .15s', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Ikon size={14} /> {ad}
            </button>
          ))}
        </div>

        {hata && <div className="form-err" style={{ marginBottom: 16 }}>{hata}</div>}

        {/* ── ŞABLONLAR ─────────────────────────────────────────────────── */}
        {sekme === 'sablonlar' && (
          <div style={{ maxWidth: 820 }}>
            <div className="panel" style={{ padding: '16px 20px', marginBottom: 16, background: 'rgba(201,169,110,.07)', border: '1px solid rgba(201,169,110,.2)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Info size={15} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.7 }}>
                  Her şablon için mesaj içeriğini özelleştirebilirsiniz. Değişkenler gönderimde otomatik doldurulur.
                  <b> Zamanlanmış</b> tetikleyiciler için cPanel'e saatlik cron kurulumu gerekir (Kurulum Rehberi'nde detaylar var).
                  <b> Otomatik</b> tetikleyiciler randevu işlemlerinde anlık çalışır.
                </div>
              </div>
            </div>

            {TETIKLEYICI_GRUBU.map((grup) => (
              <div key={grup.baslik} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>{grup.baslik}</div>
                {grup.kodlar.map((kod) => {
                  const s = sablonlar.find(x => x.kod === kod)
                  if (!s) return null
                  const acik = acikSablon === kod
                  const edit = acik ? editSablon : s
                  return (
                    <div key={kod} className="panel" style={{ padding: 0, marginBottom: 10, overflow: 'hidden', border: acik ? '1px solid rgba(201,169,110,.35)' : '1px solid var(--border)' }}>
                      {/* Başlık satırı */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => acSablon(kod)}>
                        {/* Aktif toggle */}
                        <button type="button" onClick={(e) => { e.stopPropagation(); if (!acik) { /* toggle inline for closed state */ } }}
                          style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: s.aktif ? 'var(--gold)' : 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                          <div style={{ position: 'absolute', top: 2, left: s.aktif ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                        </button>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.ad}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 10 }}>
                            <span style={{ color: ZAMANLAMA_RENK[s.zamanlama], fontWeight: 600 }}>{ZAMANLAMA_AD[s.zamanlama]}</span>
                            <span>·</span>
                            <span>Hedef: {s.hedef === 'musteri' ? 'Müşteri' : 'Personel'}</span>
                            <span>·</span>
                            <span>Kanal: {KANAL_ETIKET[s.kanal]}</span>
                            {s.ozellestirildi && <span style={{ color: 'var(--gold)' }}>· Özelleştirildi</span>}
                          </div>
                        </div>
                        {kayitOk === kod && <span style={{ fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Kaydedildi</span>}
                        {acik ? <ChevronUp size={16} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
                      </div>

                      {/* Düzenleyici */}
                      {acik && (
                        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ paddingTop: 16 }}>

                            {/* Aktif toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                              <button type="button" onClick={() => editSet('aktif', !edit.aktif)}
                                style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: edit.aktif ? 'var(--gold)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                                <div style={{ position: 'absolute', top: 3, left: edit.aktif ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                              </button>
                              <span style={{ fontSize: 13 }}>{edit.aktif ? 'Aktif — Bildirim gönderilir' : 'Pasif — Bildirim gönderilmez'}</span>
                            </div>

                            {/* Kanal */}
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Kanal</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {(['hepsi', 'email', 'sms', 'whatsapp'] as const).map(k => (
                                  <button key={k} type="button" onClick={() => editSet('kanal', k)}
                                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${edit.kanal === k ? 'rgba(201,169,110,.5)' : 'var(--border)'}`, background: edit.kanal === k ? 'rgba(201,169,110,.12)' : 'var(--surface)', color: edit.kanal === k ? 'var(--gold-text)' : 'var(--text2)' }}>
                                    {KANAL_ETIKET[k]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Başlık (email için) */}
                            {(edit.kanal === 'email' || edit.kanal === 'hepsi') && (
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>E-posta Konusu</label>
                                <input className="input" value={edit.baslik ?? ''} onChange={e => editSet('baslik', e.target.value)} style={{ fontSize: 13 }} />
                              </div>
                            )}

                            {/* Mesaj içeriği */}
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Mesaj İçeriği</label>
                              <textarea className="input" rows={6} value={edit.icerik ?? ''} onChange={e => editSet('icerik', e.target.value)}
                                style={{ fontSize: 13, lineHeight: 1.7, fontFamily: 'inherit', resize: 'vertical' }} />
                            </div>

                            {/* Değişkenler */}
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>Kullanılabilir değişkenler (tıkla → ekle):</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {(s.hedef === 'personel' ? DEGISKENLER_PERSONEL : DEGISKENLER_MUSTERI).map(v => (
                                  <button key={v} type="button" onClick={() => editSet('icerik', (edit.icerik ?? '') + v)}
                                    style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'monospace' }}>
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Butonlar */}
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <button type="button" className="btn btn-gold" disabled={kaydetM.isPending}
                                onClick={() => kaydetM.mutate(editSablon as Sablon)}>
                                {kaydetM.isPending ? <span className="spin" /> : 'Kaydet'}
                              </button>
                              {s.ozellestirildi && (
                                <button type="button" className="btn btn-ghost"
                                  onClick={async () => { if (await confirmAsync('Şablon varsayılana sıfırlansın mı?')) sifirlaM.mutate(kod) }}
                                  style={{ gap: 6 }}>
                                  <RotateCcw size={14} /> Varsayılana Sıfırla
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── MANUEL GÖNDER ─────────────────────────────────────────────── */}
        {sekme === 'manuel' && (
          <div style={{ maxWidth: 640 }}>
            <div className="panel" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20, fontSize: 15, fontWeight: 500 }}>
                <Send size={17} style={{ color: 'var(--gold)' }} /> Manuel Mesaj Gönder
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Hedef Kitle</label>
                <Select className="input" value={manuelHedef} onChange={e => setManuelHedef(e.target.value)}>
                  <option value="hepsi_musteri">Tüm Müşteriler</option>
                  <option value="hepsi_personel">Tüm Personel</option>
                </Select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Kanal</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['hepsi', 'email', 'sms', 'whatsapp'] as const).map(k => (
                    <button key={k} type="button" onClick={() => setManuelKanal(k)}
                      style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${manuelKanal === k ? 'rgba(201,169,110,.5)' : 'var(--border)'}`, background: manuelKanal === k ? 'rgba(201,169,110,.12)' : 'var(--surface)', color: manuelKanal === k ? 'var(--gold-text)' : 'var(--text2)' }}>
                      {KANAL_ETIKET[k]}
                    </button>
                  ))}
                </div>
              </div>

              {(manuelKanal === 'email' || manuelKanal === 'hepsi') && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>E-posta Konusu</label>
                  <input className="input" value={manuelBaslik} onChange={e => setManuelBaslik(e.target.value)} placeholder="Konu başlığı" />
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Mesaj İçeriği</label>
                <textarea className="input" rows={6} value={manuelMesaj} onChange={e => setManuelMesaj(e.target.value)}
                  placeholder="Kullanılabilir değişkenler: {{isletme_adi}}, {{musteri_ad}}, {{personel_ad}}"
                  style={{ fontSize: 13, lineHeight: 1.7, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" className="btn btn-gold" disabled={manuelM.isPending || !manuelMesaj.trim()}
                  onClick={() => { setHata(''); manuelM.mutate() }}>
                  {manuelM.isPending ? <span className="spin" /> : <><Send size={14} /> Gönder</>}
                </button>
                {manuelOk && <span style={{ fontSize: 12.5, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}><Check size={14} /> Gönderim tamamlandı</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── GÖNDERİMLER LOG ──────────────────────────────────────────── */}
        {sekme === 'gonderimler' && (
          <div style={{ maxWidth: 900 }}>
            {loglarQ.isLoading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Yükleniyor…</div>}
            {!loglarQ.isLoading && (loglarQ.data ?? []).length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Henüz gönderim kaydı yok.</div>
            )}
            {(loglarQ.data ?? []).map(log => (
              <div key={log.id} className="panel" style={{ padding: '12px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="bell-ic" style={{ width: 32, height: 32, flexShrink: 0,
                  background: log.durum === 'basarili' ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.12)',
                  color: log.durum === 'basarili' ? 'var(--green)' : '#f87171' }}>
                  {log.durum === 'basarili' ? <Check size={15} /> : <AlertCircle size={15} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                    {log.hedef_ad || '—'}
                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>{log.kanal?.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 10 }}>
                    <span>{log.tetikleyici}</span>
                    {log.hedef_telefon && <span>· {log.hedef_telefon}</span>}
                    {log.hedef_email && <span>· {log.hedef_email}</span>}
                  </div>
                  {log.hata && <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 2 }}>{log.hata}</div>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--faint)', flexShrink: 0 }}>
                  {log.created_at ? log.created_at.slice(0, 16).replace('T', ' ') : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── KURULUM REHBERİ ───────────────────────────────────────────── */}
        {sekme === 'kurulum' && (
          <div style={{ maxWidth: 800 }}>
            <KurulumRehberi />
          </div>
        )}
      </div>
    </>
  )
}

function KurulumRehberi() {
  const [acik, setAcik] = useState<string>('cron')
  const kart = (id: string, baslik: string, ikon: React.ReactNode, renk: string, content: React.ReactNode) => (
    <div className="panel" style={{ marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setAcik(acik === id ? '' : id)}>
        <div className="bell-ic" style={{ width: 36, height: 36, background: `color-mix(in srgb, ${renk} 12%, transparent)`, color: renk, flexShrink: 0 }}>{ikon}</div>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{baslik}</div>
        {acik === id ? <ChevronUp size={16} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
      </div>
      {acik === id && <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>{content}</div>}
    </div>
  )

  const adim = (n: number, metin: React.ReactNode) => (
    <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 14, paddingTop: n === 1 ? 16 : 0 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(201,169,110,.18)', color: 'var(--gold-text)', fontSize: 12, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.7, paddingTop: 2 }}>{metin}</div>
    </div>
  )

  const code = (t: string) => (
    <code style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, fontFamily: 'monospace', color: 'var(--gold-text)', marginTop: 8, marginBottom: 8, wordBreak: 'break-all', lineHeight: 1.6 }}>{t}</code>
  )

  return (
    <>
      {kart('cron', 'cPanel Cron Kurulumu (Zamanlanmış Bildirimler)', <Clock size={18} />, 'var(--gold)', <>
        {adim(1, 'cPanel giriş yapın → Gelişmiş bölümünden Cron İşleri\'ni açın.')}
        {adim(2, 'Yeni bir cron işi ekleyin. Sıklık olarak "Her Saat" seçin (0 * * * *)')}
        {adim(3, <>Komut alanına şunu girin:</>)}
        {code('curl -s "https://homedya.com/estetix/api/bildirim.php?action=cron&cron_token=estetix-cron-2026" > /dev/null 2>&1')}
        {adim(4, 'Kaydet. Artık her saat bildirimler otomatik işlenir.')}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.2)', fontSize: 12.5, color: 'var(--text2)', marginTop: 8 }}>
          <b>Not:</b> Sabah randevu hatırlatmaları 09:00, personel günlük 08:00, doğum günleri 09:00, ay sonu performans son gün 18:00'de gönderilir.
        </div>
      </>)}

      {kart('sms-netgsm', 'SMS Kurulumu — Netgsm', <Smartphone size={18} />, '#3B82F6', <>
        {adim(1, <><a href="https://www.netgsm.com.tr" target="_blank" rel="noopener" style={{ color: 'var(--gold)' }}>netgsm.com.tr</a> adresinden hesap açın ve giriş yapın.</>)}
        {adim(2, 'Hesabınıza yeterli bakiye yükleyin. Panel → Üye İşlemleri → Bakiye Yükle.')}
        {adim(3, 'Başlık (Msgheader) tanımlamanız gerekiyor: Panel → SMS → Başlık/Numara Yönetimi → Başlık Tanımla. Ticari unvanınızı onaylatın (1-3 iş günü).')}
        {adim(4, 'API bilgilerinizi not edin: Kullanıcı adı (cep telefonu) ve şifreniz.')}
        {adim(5, 'Seanzy SA Paneli → Entegrasyonlar → SMS → Netgsm seçin → bilgileri girin → Kaydet.')}
        {adim(6, 'Bildirimler → Ayarlar → SMS kanalını aktifleştirin.')}
      </>)}

      {kart('sms-iletimerkezi', 'SMS Kurulumu — İletimerkezi', <Smartphone size={18} />, '#3B82F6', <>
        {adim(1, <><a href="https://www.iletimerkezi.com" target="_blank" rel="noopener" style={{ color: 'var(--gold)' }}>iletimerkezi.com</a> adresinden hesap açın.</>)}
        {adim(2, 'Giriş yapın → API Entegrasyonu menüsüne gidin → API Anahtarı oluşturun.')}
        {adim(3, 'SMS başlığınızı (gönderici adı) oluşturun: Yönetim → Başlık Tanımları → Yeni Başlık.')}
        {adim(4, 'SA Paneli → Entegrasyonlar → SMS → İletimerkezi seçin → API Key ve başlık adını girin.')}
      </>)}

      {kart('whatsapp', 'WhatsApp Business API Kurulumu', <MessageSquare size={18} />, '#25D366', <>
        {adim(1, <><a href="https://developers.facebook.com" target="_blank" rel="noopener" style={{ color: 'var(--gold)' }}>developers.facebook.com</a> → Uygulamam → Yeni Uygulama Oluştur → İş → devam.</>)}
        {adim(2, 'Sol menüden "WhatsApp" ürününü ekle → "WhatsApp Business Platform" kur.')}
        {adim(3, 'WhatsApp → API Setup ekranına git. Test numarası veya kendi numaranı ekle.')}
        {adim(4, <>Telefon Numarası ID'yi (Phone Number ID) kopyala. Örn:</>)}
        {code('123456789012345')}
        {adim(5, <>"Geçici Erişim Belirteci" (Temporary Access Token) al — ya da kalıcı token için Sistem Kullanıcısı oluştur (Business Manager → Sistem Kullanıcıları).</>)}
        {adim(6, 'SA Paneli → Entegrasyonlar → WhatsApp → Phone Number ID ve Access Token girin → Kaydet.')}
        {adim(7, 'İşletme Ayarları → Şifre Sıfırlama Kanalları → WhatsApp kanalını aktifleştirin.')}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(37,211,102,.07)', border: '1px solid rgba(37,211,102,.2)', fontSize: 12.5, color: 'var(--text2)', marginTop: 8 }}>
          <b>Ücretsiz mesaj:</b> WhatsApp Business API'de her müşteriye 24 saatlik pencerede ilk mesaj ücretsizdir. Sonraki mesajlar ücretlendirilir. Meta fiyatlandırması için <a href="https://business.whatsapp.com/products/platform-pricing" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>biz.whatsapp.com/products/platform-pricing <ExternalLink size={10} style={{ verticalAlign: 'middle' }} /></a> kontrol edin.
        </div>
      </>)}

      {kart('email', 'E-posta (SMTP) Kurulumu', <Mail size={18} />, '#f59e0b', <>
        {adim(1, 'SA Paneli → Entegrasyonlar → E-posta bölümüne gidin.')}
        {adim(2, 'SMTP sunucu bilgilerinizi girin: Host, Port (genellikle 587 veya 465), kullanıcı adı ve şifre.')}
        {adim(3, 'Gönderen adres (From) ve görünür isim (From Name) ayarlayın.')}
        {adim(4, 'Kaydet ve test mesajı gönderin.')}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.2)', fontSize: 12.5, color: 'var(--text2)', marginTop: 8 }}>
          <b>Önerilen servisler:</b> <a href="https://workspace.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Google Workspace</a>, <a href="https://360.yandex.com.tr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Yandex 360</a>, <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>SendGrid</a> (ücretsiz 100/gün), <a href="https://app.brevo.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Brevo</a> (ücretsiz 300/gün).
        </div>
      </>)}

      {kart('test', 'Sistem Testi', <Check size={18} />, 'var(--green)', <>
        {adim(1, 'Manuel Gönder sekmesine geçin.')}
        {adim(2, '"Hedef Kitle" olarak kendinizi (veya test müşterisini) seçin.')}
        {adim(3, 'Kanal seçip kısa bir test mesajı yazın ve Gönder\'e tıklayın.')}
        {adim(4, 'Gönderimler sekmesinden durumu kontrol edin. "Başarılı" görünüyorsa kurulum tamamdır.')}
      </>)}
    </>
  )
}
