import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { UploadCloud, CheckCircle2, FileSpreadsheet, Download } from 'lucide-react'
import { apiPost } from '../lib/api'
import { MUSTERI_IMPORT, GENEL_NOTLAR, type ImportConfig } from '../lib/importConfig'
import Select from './Select'

interface Props { onClose: () => void; config?: ImportConfig }
interface Sonuc { eklenen: number; atlanan: number; hatali: number; toplam: number }

export default function ImportModal({ onClose, config = MUSTERI_IMPORT }: Props) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dosyaAd, setDosyaAd] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [esle, setEsle] = useState<Record<string, string>>({})
  const [sonuc, setSonuc] = useState<Sonuc | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  function sablonIndir() {
    const wb = XLSX.utils.book_new()

    // 1) Şablon sekmesi: başlık + örnek satır
    const basliklar = config.alanlar.map((a) => a.label + (a.zorunlu ? ' *' : ''))
    const ornek = config.alanlar.map((a) => a.ornek)
    const ws1 = XLSX.utils.aoa_to_sheet([basliklar, ornek])
    ws1['!cols'] = config.alanlar.map(() => ({ wch: 22 }))
    XLSX.utils.book_append_sheet(wb, ws1, 'Şablon')

    // 2) Açıklama sekmesi: nasıl doldurulur + sütun açıklamaları
    const aoa: string[][] = []
    aoa.push([`${config.baslik} İçe Aktarma – Nasıl Doldurulur?`])
    aoa.push([])
    aoa.push(['GENEL KURALLAR'])
    for (const n of (config.notlar ?? GENEL_NOTLAR)) aoa.push(['• ' + n])
    aoa.push([])
    aoa.push(['SÜTUN AÇIKLAMALARI'])
    aoa.push(['Sütun', 'Zorunlu', 'Açıklama'])
    for (const a of config.alanlar) aoa.push([a.label, a.zorunlu ? 'Evet' : 'Hayır', a.aciklama || ''])
    const ws2 = XLSX.utils.aoa_to_sheet(aoa)
    ws2['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 85 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Açıklama')

    XLSX.writeFile(wb, `seanzy-${config.baslik.toLocaleLowerCase('tr')}-sablon.xlsx`)
  }

  function dosyaSec(file: File) {
    setHata('')
    const fr = new FileReader()
    fr.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '', raw: false })
        if (json.length === 0) { setHata('Dosyada kayıt bulunamadı.'); return }
        const hs = Object.keys(json[0])
        setHeaders(hs); setRows(json); setDosyaAd(file.name)
        const oto: Record<string, string> = {}
        for (const a of config.alanlar) {
          const bulunan = hs.find((h) => a.ipucu.some((ip) => h.toLocaleLowerCase('tr').includes(ip)))
          if (bulunan) oto[a.key] = bulunan
        }
        setEsle(oto)
      } catch {
        setHata('Dosya okunamadı. Excel (.xlsx) veya CSV olduğundan emin olun.')
      }
    }
    fr.readAsArrayBuffer(file)
  }

  async function aktar() {
    setHata('')
    const zorunlular = config.alanlar.filter((a) => a.zorunlu)
    if (zorunlular.some((a) => !esle[a.key])) {
      setHata('Zorunlu sütunları eşleştirin: ' + zorunlular.map((a) => a.label).join(', ')); return
    }
    const kayitlar = rows.map((r) => {
      const o: Record<string, string> = {}
      for (const a of config.alanlar) o[a.key] = esle[a.key] ? r[esle[a.key]] : ''
      return o
    })
    setYukleniyor(true)
    try {
      const res = await apiPost<Sonuc>(config.dosya, config.action, { kayitlar })
      setSonuc(res)
      qc.invalidateQueries({ queryKey: [config.invalidate] })
    } catch (e) {
      setHata((e as Error).message || 'Aktarım başarısız.')
    } finally {
      setYukleniyor(false)
    }
  }

  if (sonuc) {
    return (
      <>
        <div className="modal-b" style={{ textAlign: 'center', padding: '34px 22px' }}>
          <div className="mic" style={{ width: 56, height: 56, margin: '0 auto 16px', background: 'rgba(46,204,113,.13)', color: 'var(--green)' }}><CheckCircle2 size={28} /></div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>İçe aktarma tamamlandı</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <div className="card" style={{ padding: '12px 18px' }}><div className="mval" style={{ color: 'var(--green)' }}>{sonuc.eklenen}</div><div className="mlbl">Eklendi</div></div>
            <div className="card" style={{ padding: '12px 18px' }}><div className="mval" style={{ color: 'var(--gold)' }}>{sonuc.atlanan}</div><div className="mlbl">Atlandı (mükerrer)</div></div>
            <div className="card" style={{ padding: '12px 18px' }}><div className="mval" style={{ color: '#ff8a7d' }}>{sonuc.hatali}</div><div className="mlbl">Hatalı</div></div>
          </div>
        </div>
        <div className="modal-f"><button className="btn btn-gold" onClick={onClose}>Tamam</button></div>
      </>
    )
  }

  if (rows.length === 0) {
    return (
      <>
        <div className="modal-b">
          {hata && <div className="form-err">{hata}</div>}
          <div onClick={() => inputRef.current?.click()}
            style={{ border: '2px dashed var(--border2)', borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer' }}>
            <UploadCloud size={34} style={{ color: 'var(--gold)', marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>Excel veya CSV dosyası seç</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{config.baslik} listesi (.xlsx, .xls, .csv)</div>
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && dosyaSec(e.target.files[0])} />
          <button className="btn btn-sm btn-ghost" onClick={sablonIndir} style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
            <Download size={15} /> Örnek Şablonu İndir (.xlsx)
          </button>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 14, lineHeight: 1.6 }}>
            İlk satır başlık olmalı. Zorunlu sütunlar: <b>{config.alanlar.filter((a) => a.zorunlu).map((a) => a.label).join(', ')}</b>. Mükerrer kayıtlar otomatik atlanır.
          </div>
        </div>
        <div className="modal-f"><button className="btn btn-ghost" onClick={onClose}>İptal</button></div>
      </>
    )
  }

  return (
    <>
      <div className="modal-b">
        {hata && <div className="form-err">{hata}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, fontSize: 13, color: 'var(--text2)' }}>
          <FileSpreadsheet size={17} style={{ color: 'var(--gold)' }} /> {dosyaAd} · <b>{rows.length}</b> kayıt bulundu
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 12 }}>Hangi sütun hangi alana karşılık geliyor? (otomatik tahmin edildi)</div>
        <div className="form-grid">
          {config.alanlar.map((a) => (
            <div className="field" style={{ margin: 0 }} key={a.key}>
              <label>{a.label}{a.zorunlu ? ' *' : ''}</label>
              <Select className="input" value={esle[a.key] || ''} onChange={(e) => setEsle((p) => ({ ...p, [a.key]: e.target.value }))}>
                <option value="">– (yok)</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </Select>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-f">
        <button className="btn btn-ghost" onClick={() => { setRows([]); setHeaders([]); setDosyaAd('') }}>Geri</button>
        <button className="btn btn-gold" onClick={aktar} disabled={yukleniyor}>
          {yukleniyor ? <span className="spin" /> : `${rows.length} ${config.baslik} Aktar`}
        </button>
      </div>
    </>
  )
}
