export const ENTEGRASYON_ADIMLARI: Record<'sms' | 'whatsapp', string[]> = {
  whatsapp: [
    'Talep alındı',
    'İşletmeyle iletişime geçildi',
    'Meta Business Manager\'a ortak/sistem kullanıcısı olarak eklendi',
    'Meta Developer uygulaması ve WhatsApp ürünü kuruldu',
    'İşletme telefon numarası doğrulandı',
    'Access Token alındı ve sisteme tanımlandı — kurulum tamamlandı',
  ],
  sms: [
    'Talep alındı',
    'Sağlayıcıyla görüşüldü',
    'Sağlayıcı hesabı oluşturuldu',
    'API bilgileri sisteme tanımlandı',
    'Test mesajı gönderildi — kurulum tamamlandı',
  ],
}
