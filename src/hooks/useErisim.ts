import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../store/auth'
import { OZELLIKLER, paketErisi, type SaPaket } from '../lib/ozellikler'
import type { OzellikHaritasi } from './useOzellikHaritasi'

const FALLBACK: Record<string, number> = { basic: 1, pro: 2, enterprise: 3 }

export function useErisim(ozellik: keyof typeof OZELLIKLER): boolean {
  const paket = useAuth((s) => s.user?.paket_turu)
  const qc = useQueryClient()
  const harita = qc.getQueryData<OzellikHaritasi>(['ozellik-haritasi'])
  const paketler = (qc.getQueryData<SaPaket[]>(['sa-paketler']) ?? []).filter((p) => p.aktif)
  const gereken = harita?.[ozellik] ?? OZELLIKLER[ozellik]?.min ?? 'enterprise'

  if (paketler.length === 0) {
    return (FALLBACK[paket ?? 'basic'] ?? 0) >= (FALLBACK[gereken] ?? 0)
  }

  return paketErisi(paket, gereken, paketler)
}
