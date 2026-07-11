import { useQuery } from '@tanstack/react-query'
import { api, apiBase } from '../lib/api'
import type { PaketTuru } from '../lib/ozellikler'

export type OzellikHaritasi = Record<string, PaketTuru>

export function useOzellikHaritasi() {
  return useQuery<OzellikHaritasi>({
    queryKey: ['ozellik-haritasi'],
    queryFn: async () => {
      const r = await api.get<{ data: OzellikHaritasi }>(`${apiBase()}/api/ozellik-haritasi`)
      return r.data.data ?? {}
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
