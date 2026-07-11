import { create } from 'zustand'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOpts {
  title?: string
  message: string
  onaylaMetin?: string
  vazgecMetin?: string
  tehlikeli?: boolean
}
interface ConfirmState extends ConfirmOpts {
  acik: boolean
  resolve?: (v: boolean) => void
}

const useConfirmStore = create<ConfirmState>(() => ({ acik: false, message: '' }))

/** window.confirm() yerine kullan: await confirmAsync('Silinsin mi?') */
export function confirmAsync(opts: ConfirmOpts | string): Promise<boolean> {
  const o = typeof opts === 'string' ? { message: opts } : opts
  return new Promise((resolve) => {
    useConfirmStore.setState({ ...o, acik: true, resolve })
  })
}

export function ConfirmHost() {
  const s = useConfirmStore()
  if (!s.acik) return null

  function kapat(sonuc: boolean) {
    s.resolve?.(sonuc)
    useConfirmStore.setState({ acik: false, resolve: undefined })
  }

  return createPortal(
    <div className="modal-ov" onMouseDown={(e) => e.target === e.currentTarget && kapat(false)}>
      <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
        <div style={{ padding: '30px 26px 26px' }}>
          <div className="mic" style={{
            width: 52, height: 52, margin: '0 auto 16px',
            background: s.tehlikeli ? 'rgba(231,76,60,.13)' : 'rgba(201,169,110,.13)',
            color: s.tehlikeli ? '#ff8a7d' : 'var(--gold)',
          }}><AlertTriangle size={24} /></div>
          {s.title && <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{s.title}</div>}
          <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>{s.message}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => kapat(false)}>
              {s.vazgecMetin || 'Vazgeç'}
            </button>
            <button
              className="btn" style={{ flex: 1, justifyContent: 'center', background: s.tehlikeli ? 'rgba(231,76,60,.15)' : undefined, color: s.tehlikeli ? '#ff8a7d' : undefined, borderColor: s.tehlikeli ? 'rgba(231,76,60,.3)' : undefined }}
              onClick={() => kapat(true)} autoFocus>
              {s.onaylaMetin || 'Onayla'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
