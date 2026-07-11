import { Construction } from 'lucide-react'
import Topbar from '../components/Topbar'

export default function Placeholder({ title }: { title: string }) {
  return (
    <>
      <Topbar title={title} subtitle="Bu ekran Faz 3'te bağlanacak" search={false} />
      <div className="page">
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px', textAlign: 'center' }}>
          <div className="mic" style={{ width: 56, height: 56, background: 'rgba(201,169,110,.14)', color: 'var(--gold)' }}>
            <Construction size={26} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 360 }}>
            Tasarımı onaylandı, canlı API'ye bağlanması sıradaki adımda yapılacak.
          </div>
        </div>
      </div>
    </>
  )
}
