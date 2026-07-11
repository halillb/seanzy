export interface ImportAlan { key: string; label: string; zorunlu?: boolean; ipucu: string[]; ornek: string; aciklama?: string }
export interface ImportConfig {
  baslik: string      // "Müşteri"
  dosya: string       // 'musteri.php'
  action: string      // 'toplu_ekle'
  invalidate: string  // query key
  alanlar: ImportAlan[]
  notlar?: string[]   // Açıklama sekmesindeki genel ipuçları
}

export const GENEL_NOTLAR = [
  '1. satır (başlıklar) DEĞİŞTİRİLMEMELİ — sistem sütunları başlığa göre tanır.',
  '2. satır örnektir; kendi verinizi girmeden önce o satırı SİLİN.',
  'Zorunlu (*) sütunlar boş bırakılamaz; boş olan satırlar atlanır.',
  'Tarihler GÜN.AY.YIL veya YIL-AY-GÜN biçiminde yazılabilir (örn. 12.05.1990).',
  'Telefonlar 0 ile başlayabilir, boşluklu olabilir; sadece rakamlar dikkate alınır.',
  'Aynı kayıt (mükerrer telefon/ad) otomatik atlanır, hata vermez.',
  'Dosyayı .xlsx veya .csv olarak kaydedip yükleyin.',
]

export const MUSTERI_IMPORT: ImportConfig = {
  baslik: 'Müşteri', dosya: 'musteri.php', action: 'toplu_ekle', invalidate: 'musteriler',
  alanlar: [
    { key: 'ad', label: 'Ad', zorunlu: true, ipucu: ['ad', 'isim', 'name', 'adı'], ornek: 'Ayşe', aciklama: 'Müşterinin adı. Zorunlu.' },
    { key: 'soyad', label: 'Soyad', ipucu: ['soyad', 'soyisim', 'surname', 'lastname'], ornek: 'Yılmaz', aciklama: 'Müşterinin soyadı.' },
    { key: 'telefon', label: 'Telefon', zorunlu: true, ipucu: ['telefon', 'gsm', 'cep', 'phone', 'tel', 'numara'], ornek: '0532 123 45 67', aciklama: 'Cep telefonu. 0 ile başlayabilir, boşluklu olabilir. Zorunlu ve mükerrer olamaz.' },
    { key: 'email', label: 'E-posta', ipucu: ['email', 'eposta', 'mail', 'e-posta'], ornek: 'ayse@ornek.com', aciklama: 'E-posta adresi (opsiyonel).' },
    { key: 'dogum_tarihi', label: 'Doğum Tarihi', ipucu: ['dogum', 'doğum', 'birth', 'tarih'], ornek: '12.05.1990', aciklama: 'GÜN.AY.YIL veya YIL-AY-GÜN (örn. 12.05.1990).' },
    { key: 'notlar', label: 'Notlar', ipucu: ['not', 'aciklama', 'açıklama', 'note'], ornek: 'VIP müşteri', aciklama: 'Serbest not (opsiyonel).' },
  ],
}

export const HIZMET_IMPORT: ImportConfig = {
  baslik: 'Hizmet', dosya: 'hizmet.php', action: 'toplu_ekle', invalidate: 'hizmetler',
  alanlar: [
    { key: 'ad', label: 'Hizmet Adı', zorunlu: true, ipucu: ['ad', 'hizmet', 'isim', 'name'], ornek: 'Lazer Koltuk Altı', aciklama: 'Hizmetin adı. Zorunlu, mükerrer olamaz.' },
    { key: 'kategori', label: 'Kategori', ipucu: ['kategori', 'grup', 'category'], ornek: 'Lazer Epilasyon', aciklama: 'Kategori adı. Sistemde yoksa OTOMATİK oluşturulur. Boş bırakılabilir.' },
    { key: 'sure_dk', label: 'Süre (dk)', ipucu: ['sure', 'süre', 'dakika', 'duration', 'dk'], ornek: '30', aciklama: 'İşlem süresi dakika cinsinden (sadece sayı). Boşsa 60 alınır.' },
    { key: 'fiyat', label: 'Fiyat (₺)', zorunlu: true, ipucu: ['fiyat', 'ucret', 'ücret', 'price', 'tutar'], ornek: '750', aciklama: 'Birim fiyat (sadece sayı, TL). Zorunlu.' },
  ],
}

export const PAKET_IMPORT: ImportConfig = {
  baslik: 'Paket', dosya: 'paket.php', action: 'toplu_ekle', invalidate: 'paketler',
  alanlar: [
    { key: 'ad', label: 'Paket Adı', zorunlu: true, ipucu: ['ad', 'paket', 'isim', 'name'], ornek: 'Lazer Tüm Vücut 8 Seans', aciklama: 'Paketin adı. Zorunlu, mükerrer olamaz.' },
    { key: 'hizmet', label: 'Hizmet (ad)', zorunlu: true, ipucu: ['hizmet', 'service', 'islem', 'işlem'], ornek: 'Lazer Tüm Vücut', aciklama: 'DİKKAT: Sistemdeki bir hizmetin adıyla BİREBİR aynı olmalı. Eşleşmezse satır atlanır. Önce hizmetleri ekleyin.' },
    { key: 'toplam_seans', label: 'Seans Sayısı', zorunlu: true, ipucu: ['seans', 'adet', 'sayi', 'sayı'], ornek: '8', aciklama: 'Paketteki toplam seans (sadece sayı). Zorunlu.' },
    { key: 'fiyat', label: 'Fiyat (₺)', zorunlu: true, ipucu: ['fiyat', 'ucret', 'ücret', 'price', 'tutar'], ornek: '20000', aciklama: 'Paket fiyatı (sadece sayı, TL). Zorunlu.' },
    { key: 'indirim_fiyat', label: 'İndirimli Fiyat', ipucu: ['indirim', 'kampanya', 'discount'], ornek: '16000', aciklama: 'Varsa kampanyalı fiyat (opsiyonel).' },
    { key: 'gecerlilik_gun', label: 'Geçerlilik (gün)', ipucu: ['gecerlilik', 'geçerlilik', 'gun', 'gün', 'sure', 'süre'], ornek: '365', aciklama: 'Paketin kaç gün geçerli olduğu (sadece sayı). Boşsa 365 alınır.' },
  ],
}

export const PERSONEL_IMPORT: ImportConfig = {
  baslik: 'Personel', dosya: 'personel.php', action: 'toplu_ekle', invalidate: 'personel',
  notlar: [
    ...GENEL_NOTLAR,
    'İçe aktarılan personellerin panel giriş şifresi varsayılan olarak 123456 atanır; sonra Personel ekranından değiştirilebilir.',
  ],
  alanlar: [
    { key: 'ad', label: 'Ad', zorunlu: true, ipucu: ['ad', 'isim', 'name'], ornek: 'Merve', aciklama: 'Personelin adı. Zorunlu.' },
    { key: 'soyad', label: 'Soyad', ipucu: ['soyad', 'soyisim', 'surname'], ornek: 'Demir', aciklama: 'Personelin soyadı.' },
    { key: 'telefon', label: 'Telefon', zorunlu: true, ipucu: ['telefon', 'gsm', 'cep', 'phone', 'tel'], ornek: '0532 111 22 33', aciklama: 'Cep telefonu (panel girişinde kullanılır). Zorunlu, mükerrer olamaz.' },
    { key: 'email', label: 'E-posta', ipucu: ['email', 'eposta', 'mail'], ornek: 'merve@ornek.com', aciklama: 'E-posta (opsiyonel).' },
    {
      key: 'uzmanlik', label: 'Görev / Sınıf', ipucu: ['gorev', 'görev', 'sinif', 'sınıf', 'uzmanlik', 'uzmanlık', 'unvan'], ornek: 'Lazer Uzmanı',
      aciklama: 'Geçerli değerlerden biri: Estetisyen, Makyöz, Kuaför, Masör, Cilt Bakım Uzmanı, Lazer Uzmanı, Diyetisyen, Eğitmen, Mesul Müdür, Müdür Yardımcısı, Kasa / Muhasebe, Resepsiyon, Temizlik Görevlisi, Servis Görevlisi, Stajyer, Diğer.',
    },
  ],
}
