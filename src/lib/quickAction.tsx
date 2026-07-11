import { create } from 'zustand'
import Modal from '../components/Modal'
import RandevuForm from '../components/RandevuForm'
import MusteriForm from '../components/MusteriForm'
import HizmetForm from '../components/HizmetForm'

export type QuickAction = 'randevu' | 'musteri' | 'hizmet' | null

interface QuickActionState {
  acik: QuickAction
  dialAcik: boolean
  ac: (a: QuickAction) => void
  kapat: () => void
  dialAc: () => void
  dialKapat: () => void
}

export const useQuickAction = create<QuickActionState>((set) => ({
  acik: null,
  dialAcik: false,
  ac: (a) => set({ acik: a, dialAcik: false }),
  kapat: () => set({ acik: null }),
  dialAc: () => set({ dialAcik: true }),
  dialKapat: () => set({ dialAcik: false }),
}))

/** Mobil hızlı işlem menüsünden tetiklenen popup formlar — sayfa değişmeden açılır. */
export function QuickActionHost() {
  const acik = useQuickAction((s) => s.acik)
  const kapat = useQuickAction((s) => s.kapat)

  return (
    <>
      <Modal open={acik === 'randevu'} onClose={kapat} title="Yeni Randevu">
        {acik === 'randevu' && <RandevuForm onClose={kapat} />}
      </Modal>
      <Modal open={acik === 'musteri'} onClose={kapat} title="Yeni Müşteri">
        {acik === 'musteri' && <MusteriForm onClose={kapat} />}
      </Modal>
      <Modal open={acik === 'hizmet'} onClose={kapat} title="Yeni Hizmet">
        {acik === 'hizmet' && <HizmetForm onClose={kapat} />}
      </Modal>
    </>
  )
}
