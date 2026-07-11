import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Phone, Clock, Check, X, Loader2, CircleDot, Settings2, Send } from 'lucide-react'
import Topbar from '../components/Topbar'
import Select from '../components/Select'
import PasswordInput from '../components/PasswordInput'
import { apiGet, apiPost } from '../lib/api'
import { trTarih } from '../lib/tarih'
import { ENTEGRASYON_ADIMLARI } from '../lib/entegrasyonAdimlari'

interface WaCfg { aktif: boolean; phone_number_id: string; access_token: string }
interface SmsCfg { aktif: boolean; provider: string; netgsm_kullanici: string; netgsm_sifre: string; netgsm_baslik: string }
interface EnteCfgSalon { whatsapp?: Partial<WaCfg>; sms?: Partial<SmsCfg> }

function KanalAyarlari({ tenantId, kanal }: { tenantId: number; kanal: 'sms' | 'whatsapp' }) {
  const [waCfg, setWaCfg] = useState<WaCfg>({ aktif: true, phone_number_id: '', access_token: '' })
  const [smsCfg, setSmsCfg] = useState<SmsCfg>({ aktif: true, provider: 'netgsm', netgsm_kullanici: '', netgsm_sifre: '', netgsm_baslik: 'Seanzy' })
  const [tokenVar, setTokenVar] = useState(false)
  const [testHedef, setTestHedef] = useState('')
  const [testSonuc, setTestSonuc] = useState<{ ok: boolean; mesaj: string } | null>(null)

  const { data } = useQuery({
    queryKey: ['sa-entegrasyon-salon', tenantId],
    queryFn: () => apiGet<EnteCfgSalon>('superadmin.php', 'entegrasyon_getir', { tenant_id: tenantId }),
    staleTime: 10_000,
  })

  // İlk veri geldiğinde formu doldur (sonraki render'larda kullanıcı girdisini ezmesin diye tek seferlik)
  const [ilkYuklemeYapildi, setIlkYuklemeYapildi] = useState(false)
  if (data && !ilkYuklemeYapildi) {
    setIlkYuklemeYapildi(true)
    if (data.whatsapp) {
      setWaCfg({ aktif: data.whatsapp.aktif ?? true, phone_number_id: data.whatsapp.phone_number_id || '', access_token: '' })
      setTokenVar(!!data.whatsapp.access_token)
    }
    if (data.sms) {
      setSmsCfg((p) => ({ ...p, ...data.sms, netgsm_sifre: '' } as SmsCfg))
    }
  }

  const kaydet = useMutation({
    mutationFn: () => apiPost('superadmin.php', 'entegrasyon_kaydet', {
      tenant_id: tenantId,
      entegrasyon: kanal === 'whatsapp' ? { whatsapp: waCfg } : { sms: smsCfg },
    }),
    onSuccess: () => setTestSonuc(null),
  })

  const test = useMutation({
    mutationFn: () => apiPost<{ basarili: boolean; mesaj: string }>('superadmin.php', 'entegrasyon_test', { tenant_id: tenantId, kanal, hedef: testHedef }),
    onSuccess: (d) => setTestSonuc({ ok: d.basarili, mesaj: d.mesaj }),
    onError: (e) => setTestSonuc({ ok: false, mesaj: (e as Error).message }),
  })

  return (
    <div style={{ marginTop: 12, padding: 14, background: 'var(--surface2)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Bu işletmeye özel {kanal === 'whatsapp' ? 'WhatsApp' : 'SMS'} bağlantısı</div>
      {kanal === 'whatsapp' ? (
        <div className="form-grid">
          <div className="field" style={{ margin: 0 }}><label>Phone Number ID</label>
            <input className="input" value={waCfg.phone_number_id} onChange={(e) => setWaCfg((p) => ({ ...p, phone_number_id: e.target.value }))} placeholder="1234567890" autoComplete="off" /></div>
          <div className="field" style={{ margin: 0 }}><label>Access Token {tokenVar && <span style={{ color: 'var(--green)', fontWeight: 400 }}>(kayıtlı)</span>}</label>
            <PasswordInput value={waCfg.access_token} onChange={(v) => setWaCfg((p) => ({ ...p, access_token: v }))} placeholder={tokenVar ? 'Değiştirmek için yeni değer girin' : 'Access Token'} /></div>
        </div>
      ) : (
        <div className="form-grid">
          <div className="field" style={{ margin: 0 }}><label>Netgsm Kullanıcı Adı</label>
            <input className="input" value={smsCfg.netgsm_kullanici} onChange={(e) => setSmsCfg((p) => ({ ...p, netgsm_kullanici: e.target.value }))} autoComplete="off" /></div>
          <div className="field" style={{ margin: 0 }}><label>Netgsm Şifre</label>
            <PasswordInput value={smsCfg.netgsm_sifre} onChange={(v) => setSmsCfg((p) => ({ ...p, netgsm_sifre: v }))} /></div>
          <div className="field" style={{ margin: 0 }}><label>SMS Başlığı</label>
            <input className="input" value={smsCfg.netgsm_baslik} onChange={(e) => setSmsCfg((p) => ({ ...p, netgsm_baslik: e.target.value.slice(0, 11) }))} maxLength={11} /></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-gold btn-sm" disabled={kaydet.isPending} onClick={() => kaydet.mutate()}>
          {kaydet.isPending ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Bağlantıyı Kaydet
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <input className="input" value={testHedef} onChange={(e) => setTestHedef(e.target.value)}
          placeholder={kanal === 'whatsapp' ? '05XXXXXXXXX' : '05XXXXXXXXX'} style={{ flex: 1, fontSize: 12.5 }} />
        <button className="btn btn-ghost btn-sm" disabled={test.isPending || !testHedef.trim()} onClick={() => test.mutate()}>
          {test.isPending ? <Loader2 size={13} className="spin" /> : <Send size={13} />} Test Gönder
        </button>
      </div>
      {testSonuc && (
        <div style={{ fontSize: 12, color: testSonuc.ok ? 'var(--green)' : '#f87171' }}>{testSonuc.mesaj}</div>
      )}
    </div>
  )
}

type Durum = 'bekliyor' | 'inceleniyor' | 'tamamlandi' | 'reddedildi'

interface Talep {
  id: number; tenant_id: number; isletme_adi: string
  kanal: 'sms' | 'whatsapp'; durum: Durum; adim: number
  bilgi: Record<string, string>; sa_not: string | null
  created_at: string; updated_at: string
}

const DURUM_BILGI: Record<Durum, { ad: string; renk: string; bg: string }> = {
  bekliyor:    { ad: 'Bekliyor',    renk: 'var(--muted)',  bg: 'var(--surface2)' },
  inceleniyor: { ad: 'İnceleniyor', renk: '#3B82F6',        bg: 'rgba(59,130,246,.1)' },
  tamamlandi:  { ad: 'Tamamlandı',  renk: 'var(--green)',   bg: 'rgba(74,222,128,.1)' },
  reddedildi:  { ad: 'Reddedildi',  renk: '#f87171',        bg: 'rgba(248,113,113,.1)' },
}

const BILGI_ETIKET: Record<string, string> = {
  isletme_telefon: 'İşletme Telefonu', isletme_adi: 'İşletme Adı (WhatsApp)',
  saglayici_tercih: 'Sağlayıcı Tercihi', not: 'Not',
}

function TalepSatiri({ t }: { t: Talep }) {
  const qc = useQueryClient()
  const [durum, setDurum] = useState<Durum>(t.durum)
  const [adim, setAdim] = useState(t.adim)
  const [not_, setNot] = useState(t.sa_not || '')
  const [duzenle, setDuzenle] = useState(false)
  const [ayarAcik, setAyarAcik] = useState(false)
  const d = DURUM_BILGI[t.durum]
  const Ikon = t.kanal === 'sms' ? Phone : MessageSquare
  const adimlar = ENTEGRASYON_ADIMLARI[t.kanal]

  const kaydet = useMutation({
    mutationFn: () => apiPost('superadmin.php', 'entegrasyon_talep_durum', { id: t.id, durum, adim, sa_not: not_ }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-entegrasyon-talepleri'] }); setDuzenle(false) },
  })

  function adimSec(i: number) {
    setAdim(i)
    setDurum(i === 0 ? 'bekliyor' : i === adimlar.length - 1 ? 'tamamlandi' : 'inceleniyor')
  }

  return (
    <div className="panel" style={{ padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(201,169,110,.13)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ikon size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t.isletme_adi}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {t.kanal === 'sms' ? 'SMS' : 'WhatsApp'} kurulum talebi</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, color: d.renk, background: d.bg }}>{d.ad}</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}>{trTarih(t.created_at)}</div>

          {Object.keys(t.bilgi || {}).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {Object.entries(t.bilgi).filter(([, v]) => v).map(([k, v]) => (
                <span key={k} style={{ fontSize: 12, background: 'var(--surface2)', borderRadius: 8, padding: '4px 10px' }}>
                  <b style={{ color: 'var(--muted)', fontWeight: 500 }}>{BILGI_ETIKET[k] || k}:</b> {v}
                </span>
              ))}
            </div>
          )}

          {t.sa_not && !duzenle && (
            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 10, background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
              <b>Not:</b> {t.sa_not}
            </div>
          )}

          {/* Adım adım ilerleme çizelgesi — işletmenin de gördüğü aynı görünüm */}
          {t.durum !== 'reddedildi' && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {adimlar.map((etiket, i) => {
                const tamam = i < t.adim || (i === t.adim && t.durum === 'tamamlandi')
                const suAn = i === t.adim && t.durum !== 'tamamlandi'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: tamam ? 'var(--text)' : suAn ? 'var(--gold-text)' : 'var(--faint)' }}>
                    {tamam ? <Check size={13} style={{ color: 'var(--green)', flexShrink: 0 }} /> : suAn ? <CircleDot size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} /> : <span style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid var(--border)', flexShrink: 0, display: 'inline-block' }} />}
                    <span style={{ fontWeight: suAn ? 600 : 400 }}>{etiket}</span>
                  </div>
                )
              })}
            </div>
          )}

          {duzenle ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Select className="input" value={adim} onChange={(e) => adimSec(+e.target.value)} style={{ maxWidth: 340 }}>
                {adimlar.map((etiket, i) => <option key={i} value={i}>{i + 1}. {etiket}</option>)}
              </Select>
              <Select className="input" value={durum} onChange={(e) => setDurum(e.target.value as Durum)} style={{ maxWidth: 200 }}>
                <option value="bekliyor">Bekliyor</option>
                <option value="inceleniyor">İnceleniyor</option>
                <option value="tamamlandi">Tamamlandı</option>
                <option value="reddedildi">Reddedildi</option>
              </Select>
              <textarea className="input" rows={2} value={not_} onChange={(e) => setNot(e.target.value)}
                placeholder="İşletmeye görünecek ilerleme notu (örn. 'Meta Business hesabı inceleniyor')" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-gold btn-sm" disabled={kaydet.isPending} onClick={() => kaydet.mutate()}>
                  {kaydet.isPending ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Kaydet
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setDuzenle(false); setDurum(t.durum); setAdim(t.adim); setNot(t.sa_not || '') }}>
                  <X size={13} /> Vazgeç
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setDuzenle(true)}>
                <Clock size={13} /> Durumu Güncelle
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAyarAcik((v) => !v)}>
                <Settings2 size={13} /> Kanal Ayarları
              </button>
            </div>
          )}

          {ayarAcik && <KanalAyarlari tenantId={t.tenant_id} kanal={t.kanal} />}
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminEntegrasyonTalepleri() {
  const [filtre, setFiltre] = useState<'hepsi' | Durum>('hepsi')
  const { data, isLoading } = useQuery({
    queryKey: ['sa-entegrasyon-talepleri'],
    queryFn: () => apiGet<Talep[]>('superadmin.php', 'entegrasyon_talepleri'),
    staleTime: 30_000,
  })

  const liste = (data ?? []).filter((t) => filtre === 'hepsi' || t.durum === filtre)
  const acikSayisi = (data ?? []).filter((t) => t.durum === 'bekliyor' || t.durum === 'inceleniyor').length

  return (
    <>
      <Topbar title="Entegrasyon Talepleri" subtitle={`İşletmelerden gelen SMS/WhatsApp kurulum talepleri${acikSayisi ? ` · ${acikSayisi} açık` : ''}`} search={false} />
      <div className="page">
        <div style={{ maxWidth: 720, width: '100%' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {(['hepsi', 'bekliyor', 'inceleniyor', 'tamamlandi', 'reddedildi'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFiltre(f)}
                style={{ fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer', padding: '7px 14px', borderRadius: 9,
                  background: filtre === f ? 'rgba(201,169,110,.14)' : 'var(--surface)', color: filtre === f ? 'var(--gold-text)' : 'var(--text2)',
                  border: `1px solid ${filtre === f ? 'rgba(201,169,110,.4)' : 'var(--border)'}` }}>
                {f === 'hepsi' ? 'Tümü' : DURUM_BILGI[f].ad}
              </button>
            ))}
          </div>

          {isLoading && <div className="panel" style={{ height: 120, opacity: 0.5 }} />}
          {!isLoading && liste.length === 0 && (
            <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Bu filtrede talep yok.</div>
          )}
          {liste.map((t) => <TalepSatiri key={t.id} t={t} />)}
        </div>
      </div>
    </>
  )
}
