import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Check, UserCheck, User, ShieldAlert, Mail } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import { ISLETME_KATEGORILER } from '../lib/sabitler'
import Select from './Select'

interface Props { id: number; onClose: () => void }
interface Detay {
  id: number; isletme_adi: string; slug: string; telefon?: string; paket_turu?: string
  durum: boolean; mod?: string; abonelik_bitis?: string; kota_musteri?: number; kota_personel?: number
  mudur_ad?: string; mudur_telefon?: string
  isletme_kategorisi?: string; isletme_kategorisi_diger?: string
}
interface Kullanici {
  id: number; ad: string; soyad?: string; telefon?: string; email?: string; rol: string; durum: number
}
interface SaPaket { id: number; ad: string; kod: string; fiyat: number; aktif: boolean }
const MODLAR: { k: string; ad: string; aciklama: string; renk: string }[] = [
  { k: 'aktif', ad: 'Aktif', aciklama: 'Tam erişim', renk: 'var(--green)' },
  { k: 'kisitli', ad: 'Kısıtlı', aciklama: 'Giriş açık, panel flu + ödeme uyarısı', renk: 'var(--gold)' },
  { k: 'kapali', ad: 'Kapalı', aciklama: 'Girişe tamamen kapalı', renk: '#ff8a7d' },
]
const ROL_BILGI: Record<string, { ad: string; renk: string }> = {
  mudur: { ad: 'Müdür', renk: 'var(--gold)' },
  personel: { ad: 'Personel', renk: '#3B82F6' },
  musteri: { ad: 'Müşteri', renk: 'var(--green)' },
}

export default function IsletmeDuzenle({ id, onClose }: Props) {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['sa-detay', id], queryFn: () => apiGet<Detay>('superadmin.php', 'detay', { id }) })
  const kullanicilar = useQuery({ queryKey: ['sa-kullanicilar', id], queryFn: () => apiGet<Kullanici[]>('superadmin.php', 'kullanicilar', { id }) })
  const paketlerQ = useQuery({ queryKey: ['sa-paketler'], queryFn: () => apiGet<SaPaket[]>('superadmin.php', 'paketler') })
  const [f, setF] = useState<Detay | null>(null)
  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniEmail, setYeniEmail] = useState('')
  const [editHedef, setEditHedef] = useState<{ id: number; tip: 'sifre' | 'email' } | null>(null)
  const [editOk, setEditOk] = useState<number | null>(null)
  const [hata, setHata] = useState('')
  const [sekme, setSekme] = useState<'bilgi' | 'kullanicilar'>('bilgi')

  useEffect(() => { if (data) setF(data) }, [data])
  const set = (k: keyof Detay, v: string | number | null) => setF((p) => (p ? { ...p, [k]: v } : p))

  const kaydet = useMutation({
    mutationFn: () => apiPost('superadmin.php', 'guncelle', {
      id,
      isletme_adi: f?.isletme_adi,
      slug: f?.slug,
      telefon: f?.telefon,
      paket_turu: f?.paket_turu,
      abonelik_bitis: f?.abonelik_bitis || null,
      isletme_kategorisi: f?.isletme_kategorisi || null,
      isletme_kategorisi_diger: f?.isletme_kategorisi_diger || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-isletmeler'] })
      qc.invalidateQueries({ queryKey: ['sa-detay', id] })
      qc.refetchQueries({ queryKey: ['sa-paketler'] })
      qc.refetchQueries({ queryKey: ['sa-ozet'] })
      onClose()
    },
    onError: (e) => setHata((e as Error).message || 'Kayıt başarısız.'),
  })

  function toggleEdit(id: number, tip: 'sifre' | 'email') {
    setEditHedef((prev) => (prev?.id === id && prev.tip === tip ? null : { id, tip }))
    setYeniSifre(''); setYeniEmail(''); setEditOk(null)
  }

  const sifreMut = useMutation({
    mutationFn: ({ kullaniciId, sifre }: { kullaniciId: number; sifre: string }) =>
      apiPost('superadmin.php', 'kullanici_sifre', { kullanici_id: kullaniciId, sifre }),
    onSuccess: (_d, vars) => { setEditOk(vars.kullaniciId); setYeniSifre(''); setEditHedef(null) },
    onError: (e) => setHata((e as Error).message || 'Şifre güncellenemedi.'),
  })

  const emailMut = useMutation({
    mutationFn: ({ kullaniciId, email }: { kullaniciId: number; email: string }) =>
      apiPost('superadmin.php', 'kullanici_guncelle', { kullanici_id: kullaniciId, email }),
    onSuccess: (_d, vars) => {
      setEditOk(vars.kullaniciId); setYeniEmail(''); setEditHedef(null)
      kullanicilar.refetch()
    },
    onError: (e) => setHata((e as Error).message || 'E-posta güncellenemedi.'),
  })

  const modMut = useMutation({
    mutationFn: (mod: string) => apiPost('superadmin.php', 'durum', { id, mod }),
    onSuccess: (_d, mod) => { set('mod', mod); qc.invalidateQueries({ queryKey: ['sa-isletmeler'] }) },
    onError: (e) => setHata((e as Error).message || 'Durum değiştirilemedi.'),
  })

  if (!f) return <div className="modal-b" style={{ height: 200, opacity: 0.4 }} />

  const paketler = (paketlerQ.data ?? []).filter((p) => p.aktif)
  const kategoriDiger = f.isletme_kategorisi === 'Diğer'

  return (
    <>
      <div className="modal-b" style={{ padding: 0 }}>
        {/* Sekme başlıkları */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          {([['bilgi', 'İşletme Bilgileri'], ['kullanicilar', 'Kullanıcılar']] as const).map(([k, ad]) => (
            <button key={k} type="button" onClick={() => setSekme(k)}
              style={{ padding: '13px 16px', fontSize: 13, fontWeight: sekme === k ? 600 : 400, fontFamily: 'inherit', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${sekme === k ? 'var(--gold)' : 'transparent'}`, color: sekme === k ? 'var(--gold-text)' : 'var(--text2)', transition: 'all .15s', marginBottom: -1 }}>
              {ad}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          {hata && <div className="form-err" style={{ marginBottom: 14 }}>{hata}</div>}

          {sekme === 'bilgi' && (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8, display: 'block' }}>Erişim Durumu</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {MODLAR.map((m) => {
                    const aktif = (f.mod || 'aktif') === m.k
                    return (
                      <button type="button" key={m.k} disabled={modMut.isPending} onClick={() => modMut.mutate(m.k)} title={m.aciklama}
                        style={{ flex: 1, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                          border: `1.5px solid ${aktif ? m.renk : 'var(--border)'}`, background: aktif ? `color-mix(in srgb, ${m.renk} 14%, transparent)` : 'var(--surface)', color: aktif ? m.renk : 'var(--text2)' }}>
                        {m.ad}
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6 }}>{(MODLAR.find((m) => m.k === (f.mod || 'aktif')) || MODLAR[0]).aciklama}</div>
              </div>

              <div className="form-grid">
                <div className="field full" style={{ margin: 0 }}><label>İşletme Adı</label>
                  <input className="input" value={f.isletme_adi} onChange={(e) => set('isletme_adi', e.target.value)} /></div>

                <div className="field" style={{ margin: 0 }}>
                  <label>Mağaza Kodu (slug)</label>
                  <input className="input" value={f.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} spellCheck={false} autoCapitalize="none" />
                  <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4 }}>Login ekranında kullanılır. Sadece harf/rakam/-/_</div>
                </div>

                <div className="field" style={{ margin: 0 }}><label>Telefon</label>
                  <input className="input" value={f.telefon || ''} onChange={(e) => set('telefon', e.target.value)} /></div>

                <div className="field" style={{ margin: 0 }}><label>Paket</label>
                  <Select className="input" value={f.paket_turu || 'pro'} onChange={(e) => set('paket_turu', e.target.value)}>
                    {paketler.length > 0
                      ? paketler.map((p) => <option key={p.kod} value={p.kod}>{p.ad}</option>)
                      : <>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </>
                    }
                  </Select>
                </div>

                <div className="field full" style={{ margin: 0 }}>
                  <label>İşletme Kategorisi</label>
                  <Select className="input" value={f.isletme_kategorisi || ''} onChange={(e) => set('isletme_kategorisi', e.target.value || null)}>
                    <option value="">Seçiniz…</option>
                    {ISLETME_KATEGORILER.map((k) => <option key={k} value={k}>{k}</option>)}
                  </Select>
                </div>

                {kategoriDiger && (
                  <div className="field full" style={{ margin: 0 }}>
                    <label>Kategori (Diğer)</label>
                    <input className="input" value={f.isletme_kategorisi_diger || ''} onChange={(e) => set('isletme_kategorisi_diger', e.target.value)} placeholder="Kategoriyi yazın…" />
                  </div>
                )}

                <div className="field full" style={{ margin: 0 }}><label>Abonelik Bitiş</label>
                  <input className="input" type="date" value={(f.abonelik_bitis || '').slice(0, 10)} onChange={(e) => set('abonelik_bitis', e.target.value)} /></div>
              </div>
            </>
          )}

          {sekme === 'kullanicilar' && (
            <div>
              {kullanicilar.isLoading && <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)' }}>Yükleniyor…</div>}
              {!kullanicilar.isLoading && (kullanicilar.data ?? []).length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)' }}>Bu işletmede kullanıcı bulunamadı.</div>
              )}
              {(kullanicilar.data ?? []).map((k) => {
                const rol = ROL_BILGI[k.rol] || { ad: k.rol, renk: 'var(--text2)' }
                const RolIkon = k.rol === 'mudur' ? ShieldAlert : k.rol === 'personel' ? UserCheck : User
                const expanded = editHedef?.id === k.id ? editHedef.tip : null
                return (
                  <div key={k.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: expanded ? 10 : 0 }}>
                      <div className="bell-ic" style={{ width: 34, height: 34, flexShrink: 0, background: `color-mix(in srgb, ${rol.renk} 12%, transparent)`, color: rol.renk }}>
                        <RolIkon size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{k.ad} {k.soyad || ''}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                          {k.telefon || '–'}{k.email ? ` · ${k.email}` : ''} · <span style={{ color: rol.renk, fontWeight: 600 }}>{rol.ad}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {editOk === k.id && <span style={{ fontSize: 11.5, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Güncellendi</span>}
                        <button type="button" className="btn btn-sm btn-ghost"
                          onClick={() => toggleEdit(k.id, 'email')}
                          style={{ padding: '5px 10px', gap: 5, fontSize: 12, background: expanded === 'email' ? 'var(--surface3)' : undefined }}>
                          <Mail size={12} /> E-posta
                        </button>
                        <button type="button" className="btn btn-sm btn-ghost"
                          onClick={() => toggleEdit(k.id, 'sifre')}
                          style={{ padding: '5px 10px', gap: 5, fontSize: 12, background: expanded === 'sifre' ? 'var(--surface3)' : undefined }}>
                          <KeyRound size={12} /> Şifre
                        </button>
                      </div>
                    </div>
                    {expanded === 'sifre' && (
                      <div style={{ display: 'flex', gap: 8, paddingLeft: 44 }}>
                        <input className="input" type="text" value={yeniSifre}
                          onChange={(e) => setYeniSifre(e.target.value)}
                          placeholder="Yeni şifre (min 6 karakter)" style={{ flex: 1, fontSize: 13 }} autoFocus />
                        <button type="button" className="btn btn-ghost"
                          disabled={sifreMut.isPending || yeniSifre.length < 6}
                          onClick={() => sifreMut.mutate({ kullaniciId: k.id, sifre: yeniSifre })}>
                          {sifreMut.isPending ? <span className="spin" /> : 'Sıfırla'}
                        </button>
                      </div>
                    )}
                    {expanded === 'email' && (
                      <div style={{ display: 'flex', gap: 8, paddingLeft: 44 }}>
                        <input className="input" type="email" value={yeniEmail}
                          onChange={(e) => setYeniEmail(e.target.value)}
                          placeholder={k.email || 'E-posta adresi'} style={{ flex: 1, fontSize: 13 }} autoFocus />
                        <button type="button" className="btn btn-ghost"
                          disabled={emailMut.isPending}
                          onClick={() => emailMut.mutate({ kullaniciId: k.id, email: yeniEmail })}>
                          {emailMut.isPending ? <span className="spin" /> : 'Kaydet'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="modal-f">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Kapat</button>
        {sekme === 'bilgi' && (
          <button type="button" className="btn btn-gold" disabled={kaydet.isPending} onClick={() => kaydet.mutate()}>
            {kaydet.isPending ? <span className="spin" /> : 'Kaydet'}
          </button>
        )}
      </div>
    </>
  )
}
