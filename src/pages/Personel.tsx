import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Phone, Mail, Search, ArrowUpDown, UploadCloud } from 'lucide-react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import PersonelForm, { type Personel } from '../components/PersonelForm'
import ImportModal from '../components/ImportModal'
import { PERSONEL_IMPORT } from '../lib/importConfig'
import { apiGet } from '../lib/api'
import { telGoster } from '../lib/text'
import Select from '../components/Select'

const ROL: Record<string, string> = { mudur: 'Müdür', personel: 'Personel' }
const adSoyad = (p: Personel) => p.ad_soyad || `${p.ad} ${p.soyad || ''}`.trim()

export default function PersonelSayfa() {
  const [yeni, setYeni] = useState(false)
  const [duzenle, setDuzenle] = useState<Personel | null>(null)
  const [q, setQ] = useState('')
  const [sir, setSir] = useState('ad')
  const [iceAktar, setIceAktar] = useState(false)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['personel'],
    queryFn: () => apiGet<Personel[]>('personel.php', 'liste'),
  })

  const liste = useMemo(() => {
    let arr = [...(data ?? [])]
    if (q.trim()) {
      const t = q.toLocaleLowerCase('tr')
      arr = arr.filter((p) => `${adSoyad(p)} ${p.uzmanlik || ''} ${p.telefon || ''}`.toLocaleLowerCase('tr').includes(t))
    }
    arr.sort((a, b) => {
      if (sir === 'uzmanlik') return (a.uzmanlik || '').localeCompare(b.uzmanlik || '', 'tr')
      if (sir === 'rol') return (a.rol || '').localeCompare(b.rol || '', 'tr')
      return adSoyad(a).localeCompare(adSoyad(b), 'tr')
    })
    return arr
  }, [data, q, sir])

  return (
    <>
      <Topbar title="Personel" subtitle={data ? `${data.length} aktif ekip üyesi` : 'Yükleniyor…'} search={false} cta="Personel" onCta={() => setYeni(true)} />
      <Modal open={yeni} onClose={() => setYeni(false)} title="Yeni Personel">
        <PersonelForm onClose={() => setYeni(false)} />
      </Modal>
      <Modal open={!!duzenle} onClose={() => setDuzenle(null)} title="Personel Düzenle">
        {duzenle && <PersonelForm mevcut={duzenle} onClose={() => setDuzenle(null)} />}
      </Modal>
      <Modal open={iceAktar} onClose={() => setIceAktar(false)} title="Personelleri İçe Aktar">
        <ImportModal config={PERSONEL_IMPORT} onClose={() => setIceAktar(false)} />
      </Modal>
      <div className="page">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 0, flex: '1 1 200px', maxWidth: 340 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input className="input" style={{ padding: '9px 12px 9px 34px' }} placeholder="İsim / sınıf / telefon ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setIceAktar(true)}><UploadCloud size={15} /> İçe Aktar</button>
            <ArrowUpDown size={15} style={{ color: 'var(--muted)' }} />
            <Select className="input" style={{ width: 'auto', padding: '9px 12px' }} value={sir} onChange={(e) => setSir(e.target.value)}>
              <option value="ad">İsme göre</option>
              <option value="uzmanlik">Sınıfa göre</option>
              <option value="rol">Role göre</option>
            </Select>
          </div>
        </div>
        {isError && <div className="panel" style={{ textAlign: 'center', color: 'var(--red)', padding: 40 }}>{(error as Error)?.message}</div>}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>
          {isLoading && [...Array(4)].map((_, i) => <div key={i} className="card" style={{ height: 150, opacity: 0.5 }} />)}
          {!isLoading && liste.map((p) => {
            const ad = p.ad_soyad || `${p.ad} ${p.soyad || ''}`.trim()
            const ini = ((p.ad?.[0] || '') + (p.soyad?.[0] || '')).toUpperCase()
            return (
              <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setDuzenle(p)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div className="sb-av" style={{ width: 46, height: 46, fontSize: 16 }}>{ini || '—'}</div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 500 }}>{ad}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                      {ROL[p.rol] || p.rol}{p.uzmanlik ? ` · ${p.uzmanlik}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text2)' }}>
                    <Phone size={14} style={{ color: 'var(--muted)' }} />{telGoster(p.telefon)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Mail size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />{p.email || '–'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
