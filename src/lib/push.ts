import { apiGet } from './api'

interface PushAyarPublic { app_id: string; aktif: boolean }

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void>
  }
}
interface OneSignalSdk {
  init: (opts: { appId: string; allowLocalhostAsSecureOrigin?: boolean }) => Promise<void>
  login: (externalId: string) => Promise<void>
  Notifications: { requestPermission: () => Promise<void> }
}

let baslatildi = false

/**
 * OneSignal push kanalı — "yedek kanal": panelden App ID + REST API Key girilip
 * aktif edilmediği sürece bu fonksiyon hiçbir şey yapmaz (sessizce çıkar).
 * Aktifse SDK'yı yükler, bu kullanıcıyı external_id olarak OneSignal'e kaydeder.
 */
export async function pushBaslat(userId: number): Promise<void> {
  if (baslatildi) return
  let ayar: PushAyarPublic | undefined
  try {
    ayar = await apiGet<PushAyarPublic>('ayar.php', 'push_ayar_public')
  } catch { return }
  if (!ayar?.aktif || !ayar.app_id) return
  baslatildi = true

  try {
    if (!document.getElementById('onesignal-sdk')) {
      const script = document.createElement('script')
      script.id = 'onesignal-sdk'
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
      script.defer = true
      document.head.appendChild(script)
    }
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({ appId: ayar!.app_id })
      await OneSignal.login(String(userId))
      try { await OneSignal.Notifications.requestPermission() } catch { /* kullanıcı reddetmiş olabilir */ }
    })
  } catch { /* sessiz — yedek kanal, ana akışı bozmasın */ }
}
