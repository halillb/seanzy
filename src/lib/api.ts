import axios from 'axios'

/**
 * API taban adresi.
 * - Geliştirme (npm run dev): canlı API'ye bağlanır (CORS açık).
 *   İstersen .env'de VITE_API_BASE ile değiştir.
 * - Production: derlenmiş uygulama homedya.com/estetix/ altında çalışır,
 *   API aynı yolda (.../estetix/api/...). window.location'dan hesaplanır.
 */
export function apiBase(): string {
  const env = import.meta.env.VITE_API_BASE as string | undefined
  if (env) return env.replace(/\/$/, '')
  // Geliştirme: boş base → istekler localhost'a gider, Vite proxy canlıya iletir.
  if (import.meta.env.DEV) return ''
  const { origin, pathname } = window.location
  const p = pathname.replace(/\/index(\.html)?$/, '').replace(/\/$/, '')
  return origin + p
}

export const api = axios.create({ baseURL: apiBase() })

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('estetix-token')
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('estetix-token')
      localStorage.removeItem('estetix-user')
      window.dispatchEvent(new Event('estetix-unauthorized'))
    }
    return Promise.reject(err)
  },
)

/** Eski PHP API yanıt formatı: { basari, mesaj, data } */
export interface ApiYanit<T = unknown> {
  basari: boolean
  mesaj?: string
  data?: T
}

type Params = Record<string, string | number | undefined>

/** action tabanlı GET (örn. musteri.php?action=liste) */
export async function apiGet<T>(file: string, action: string, params: Params = {}): Promise<T> {
  const { data } = await api.get<ApiYanit<T>>(`/api/${file}`, { params: { action, ...params } })
  if (!data.basari) throw new Error(data.mesaj || 'İstek başarısız.')
  return (data.data ?? ([] as unknown as T))
}

/** action tabanlı POST (örn. randevu.php?action=ekle) */
export async function apiPost<T>(file: string, action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data } = await api.post<ApiYanit<T>>(`/api/${file}?action=${action}`, body)
  if (!data.basari) throw new Error(data.mesaj || 'İşlem başarısız.')
  return data.data as T
}
