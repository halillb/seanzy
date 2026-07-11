import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

/** İşletme ayarları — backend'de saklanır (tüm kullanıcılarda ortak). */
export interface Ayar {
  gorBas: number   // takvimde görünen ilk saat
  gorBit: number   // takvimde görünen son saat
  acikBas: number  // çalışma başlangıcı
  acikBit: number  // çalışma bitişi
  dakika: number   // slot/tırnak aralığı (dk)
  personelSira: number[]   // takvimde gösterilecek personel id sırası
  personelPasif: number[]  // takvimde gizlenecek personel id'leri
}

export const VARSAYILAN_AYAR: Ayar = { gorBas: 8, gorBit: 20, acikBas: 9, acikBit: 19, dakika: 15, personelSira: [], personelPasif: [] }

export function useAyar(): { ayar: Ayar; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['ayar'],
    queryFn: () => apiGet<Ayar>('ayar.php', 'getir'),
    staleTime: 5 * 60 * 1000,
  })
  return { ayar: { ...VARSAYILAN_AYAR, ...(data || {}) }, isLoading }
}
