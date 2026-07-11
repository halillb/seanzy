import { useMemo } from 'react'

const SLOT_ARALIK = 30
const BUGUN = new Date().toISOString().slice(0, 10)

export interface DoluSaat { baslangic: string; bitis: string }

function hhmm2dk(s: string) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}
function dk2hhmm(dk: number) {
  return String(Math.floor(dk / 60) % 24).padStart(2, '0') + ':' + String(dk % 60).padStart(2, '0')
}

export function bitisHesap(saat: string, dk: number): string {
  return dk2hhmm(hhmm2dk(saat) + (dk || 60))
}

export const TUM_SLOTLAR = (() => {
  const slots: string[] = []
  for (let dk = 8 * 60; dk < 20 * 60; dk += SLOT_ARALIK) slots.push(dk2hhmm(dk))
  return slots
})()

interface Props {
  tarih: string
  sureDk: number
  secili: string
  doluSaatler: DoluSaat[]
  onChange: (saat: string) => void
}

export default function SaatGrid({ tarih, sureDk, secili, doluSaatler, onChange }: Props) {
  const simdi = new Date()
  const bugunMu = tarih === BUGUN
  const simdiDk = simdi.getHours() * 60 + simdi.getMinutes()

  const doluSet = useMemo(() => {
    const dolu = new Set<string>()
    for (const slot of TUM_SLOTLAR) {
      const slotBas = hhmm2dk(slot)
      const slotBit = slotBas + sureDk
      for (const r of doluSaatler) {
        const rBas = hhmm2dk(r.baslangic)
        const rBit = hhmm2dk(r.bitis)
        if (slotBas < rBit && slotBit > rBas) { dolu.add(slot); break }
      }
      if (bugunMu && slotBas <= simdiDk) dolu.add(slot)
    }
    return dolu
  }, [doluSaatler, sureDk, bugunMu, simdiDk])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 4 }}>
      {TUM_SLOTLAR.map((slot) => {
        const dolu = doluSet.has(slot)
        const sec = slot === secili
        return (
          <button
            key={slot}
            type="button"
            disabled={dolu}
            onClick={() => onChange(slot)}
            style={{
              padding: '7px 4px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: sec ? 700 : 400,
              fontFamily: 'inherit',
              cursor: dolu ? 'not-allowed' : 'pointer',
              border: sec ? '2px solid var(--gold)' : '1px solid var(--border)',
              background: dolu
                ? 'var(--surface3)'
                : sec
                ? 'color-mix(in srgb, var(--gold) 18%, transparent)'
                : 'var(--surface)',
              color: dolu ? 'var(--muted)' : sec ? 'var(--gold-text)' : 'var(--text)',
              textDecoration: dolu ? 'line-through' : 'none',
              opacity: dolu ? 0.55 : 1,
              transition: 'all .12s',
            }}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}
