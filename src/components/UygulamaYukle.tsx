import { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function iosMi(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
}

function kuruluMu(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

export default function UygulamaYukle() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosBilgi, setIosBilgi] = useState(false)
  const [gizli, setGizli] = useState(kuruluMu())

  useEffect(() => {
    const yakala = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', yakala)
    const kuruldu = () => setGizli(true)
    window.addEventListener('appinstalled', kuruldu)
    return () => { window.removeEventListener('beforeinstallprompt', yakala); window.removeEventListener('appinstalled', kuruldu) }
  }, [])

  if (gizli) return null
  if (!deferred && !iosMi()) return null // ne install prompt var ne iOS — gösterecek bir şey yok

  async function tikla() {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') setGizli(true)
      setDeferred(null)
      return
    }
    setIosBilgi(true)
  }

  return (
    <>
      <button type="button" className="sb-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }} onClick={tikla}>
        <Download />
        <span className="lbl">Uygulamayı Yükle</span>
      </button>
      {iosBilgi && (
        <div className="modal-ov" onMouseDown={(e) => e.target === e.currentTarget && setIosBilgi(false)}>
          <div className="modal" style={{ maxWidth: 340 }}>
            <div className="modal-b" style={{ textAlign: 'center', padding: '28px 22px' }}>
              <Share size={28} style={{ color: 'var(--gold)', marginBottom: 12 }} />
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>Ana Ekrana Ekle</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                Safari'de alttaki <b>Paylaş</b> ikonuna dokunun, ardından <b>"Ana Ekrana Ekle"</b> seçeneğini seçin.
              </p>
              <button className="btn btn-gold" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => setIosBilgi(false)}>Anladım</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
