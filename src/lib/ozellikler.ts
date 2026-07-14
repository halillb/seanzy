export type PaketTuru = string

export interface OzellikTanim {
  ad: string
  aciklama: string
  min: string
  grup: string
  benzersiz?: boolean // Seanzy'ye özgü, rakipte yok
}

export interface SaPaket {
  id: number
  ad: string
  kod: string
  fiyat: number
  sira: number
  aktif: boolean
}

const FALLBACK_SIRA: Record<string, number> = { free: 1, basic: 2, pro: 3, enterprise: 4 }

export function paketErisi(
  paket: string | undefined,
  gereken: string,
  paketler?: SaPaket[]
): boolean {
  if (!paketler || paketler.length === 0) {
    return (FALLBACK_SIRA[paket ?? 'basic'] ?? 0) >= (FALLBACK_SIRA[gereken] ?? 0)
  }
  const sira = (k: string) => paketler.find((p) => p.kod === k)?.sira ?? 0
  return sira(paket ?? 'basic') >= sira(gereken)
}

// Görsel yardımcılar — basic/pro/enterprise için sabit, diğerleri fallback
export const PAKET_RENK: Record<string, string> = {
  free: '#8DA0A8',
  basic: '#8DA9C4',
  pro: '#C9A96E',
  enterprise: '#C084FC',
}

export const PAKET_AD: Record<string, string> = {
  free: 'Ücretsiz',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export const OZELLIKLER: Record<string, OzellikTanim> = {
  /* ── Ücretsiz ─────────────────────────────────────────── */
  takvim:          { ad: 'Takvim',               aciklama: 'Gün/hafta/ay takvim görünümü',            min: 'free',       grup: 'Randevu'   },
  randevu:         { ad: 'Randevu Yönetimi',     aciklama: 'Randevu oluşturma ve geldi/gelmedi takibi', min: 'free',      grup: 'Randevu'   },
  musteri:         { ad: 'Müşteri Yönetimi',     aciklama: 'Müşteri kayıt ekleme',                    min: 'free',       grup: 'Müşteri'   },
  /* ── Basic ────────────────────────────────────────────── */
  online_randevu:  { ad: 'Online Randevu',       aciklama: 'Müşterilere özel randevu sayfası linki',  min: 'basic',      grup: 'Randevu'   },
  bekleyen:        { ad: 'Bekleyen Onaylar',     aciklama: 'Randevu onay/red akışı',                  min: 'basic',      grup: 'Randevu'   },
  personel:        { ad: 'Personel',             aciklama: 'Personel hesapları ve program takibi',    min: 'basic',      grup: 'Personel'  },
  hizmetler:       { ad: 'Hizmetler',            aciklama: 'Hizmet tanımları ve fiyatları',           min: 'basic',      grup: 'Hizmet'    },
  bildirimler:     { ad: 'Bildirimler',          aciklama: 'Sistem içi anlık bildirimler (zil)',       min: 'basic',      grup: 'İletişim'  },
  musteri_portal:  { ad: 'Müşteri Portalı',      aciklama: 'Müşteri randevularını görür, iptal talep edebilir, değerlendirme yapar', min: 'basic', grup: 'Müşteri' },
  /* ── Pro ─────────────────────────────────────────────── */
  paket_satis:     { ad: 'Paket Satışı',         aciklama: 'Seans tabanlı paket satışı ve takibi',    min: 'pro',        grup: 'Hizmet'    },
  finans:          { ad: 'Finans',               aciklama: 'Gelir/gider ve kâr takibi',               min: 'pro',        grup: 'Finans'    },
  adisyon:         { ad: 'Adisyon',              aciklama: 'Makbuz ve tahsilat yönetimi',             min: 'pro',        grup: 'Finans'    },
  raporlar:        { ad: 'Raporlar',             aciklama: 'İş analitik ve performans raporları',     min: 'pro',        grup: 'Raporlar'  },
  personel_prim:   { ad: 'Personel Prim',        aciklama: 'Hakediş oranı ve prim hesaplama',         min: 'pro',        grup: 'Personel'  },
  parapuan:        { ad: 'Parapuan Sistemi',     aciklama: 'Müşteri sadakat ve puan sistemi',         min: 'pro',        grup: 'Müşteri'   },
  anket:           { ad: 'Memnuniyet Anketleri', aciklama: 'Randevu sonrası müşteri geri bildirimi',  min: 'pro',        grup: 'Müşteri'   },
  google_review:   { ad: 'Google Değerlendirme', aciklama: 'Yüksek puanlı anketi Google Maps\'e yönlendir', min: 'pro',   grup: 'Pazarlama', benzersiz: true },
  email_sms:       { ad: 'E-posta & SMS',        aciklama: 'Randevu onay/hatırlatma e-posta ve SMS kanalı', min: 'pro',   grup: 'İletişim'   },
  bekleme_listesi: { ad: 'Bekleme Listesi',      aciklama: 'Dolu saatler için bekleme yönetimi',      min: 'pro',        grup: 'Randevu'   },
  kampanyalar:     { ad: 'Kampanyalar',          aciklama: 'İndirim ve kampanya yönetimi',            min: 'pro',        grup: 'Pazarlama' },
  pazarlama:       { ad: 'Pazarlama & ROI',      aciklama: 'Müşteri kaynak analizi ve ROI takibi',    min: 'pro',        grup: 'Pazarlama', benzersiz: true },
  reklam:          { ad: 'Reklam Anlaşmaları',   aciklama: 'Influencer ve reklam kampanya takibi',    min: 'pro',        grup: 'Pazarlama', benzersiz: true },
  disa_aktar:      { ad: 'Dışa Aktarma',         aciklama: 'Excel/CSV veri aktarımı',                 min: 'pro',        grup: 'Sistem'    },
  salon_skoru:     { ad: 'Salon Skoru',          aciklama: 'Bütünleşik işletme sağlık & doluluk skoru', min: 'pro',     grup: 'Raporlar',  benzersiz: true },
  musteri_paneli:  { ad: 'Müşteri Paneli Erişimi', aciklama: 'Müşterilerin kendi hesabıyla giriş yapıp portalı kullanması', min: 'basic', grup: 'Müşteri' },
  personel_paneli: { ad: 'Personel Paneli Erişimi', aciklama: 'Personelin kendi hesabıyla giriş yapıp programını görmesi', min: 'basic', grup: 'Personel' },
  /* ── Enterprise ──────────────────────────────────────── */
  urun_stok:       { ad: 'Ürün & Stok',         aciklama: 'Ürün satışı, stok ve barkod yönetimi',    min: 'enterprise', grup: 'Ürün'      },
  cok_sube:        { ad: 'Çoklu Şube',          aciklama: 'Birden fazla şube ve personel yönetimi',  min: 'enterprise', grup: 'Sistem'    },
  dijital_imza:    { ad: 'Dijital Onam',         aciklama: 'Müşteri onam formu ve dijital imza',      min: 'enterprise', grup: 'Sistem'    },
  gelismis_rapor:  { ad: 'Gelişmiş Raporlar',   aciklama: 'BI analitik ve özel rapor oluşturucu',    min: 'enterprise', grup: 'Raporlar'  },
  oncelikli_destek: { ad: 'Öncelikli Destek',   aciklama: 'Öncelikli müşteri destek hattı ve daha hızlı yanıt süresi', min: 'enterprise', grup: 'Sistem' },
  ozel_entegrasyon: { ad: 'Özel Entegrasyon',   aciklama: 'İsteğe özel API/entegrasyon ve kurulum desteği', min: 'enterprise', grup: 'Sistem' },
}

// Route → gereken özellik eşlemesi
export const ROTA_OZELLIK: Partial<Record<string, keyof typeof OZELLIKLER>> = {
  '/takvim':             'takvim',
  '/randevular':         'randevu',
  '/bekleyen':           'bekleyen',
  '/musteriler':         'musteri',
  '/personel':           'personel',
  '/hizmetler':          'hizmetler',
  '/paketler':           'paket_satis',
  '/finans':             'finans',
  '/adisyon':            'adisyon',
  '/raporlar':           'raporlar',
  '/personel-prim':      'personel_prim',
  '/bekleme-listesi':    'bekleme_listesi',
  '/kampanyalar':        'kampanyalar',
  '/pazarlama':          'pazarlama',
  '/reklam-anlasmalari': 'reklam',
  '/disa-aktar':         'disa_aktar',
  '/salon-skoru':        'salon_skoru',
  '/urun-stok':          'urun_stok',
}
