import type { OZELLIKLER } from './ozellikler'

export interface RehberGirdi {
  yol?: string
  adimlar: string[]
}

// Her özellik için: nerede bulunur (yol) + adım adım nasıl kullanılır
export const KULLANIM_REHBERI: Partial<Record<keyof typeof OZELLIKLER, RehberGirdi>> = {
  takvim: {
    yol: '/takvim',
    adimlar: [
      'Sol menüden Takvim\'e girin.',
      'Üstten Günlük / Haftalık / Aylık görünüm seçin.',
      'Boş bir saate tıklayarak yeni randevu oluşturabilir, mevcut bir randevuya tıklayarak detayını görebilirsiniz.',
      'Masaüstünde fare ile sürükleyerek saatler arasında kaydırabilirsiniz.',
    ],
  },
  randevu: {
    yol: '/randevular',
    adimlar: [
      'Sol menüden Randevular\'a girin veya Takvim\'den "+ Randevu" ile yeni kayıt açın.',
      'Müşteri, hizmet, personel ve saat seçip kaydedin — birden fazla hizmet/seri randevu ekleyebilirsiniz.',
      'Randevu günü geldiğinde randevunun üstüne tıklayıp "Tamamla" ile geldi/gelmedi işaretleyin — bu otomatik olarak seans/paket düşümünü de yapar.',
    ],
  },
  online_randevu: {
    yol: '/ayarlar',
    adimlar: [
      'Ayarlar sayfasından işletmenize özel online randevu linkini kopyalayın.',
      'Bu linki müşterilerinizle (Instagram bio, WhatsApp vb.) paylaşın.',
      'Müşteri linke girip kendi randevusunu talep eder, siz Bekleyen Onaylar\'dan onaylarsınız.',
    ],
  },
  bekleyen: {
    yol: '/bekleyen',
    adimlar: [
      'Sol menüden Bekleyen RV\'ye girin.',
      'Müşterilerin online talep ettiği randevuları görüp Onayla/Reddet ile işleme alın.',
    ],
  },
  bekleme_listesi: {
    yol: '/bekleme-listesi',
    adimlar: [
      'İstenen saat doluysa müşteriyi Bekleme Listesi\'ne ekleyin.',
      'O saat boşaldığında sistem/siz müşteriyi bilgilendirip randevuya çevirebilirsiniz.',
    ],
  },
  musteri: {
    yol: '/musteriler',
    adimlar: [
      'Sol menüden Müşteriler\'e girin.',
      '"+ Müşteri Ekle" ile yeni kayıt açın (ad, telefon, not vb.).',
      'Bir müşteriye tıklayarak geçmiş randevularını, paketlerini ve notlarını görebilirsiniz.',
    ],
  },
  musteri_portal: {
    adimlar: [
      'Müşterinize giriş bilgilerini (telefon + şifre) verin veya online randevu linkinden kayıt oluşturmasını sağlayın.',
      'Müşteri kendi hesabıyla giriş yaptığında randevularını görür, iptal talep edebilir ve hizmet sonrası değerlendirme yapabilir.',
    ],
  },
  musteri_paneli: {
    adimlar: [
      'Bu özellik açıkken müşterileriniz "Müşteri Portalı" na (randevu görüntüleme, iptal, değerlendirme) giriş yapabilir.',
      'Kapalıysa müşteri girişi engellenir, sadece siz (mudur) müşteri kayıtlarını yönetirsiniz.',
    ],
  },
  parapuan: {
    yol: '/parapuan',
    adimlar: [
      'Sol menüden Parapuan\'a girin, puan kazanma/harcama oranlarını ayarlayın.',
      'Müşteri her tamamlanan randevuda otomatik puan kazanır, sonraki ödemede puanını kullanabilir.',
    ],
  },
  anket: {
    yol: '/anket',
    adimlar: [
      'Randevu tamamlandıktan sonra müşteriye otomatik memnuniyet anketi gönderilir.',
      'Anket\'ten gelen sonuçları buradan görüntüleyip düşük puanlı geri bildirimlere aksiyon alabilirsiniz.',
    ],
  },
  personel: {
    yol: '/personel',
    adimlar: [
      'Sol menüden Personel\'e girin, "+ Personel Ekle" ile hesap oluşturun (ad, telefon, çalışma saatleri).',
      'Personele giriş bilgisi verin — kendi telefon/şifresiyle giriş yapıp programını görebilir.',
      'Takvim ayarlarından personel sıralamasını sürükleyerek düzenleyebilirsiniz.',
    ],
  },
  personel_prim: {
    yol: '/personel-prim',
    adimlar: [
      'Sol menüden Personel Prim\'e girin.',
      'Her personel için hakediş/prim oranını belirleyin — sistem tamamlanan randevulardan otomatik hesaplar.',
    ],
  },
  personel_paneli: {
    adimlar: [
      'Bu özellik açıkken personeliniz kendi hesabıyla giriş yapıp günlük programını, randevularını görebilir.',
      'Kapalıysa personel girişi engellenir, sadece siz (mudur) personel programlarını yönetirsiniz.',
    ],
  },
  hizmetler: {
    yol: '/hizmetler',
    adimlar: [
      'Sol menüden Hizmetler\'e girin.',
      'Kategori oluşturup her hizmete ad, süre ve fiyat tanımlayın — randevu oluştururken bu listeden seçilir.',
    ],
  },
  paket_satis: {
    yol: '/hizmetler',
    adimlar: [
      'Hizmetler sayfasında bir hizmeti seans tabanlı pakete çevirin (ör. "10 Seans Lazer Epilasyon").',
      'Randevu oluştururken müşteriye bu paketi satabilir, her tamamlanan seansta paket bakiyesinden otomatik düşülür.',
    ],
  },
  bildirimler: {
    yol: '/bildirim-ayarlari',
    adimlar: [
      'Sistem içi bildirimler (zil ikonu) otomatik çalışır — yeni randevu, iptal gibi olaylarda anlık uyarı alırsınız.',
      'Bildirim Ayarları\'ndan hangi olaylarda ses/bildirim istediğinizi özelleştirebilirsiniz.',
    ],
  },
  email_sms: {
    yol: '/bildirim-ayarlari',
    adimlar: [
      'Bildirim Ayarları\'ndan e-posta ve SMS kanallarını açın.',
      'Randevu onayı, hatırlatma gibi mesajlar müşteriye otomatik e-posta/SMS olarak gider (sağlayıcı entegrasyonu Süper Admin tarafından tanımlanmalı).',
    ],
  },
  finans: {
    yol: '/finans',
    adimlar: [
      'Sol menüden Finans\'a girin.',
      'Gelir/gider kayıtlarını ve dönemsel kâr-zarar özetini buradan takip edin — tamamlanan randevu ödemeleri otomatik yansır.',
    ],
  },
  adisyon: {
    yol: '/adisyon',
    adimlar: [
      'Randevu tamamlandığında Adisyon\'dan makbuz/tahsilat kaydı oluşturun.',
      'Nakit/kart/havale gibi ödeme tiplerini ayırarak kayıt tutabilirsiniz.',
    ],
  },
  raporlar: {
    yol: '/raporlar',
    adimlar: [
      'Sol menüden Raporlar\'a girin.',
      'Ciro, doluluk, personel performansı gibi dönemsel raporları filtreleyip inceleyin.',
    ],
  },
  gelismis_rapor: {
    yol: '/raporlar',
    adimlar: [
      'Raporlar sayfasında gelişmiş filtreleme ve özel rapor oluşturucu seçeneklerini kullanın (Enterprise\'a özel).',
    ],
  },
  salon_skoru: {
    yol: '/salon-skoru',
    adimlar: [
      'Sol menüden Salon Skoru\'na girin.',
      'İşletmenizin doluluk, müşteri memnuniyeti ve genel sağlığını tek bir skorda görün, iyileştirme önerilerini takip edin.',
    ],
  },
  google_review: {
    yol: '/anket',
    adimlar: [
      'Anket ayarlarından Google Değerlendirme yönlendirmesini açın.',
      'Yüksek puan veren müşteriler otomatik olarak işletmenizin Google Maps değerlendirme sayfasına yönlendirilir.',
    ],
  },
  kampanyalar: {
    yol: '/kampanyalar',
    adimlar: [
      'Sol menüden Kampanyalar\'a girin.',
      'İndirim/kampanya oluşturup belirli hizmetlere veya tüm müşterilere uygulayın.',
    ],
  },
  pazarlama: {
    yol: '/pazarlama',
    adimlar: [
      'Sol menüden Pazarlama\'ya girin.',
      'Müşterilerinizin sizi nereden duyduğunu (Instagram, referans, Google vb.) kaydedip hangi kaynağın en çok getiri sağladığını (ROI) görün.',
    ],
  },
  reklam: {
    yol: '/reklam-anlasmalari',
    adimlar: [
      'Sol menüden Reklam Anlaşmaları\'na girin.',
      'Influencer/reklam iş birliklerini, anlaşma tutarlarını ve bu kaynaktan gelen randevu/geliri takip edin.',
    ],
  },
  disa_aktar: {
    yol: '/disa-aktar',
    adimlar: [
      'Sol menüden Dışa Aktar\'a girin.',
      'Müşteri, randevu veya finans verilerinizi Excel/CSV olarak indirin.',
    ],
  },
  urun_stok: {
    yol: '/urun-stok',
    adimlar: [
      'Sol menüden Ürün & Stok\'a girin.',
      'Satılan ürünleri tanımlayıp stok miktarlarını takip edin, adisyona ürün satışı ekleyebilirsiniz.',
    ],
  },
  cok_sube: {
    adimlar: [
      'Süper Admin ile iletişime geçerek işletmenize ek şube tanımlatın.',
      'Her şube kendi takvimi, personeli ve stoğuyla ayrı yönetilir, merkezi raporlarda birleşik görünür (Enterprise\'a özel).',
    ],
  },
  dijital_imza: {
    adimlar: [
      'Randevu/müşteri kaydı sırasında dijital onam formu gönderin.',
      'Müşteri formu telefonundan imzalar, imzalı form otomatik müşteri dosyasına eklenir (Enterprise\'a özel).',
    ],
  },
  oncelikli_destek: {
    adimlar: [
      'Bu pakette destek talepleriniz öncelikli sıraya alınır, daha hızlı yanıt alırsınız.',
      'Destek talebi için info@homedya.com üzerinden bize ulaşın.',
    ],
  },
  ozel_entegrasyon: {
    adimlar: [
      'İhtiyacınız olan özel entegrasyon (muhasebe programı, kendi API\'niz vb.) için bizimle iletişime geçin.',
      'Kurulum ve entegrasyon süreci ekibimiz tarafından sizin için özel olarak yapılır.',
    ],
  },
}
