import type { OZELLIKLER } from './ozellikler'

export interface RehberGirdi {
  yol?: string
  /** Kurulumu/kullanımı kimin yaptığı: Mudur, Personel, Müşteri, Süper Admin veya birden fazlası */
  kim: string
  adimlar: string[]
}

// Her özellik için: kim yapıyor + nerede bulunur (yol) + adım adım nasıl kullanılır/kurulur
export const KULLANIM_REHBERI: Partial<Record<keyof typeof OZELLIKLER, RehberGirdi>> = {
  takvim: {
    yol: '/takvim',
    kim: 'Mudur, Personel',
    adimlar: [
      'Sol menüden Takvim\'e girin.',
      'Üstten Günlük / Haftalık / Aylık görünüm seçin.',
      'Boş bir saate tıklayarak yeni randevu oluşturabilir, mevcut bir randevuya tıklayarak detayını görebilirsiniz.',
      'Masaüstünde fare tekerleği veya sürükleyerek saatler arasında kaydırabilirsiniz.',
      'Takvim Ayarları\'ndan (Ayarlar sayfası) hangi personelin takvimde görüneceğini ve sırasını sürükleyerek düzenleyebilirsiniz.',
      'Ek kurulum gerekmez, hesap açıldığı andan itibaren kullanılabilir.',
    ],
  },
  randevu: {
    yol: '/randevular',
    kim: 'Mudur, Personel',
    adimlar: [
      'Sol menüden Randevular\'a girin veya Takvim\'de boş bir saate tıklayıp "+ Randevu" ile yeni kayıt açın.',
      'Müşteri seçin (veya yeni müşteri ekleyin), hizmet(ler)i, personeli ve saati belirleyin.',
      'Aynı müşteri için birden fazla hizmeti tek randevuda birleştirebilir, "seri randevu" ile aynı saatte haftalık/periyodik tekrar oluşturabilirsiniz.',
      'Randevu günü geldiğinde randevunun üstüne tıklayıp "Tamamla" butonuna basın — geldi/gelmedi burada işaretlenir.',
      '"Tamamla" işlemi otomatik olarak: hizmet ücretini adisyona işler, müşterinin paket bakiyesi varsa 1 seans düşer, parapuan açıksa puan ekler.',
      'Ek kurulum gerekmez.',
    ],
  },
  online_randevu: {
    yol: '/ayarlar',
    kim: 'Mudur (kurulum), Müşteri (kullanım)',
    adimlar: [
      'Mudur: Ayarlar sayfasına girip işletmenize özel online randevu linkini (işletme kodunuza göre otomatik oluşur) kopyalayın.',
      'Bu linki Instagram bio, WhatsApp durumu, Google İşletme Profili gibi yerlerde paylaşın.',
      'Müşteri: Linke tıklayıp hizmet/personel/saat seçerek randevu talebinde bulunur — bu talep otomatik olarak sisteme düşer.',
      'Mudur: Gelen talebi Bekleyen RV sayfasından onaylar veya reddeder; onaylanan randevu doğrudan takvime işlenir.',
    ],
  },
  bekleyen: {
    yol: '/bekleyen',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Bekleyen RV\'ye girin.',
      'Müşterilerin Online Randevu linkinden gönderdiği talepleri liste halinde görürsünüz.',
      'Her talebi inceleyip "Onayla" (takvime işlenir) veya "Reddet" (müşteriye bilgi gider) ile sonuçlandırın.',
    ],
  },
  bekleme_listesi: {
    yol: '/bekleme-listesi',
    kim: 'Mudur, Personel',
    adimlar: [
      'Müşterinin istediği saat doluysa, randevu ekranından "Bekleme Listesine Ekle" seçeneğini kullanın.',
      'Sol menüden Bekleme Listesi\'ne girip bekleyen müşterileri görün.',
      'O saat/personel programında bir iptal/boşluk oluştuğunda müşteriyi arayıp randevuya çevirebilirsiniz.',
    ],
  },
  musteri: {
    yol: '/musteriler',
    kim: 'Mudur, Personel',
    adimlar: [
      'Sol menüden Müşteriler\'e girin.',
      '"+ Müşteri Ekle" ile yeni kayıt açın — ad soyad, telefon (zorunlu), e-posta, doğum günü, not ekleyebilirsiniz.',
      'Bir müşteri satırına tıklayarak geçmiş randevularını, satın aldığı paketleri, parapuan bakiyesini ve notlarını tek ekranda görebilirsiniz.',
      'Toplu müşteri aktarımı için Excel şablonuyla "Toplu Ekle" seçeneğini kullanabilirsiniz.',
    ],
  },
  musteri_portal: {
    kim: 'Mudur (kurulum), Müşteri (kullanım)',
    adimlar: [
      'Mudur: Müşteri kaydı açarken telefon numarası girilmesi yeterli — müşteri bu numara + kendi belirleyeceği şifreyle "Müşteri Girişi" ekranından giriş yapabilir hale gelir.',
      'Müşteri: homedya.com/estetix adresinden telefon+şifre ile giriş yapar, kendi randevularını görür, iptal talep edebilir, tamamlanan hizmet için değerlendirme/anket doldurabilir.',
      'Bu özellik "Müşteri Paneli Erişimi" özelliğiyle birlikte açık olmalıdır (aşağıda ayrı madde).',
    ],
  },
  musteri_paneli: {
    kim: 'Süper Admin / Paket (otomatik)',
    adimlar: [
      'Bu, ayrı bir kurulum gerektirmeyen bir erişim anahtarıdır — paketinizde açıksa müşterileriniz Müşteri Portalı\'na giriş yapabilir.',
      'Kapalıysa (örn. Ücretsiz pakette) müşteri girişi tamamen engellenir, "Bu panel paketinize dahil değil" mesajı görülür.',
      'Açmak için paketinizi yükseltmeniz yeterlidir, ek bir ayar girmeniz gerekmez.',
    ],
  },
  parapuan: {
    yol: '/parapuan',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Parapuan\'a girin.',
      'Puan kazanma oranını (ör. her 10₺ harcamaya 1 puan) ve puan değerini (1 puan = kaç ₺ indirim) belirleyin.',
      'Randevu "Tamamla" ile kapatıldığında müşteri otomatik puan kazanır.',
      'Yeni randevu/adisyon ekranında müşterinin puanını görüp ödemede indirim olarak kullanabilirsiniz.',
    ],
  },
  anket: {
    yol: '/anket',
    kim: 'Mudur (kurulum), Müşteri (doldurma)',
    adimlar: [
      'Mudur: Anket sayfasından anket sorularını ve gönderim tetikleyicisini (randevu tamamlanınca otomatik) düzenleyin.',
      'Müşteri: Randevu tamamlandıktan sonra Müşteri Portalı\'nda veya gönderilen linkte anketi doldurur.',
      'Mudur: Gelen sonuçları Anket sayfasından görüntüleyip düşük puanlı geri bildirimlere dönüş yapabilirsiniz.',
    ],
  },
  personel: {
    yol: '/personel',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Personel\'e girin, "+ Personel Ekle" ile hesap oluşturun (ad, telefon, çalışma günleri/saatleri, hizmet yetkinlikleri).',
      'Oluşturduğunuz telefon numarasını ve belirlediğiniz şifreyi personelinize iletin.',
      'Personel, aynı giriş ekranından (işletme kodu + kendi telefon/şifresi) giriş yaparak kendi programını görebilir (bkz. Personel Paneli Erişimi).',
      'Takvim Ayarları\'ndan personel sırasını sürükleyerek, aktif/pasif durumunu değiştirebilirsiniz.',
    ],
  },
  personel_prim: {
    yol: '/personel-prim',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Personel Prim\'e girin.',
      'Her personel için hizmet bazlı veya genel yüzdelik hakediş/prim oranını girin.',
      'Sistem, o personelin tamamladığı her randevudan otomatik prim hesaplar; dönem sonunda toplam hakedişi buradan görürsünüz.',
    ],
  },
  personel_paneli: {
    kim: 'Süper Admin / Paket (otomatik)',
    adimlar: [
      'Ayrı bir kurulum gerektirmez — paketinizde açıksa personeliniz kendi hesabıyla giriş yapıp günlük programını görebilir.',
      'Kapalıysa personel girişi engellenir, programlarını sadece siz (mudur) yönetip görüntülersiniz.',
      'Açmak için paketinizi yükseltmeniz yeterlidir.',
    ],
  },
  hizmetler: {
    yol: '/hizmetler',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Hizmetler\'e girin.',
      'Önce kategori oluşturun (ör. "Cilt Bakımı", "Saç"), sonra her kategoriye hizmet ekleyin: ad, süre (dk), fiyat.',
      'Bu liste; randevu oluştururken, online randevu sayfasında ve paket satışında otomatik olarak kullanılır.',
    ],
  },
  paket_satis: {
    yol: '/hizmetler',
    kim: 'Mudur',
    adimlar: [
      'Hizmetler sayfasında bir hizmeti düzenleyip "Seans Paketi" olarak işaretleyin (ör. "10 Seans Lazer Epilasyon", toplam fiyat).',
      'Randevu veya Müşteriler ekranından müşteriye bu paketi satın, ödemesini adisyona işleyin.',
      'Müşteri her randevu geldiğinde "Tamamla" dediğinizde paket bakiyesinden otomatik 1 seans düşer — kalan seans sayısı müşteri kartında görünür.',
    ],
  },
  bildirimler: {
    yol: '/bildirim-ayarlari',
    kim: 'Mudur, Personel (kişisel tercih)',
    adimlar: [
      'Uygulama içi bildirimler (sağ üstteki zil ikonu) otomatik çalışır — yeni randevu, iptal, bekleyen onay gibi olaylarda anlık uyarı gelir, ek kurulum gerekmez.',
      'Bildirim Ayarları sayfasından kendi hesabınız için hangi olaylarda ses/görsel bildirim istediğinizi açıp kapatabilirsiniz.',
      'Rol bazlı varsayılan bildirim sesi zaten tanımlıdır, isterseniz kendi tercihinize göre değiştirebilirsiniz.',
    ],
  },
  email_sms: {
    yol: '/ayarlar',
    kim: 'Mudur (talep), Süper Admin (fiili kurulum)',
    adimlar: [
      'Mudur: Ayarlar sayfasında "Bildirim Kanalları" bölümünden E-posta/SMS/WhatsApp kanallarını hangilerinin aktif olacağını seçin.',
      'Eğer SMS/WhatsApp için işletmenize özel bir sağlayıcı (kendi API hesabınız) kullanmak isterseniz, aynı sayfadan "Kurulum Talebi" oluşturun (telefon, işletme adı, tercih ettiğiniz sağlayıcı).',
      'Süper Admin: Gelen talebi "Entegrasyon Talepleri" ekranından görür, sizinle iletişime geçip gerekli API bilgilerini arka planda kendisi girer ve talebi "Tamamlandı" yapar.',
      'Kurulum tamamlanana kadar sistem, Seanzy\'nin genel/varsayılan e-posta-SMS altyapısını kullanmaya devam eder — yani kanal hemen çalışır, özel kurulum sadece kendi markanızla göndermek istediğinizde gerekir.',
      'Randevu onayı, hatırlatma gibi mesajlar bu ayara göre otomatik müşteriye gönderilir.',
    ],
  },
  finans: {
    yol: '/finans',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Finans\'a girin.',
      'Tamamlanan randevu ödemeleri buraya otomatik yansır; ayrıca elle gider (kira, malzeme vb.) kaydı ekleyebilirsiniz.',
      'Dönem (gün/hafta/ay) seçip gelir-gider-kâr özetini görüntüleyin.',
    ],
  },
  adisyon: {
    yol: '/adisyon',
    kim: 'Mudur, Personel',
    adimlar: [
      'Randevu "Tamamla" ile kapatıldığında sistem otomatik bir adisyon/tahsilat kaydı önerir.',
      'Ödeme tipini (nakit/kart/havale/parapuan) seçip tahsilatı onaylayın.',
      'Adisyon sayfasından geçmiş tüm tahsilat kayıtlarını filtreleyip görebilirsiniz.',
    ],
  },
  raporlar: {
    yol: '/raporlar',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Raporlar\'a girin.',
      'Tarih aralığı seçip ciro, doluluk oranı, en çok satan hizmet, personel bazlı performans gibi raporları filtreleyin.',
    ],
  },
  gelismis_rapor: {
    yol: '/raporlar',
    kim: 'Mudur',
    adimlar: [
      'Raporlar sayfasında (Enterprise pakette) ek olarak gelişmiş filtreleme ve özel rapor oluşturucu seçenekleri görünür.',
      'İstediğiniz metrikleri seçip kendi özel raporunuzu oluşturup dışa aktarabilirsiniz.',
    ],
  },
  salon_skoru: {
    yol: '/salon-skoru',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Salon Skoru\'na girin.',
      'Doluluk, müşteri memnuniyeti, tekrar müşteri oranı gibi verilerden hesaplanan tek bir skor görürsünüz.',
      'Skoru düşüren alanlar için sistemin sunduğu iyileştirme önerilerini inceleyin.',
    ],
  },
  google_review: {
    yol: '/anket',
    kim: 'Mudur',
    adimlar: [
      'Anket sayfasına girin, "Google Değerlendirme" bölümünü bulun.',
      'Google İşletme Profilinizden "yorum yazma linkinizi" kopyalayıp buraya yapıştırın (tamamen kendi panelinizden, Süper Admin\'e ihtiyaç yok).',
      'Ayarı kaydettikten sonra: müşteri anketten yüksek puan verirse (ör. 4-5 yıldız) otomatik olarak bu Google linkine yönlendirilir; düşük puan verirse yönlendirme yapılmaz (olumsuz yorumların herkese açık Google\'a düşmesi önlenir).',
    ],
  },
  kampanyalar: {
    yol: '/kampanyalar',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Kampanyalar\'a girin.',
      '"+ Kampanya" ile indirim oranı/tutarı, geçerlilik tarihi ve hangi hizmetlere/müşteri gruplarına uygulanacağını belirleyin.',
      'Aktif kampanyalar randevu/adisyon ekranında otomatik indirim seçeneği olarak çıkar.',
    ],
  },
  pazarlama: {
    yol: '/pazarlama',
    kim: 'Mudur',
    adimlar: [
      'Müşteri kaydı eklerken veya düzenlerken "Nereden duydu?" alanını doldurun (Instagram, referans, Google, tabela vb.).',
      'Sol menüden Pazarlama\'ya girip hangi kaynağın kaç müşteri ve ne kadar ciro getirdiğini (ROI) karşılaştırmalı olarak görün.',
      'Bu veriyle hangi pazarlama kanalına daha çok yatırım yapacağınıza karar verebilirsiniz.',
    ],
  },
  reklam: {
    yol: '/reklam-anlasmalari',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Reklam Anlaşmaları\'na girin.',
      'İş birliği yaptığınız influencer/reklam verenin bilgilerini, anlaşma tutarını ve dönemini kaydedin.',
      'Bu kaynaktan gelen müşterileri Pazarlama sayfasındaki "kaynak" alanıyla ilişkilendirip getirisini karşılaştırın.',
    ],
  },
  disa_aktar: {
    yol: '/disa-aktar',
    kim: 'Mudur',
    adimlar: [
      'Sol menüden Dışa Aktar\'a girin.',
      'Müşteri, randevu veya finans verisi türünü ve tarih aralığını seçin.',
      '"İndir" ile Excel/CSV dosyasını bilgisayarınıza kaydedin.',
    ],
  },
  urun_stok: {
    yol: '/urun-stok',
    kim: 'Mudur, Personel',
    adimlar: [
      'Sol menüden Ürün & Stok\'a girin.',
      'Sattığınız ürünleri (bakım kremi, şampuan vb.) ad, fiyat ve stok adediyle tanımlayın.',
      'Adisyon ekranında randevuya ek olarak ürün satışı ekleyebilirsiniz — satış stoktan otomatik düşer.',
      'Stok azaldığında sayfada uyarı görürsünüz.',
    ],
  },
  cok_sube: {
    kim: 'Süper Admin',
    adimlar: [
      'Bu özellik kendi panelinizden açılamaz — Süper Admin ile iletişime geçip (info@homedya.com) ek şube talebinde bulunmanız gerekir.',
      'Süper Admin, işletmenize yeni bir şube tanımlar; her şube kendi takvimi, personeli ve stoğuyla ayrı çalışır.',
      'Şubeler arası geçiş, panelin üst kısmında çıkan şube seçiciyle yapılır; merkezi raporlarda tüm şubeler birleşik görünür.',
    ],
  },
  dijital_imza: {
    kim: 'Mudur (gönderme), Müşteri (imzalama)',
    adimlar: [
      'Müşteri kaydı veya randevu ekranında "Onam Formu Gönder" seçeneğini kullanın.',
      'Müşteriye SMS/e-posta ile imza linki gider, kendi telefonundan parmağıyla imzalar.',
      'İmzalanan form otomatik olarak o müşterinin dosyasına PDF olarak eklenir, dilediğiniz zaman görüntüleyebilirsiniz.',
    ],
  },
  oncelikli_destek: {
    kim: 'Mudur',
    adimlar: [
      'Bu bir hizmet kalitesi ayrıcalığıdır, panelde ayrı bir ekranı yoktur.',
      'Destek talebinizi her zamanki gibi info@homedya.com üzerinden iletin — bu pakette talebiniz öncelikli sıraya alınıp daha hızlı yanıtlanır.',
    ],
  },
  ozel_entegrasyon: {
    kim: 'Mudur (talep), Süper Admin (kurulum)',
    adimlar: [
      'Mudur: info@homedya.com üzerinden ihtiyacınız olan özel entegrasyonu (muhasebe programı, kendi API\'niz, farklı bir randevu sistemi vb.) bize iletin.',
      'Süper Admin: İhtiyacı değerlendirip kurulum ve entegrasyon sürecini sizin için özel olarak (arka planda, teknik ekip tarafından) yürütür.',
      'Kurulum tamamlandığında size ayrıca bilgi verilir, panelinizde ilgili özellik aktif hale gelir.',
    ],
  },
}
