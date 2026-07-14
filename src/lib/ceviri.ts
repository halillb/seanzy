import { useDil, type Dil } from '../store/dil'

type Ceviri = { tr: string; en: string; ar?: string }

/** Uygulama metinleri sözlüğü. Yeni anahtar ekledikçe buraya yaz. */
export const SOZLUK: Record<string, Ceviri> = {
  // ── Genel ──
  'genel.kaydet': { tr: 'Kaydet', en: 'Save', ar: 'حفظ' },
  'genel.iptal': { tr: 'İptal', en: 'Cancel', ar: 'إلغاء' },
  'genel.kapat': { tr: 'Kapat', en: 'Close', ar: 'إغلاق' },
  'genel.cikis': { tr: 'Çıkış', en: 'Log out', ar: 'خروج' },
  'genel.ara': { tr: 'Ara…', en: 'Search…', ar: 'بحث…' },
  'genel.sutunlar': { tr: 'Sütunlar', en: 'Columns', ar: 'الأعمدة' },
  'genel.randevu': { tr: 'Randevu', en: 'Appointment', ar: 'موعد' },

  // ── Genel Bakış (dashboard) ──
  'gb.gunluk': { tr: 'Günlük', en: 'Daily', ar: 'يومي' },
  'gb.haftalik': { tr: 'Haftalık', en: 'Weekly', ar: 'أسبوعي' },
  'gb.aylik': { tr: 'Aylık', en: 'Monthly', ar: 'شهري' },
  'gb.randevuBugun': { tr: 'Bugünkü Randevu', en: "Today's Appointments", ar: 'مواعيد اليوم' },
  'gb.randevuHafta': { tr: 'Bu Hafta Randevu', en: 'Appointments This Week', ar: 'مواعيد هذا الأسبوع' },
  'gb.randevuAy': { tr: 'Bu Ay Randevu', en: 'Appointments This Month', ar: 'مواعيد هذا الشهر' },
  'gb.gelirGun': { tr: 'Günlük Gelir', en: 'Daily Revenue', ar: 'الإيراد اليومي' },
  'gb.gelirHafta': { tr: 'Haftalık Gelir', en: 'Weekly Revenue', ar: 'الإيراد الأسبوعي' },
  'gb.gelirAy': { tr: 'Aylık Gelir', en: 'Monthly Revenue', ar: 'الإيراد الشهري' },
  'gb.aktifMusteri': { tr: 'Aktif Müşteri', en: 'Active Customers', ar: 'العملاء النشطون' },
  'gb.doluluk': { tr: 'Doluluk (bugün)', en: 'Occupancy (today)', ar: 'الإشغال (اليوم)' },
  'gb.ajanda': { tr: 'Bugünün Ajandası', en: "Today's Agenda", ar: 'جدول اليوم' },
  'gb.takvimeGit': { tr: 'Takvime git', en: 'Go to calendar', ar: 'إلى التقويم' },
  'gb.ajandaYok': { tr: 'Bugün için randevu yok.', en: 'No appointments for today.', ar: 'لا مواعيد لليوم.' },
  'gb.personelDoluluk': { tr: 'Personel Doluluğu (bugün)', en: 'Staff Occupancy (today)', ar: 'إشغال الموظفين (اليوم)' },
  'gb.doluPersonelYok': { tr: 'Bugün dolu personel yok.', en: 'No staff occupied today.', ar: 'لا موظفين مشغولين اليوم.' },

  // ── Login ──
  'login.slogan': { tr: 'Güzellik & Estetik Yönetimi', en: 'Beauty & Aesthetics Management', ar: 'إدارة التجميل والجمال' },
  'login.kod': { tr: 'İşletme Kodu', en: 'Business Code', ar: 'رمز المنشأة' },
  'login.kodIpucu': { tr: 'isletme-kodunuz', en: 'your-business-code', ar: 'رمز-منشأتك' },
  'login.giris': { tr: 'Telefon veya E-posta', en: 'Phone or E-mail', ar: 'الهاتف أو البريد' },
  'login.sifre': { tr: 'Şifre', en: 'Password', ar: 'كلمة المرور' },
  'login.girisYap': { tr: 'Giriş Yap', en: 'Sign In', ar: 'تسجيل الدخول' },
  'login.altbilgi': { tr: 'Seanzy v3.0 · Tüm hakları saklıdır', en: 'Seanzy v3.0 · All rights reserved', ar: 'Seanzy v3.0 · جميع الحقوق محفوظة' },

  // ── Roller ──
  'rol.mudur': { tr: 'Müdür Paneli', en: 'Manager Panel', ar: 'لوحة المدير' },
  'rol.superadmin': { tr: 'Süper Admin', en: 'Super Admin', ar: 'المشرف العام' },
  'rol.personel': { tr: 'Personel', en: 'Staff', ar: 'الموظف' },
  'rol.musteri': { tr: 'Müşteri', en: 'Customer', ar: 'العميل' },

  // ── Sidebar grupları ──
  'grp.calisma': { tr: 'Çalışma', en: 'Work', ar: 'العمل' },
  'grp.musteriler': { tr: 'Müşteriler', en: 'Customers', ar: 'العملاء' },
  'grp.salon': { tr: 'Salon', en: 'Salon', ar: 'الصالون' },
  'grp.pazarlama': { tr: 'Pazarlama', en: 'Marketing', ar: 'التسويق' },
  'grp.sistem': { tr: 'Sistem', en: 'System', ar: 'النظام' },
  'grp.panelim': { tr: 'Panelim', en: 'My Panel', ar: 'لوحتي' },
  'grp.hesabim': { tr: 'Hesabım', en: 'My Account', ar: 'حسابي' },
  'grp.yonetim': { tr: 'Yönetim', en: 'Administration', ar: 'الإدارة' },

  // ── Sidebar menü ──
  'nav.genelBakis': { tr: 'Genel Bakış', en: 'Overview', ar: 'نظرة عامة' },
  'nav.takvim': { tr: 'Takvim', en: 'Calendar', ar: 'التقويم' },
  'nav.randevular': { tr: 'Randevular', en: 'Appointments', ar: 'المواعيد' },
  'nav.musteriler': { tr: 'Müşteriler', en: 'Customers', ar: 'العملاء' },
  'nav.paketler':       { tr: 'Paketler',       en: 'Packages',     ar: 'الباقات'  },
  'nav.entegrasyonlar': { tr: 'Entegrasyonlar', en: 'Integrations', ar: 'التكاملات' },
  'nav.entegrasyonTalepleri': { tr: 'Entegrasyon Talepleri', en: 'Integration Requests', ar: 'طلبات التكامل' },
  'nav.personel': { tr: 'Personel', en: 'Staff', ar: 'الموظفون' },
  'nav.hizmetler': { tr: 'Hizmetler', en: 'Services', ar: 'الخدمات' },
  'nav.finans': { tr: 'Finans', en: 'Finance', ar: 'المالية' },
  'nav.raporlar': { tr: 'Raporlar', en: 'Reports', ar: 'التقارير' },
  'nav.pazarlamaAnaliz': { tr: 'Pazarlama Analiz', en: 'Marketing Analytics', ar: 'تحليلات التسويق' },
  'nav.reklam': { tr: 'Reklam Anlaşmaları', en: 'Ad Partnerships', ar: 'اتفاقيات الإعلان' },
  'nav.kampanyalar': { tr: 'Kampanyalar', en: 'Campaigns', ar: 'الحملات' },
  'nav.bekleyen': { tr: 'Bekleyen RV', en: 'Pending Appts', ar: 'بانتظار الموافقة' },
  'nav.ayarlar': { tr: 'Ayarlar', en: 'Settings', ar: 'الإعدادات' },
  'nav.programim': { tr: 'Programım', en: 'My Schedule', ar: 'برنامجي' },
  'nav.randevularim': { tr: 'Randevularım', en: 'My Appointments', ar: 'مواعيدي' },
  'nav.randevuAl': { tr: 'Randevu Al', en: 'Book Appointment', ar: 'حجز موعد' },
  'nav.isletmeler': { tr: 'İşletmeler', en: 'Businesses', ar: 'المنشآت' },
  'nav.bildirimler':      { tr: 'Bildirim Botu',    en: 'Notification Bot',   ar: 'روبوت الإشعارات'   },
  'nav.bildirimAyarlari': { tr: 'Bildirimler',      en: 'Notifications',      ar: 'الإشعارات'          },
  'nav.disaAktar':    { tr: 'Dışa Aktar',       en: 'Export',             ar: 'تصدير'             },
  'nav.paketlerim':   { tr: 'Paketim',          en: 'My Package',         ar: 'باقتي'              },
  'nav.kullanimRehberi': { tr: 'Kullanım Kılavuzu', en: 'Usage Guide',    ar: 'دليل الاستخدام'     },
  'nav.parapuan':     { tr: 'Parapuan',         en: 'Loyalty Points',     ar: 'نقاط الولاء'        },
  'nav.anket':        { tr: 'Memnuniyet',       en: 'Surveys',            ar: 'الاستطلاعات'        },
  'nav.beklemeListe': { tr: 'Bekleme Listesi',  en: 'Waitlist',           ar: 'قائمة الانتظار'    },
  'nav.adisyon':      { tr: 'Adisyon',          en: 'Receipts',           ar: 'الفواتير'          },
  'nav.personelPrim': { tr: 'Personel Prim',    en: 'Staff Commissions',  ar: 'عمولات الموظفين'   },
  'nav.urunStok':     { tr: 'Ürün & Stok',     en: 'Products & Stock',   ar: 'المنتجات والمخزون' },
  'nav.salonSkoru':   { tr: 'Salon Skoru',      en: 'Salon Score',        ar: 'نقاط الصالون'      },
  'grp.finans':       { tr: 'Finans & Raporlar',en: 'Finance & Reports',  ar: 'المالية والتقارير' },

  // ── Durumlar ──
  'durum.bekliyor': { tr: 'Bekliyor', en: 'Pending', ar: 'قيد الانتظار' },
  'durum.onayBekliyor': { tr: 'Onay Bekliyor', en: 'Pending Approval', ar: 'بانتظار الموافقة' },
  'durum.onaylandi': { tr: 'Onaylı', en: 'Confirmed', ar: 'مؤكد' },
  'durum.tamamlandi': { tr: 'Tamamlandı', en: 'Completed', ar: 'مكتمل' },
  'durum.iptal': { tr: 'İptal', en: 'Cancelled', ar: 'ملغى' },
  'durum.gelmedi': { tr: 'Gelmedi', en: 'No-show', ar: 'لم يحضر' },

  // ── Eylemler ──
  'eylem.onayla': { tr: 'Onayla', en: 'Approve', ar: 'موافقة' },
  'eylem.tamamla': { tr: 'Tamamla', en: 'Complete', ar: 'إكمال' },
  'eylem.reddet': { tr: 'Reddet', en: 'Reject', ar: 'رفض' },
  'eylem.bugun': { tr: 'Bugün', en: 'Today', ar: 'اليوم' },

  // ── Müşteri paneli ──
  'mp.merhaba': { tr: 'Merhaba', en: 'Hello', ar: 'مرحبًا' },
  'mp.altbaslik': { tr: 'Randevuların ve paketlerin', en: 'Your appointments and packages', ar: 'مواعيدك وباقاتك' },
  'mp.aktifPaketler': { tr: 'Aktif Paketlerim', en: 'My Active Packages', ar: 'باقاتي النشطة' },
  'mp.seansKaldi': { tr: 'seans kaldı', en: 'sessions left', ar: 'جلسات متبقية' },
  'mp.son': { tr: 'son', en: 'until', ar: 'حتى' },
  'mp.yaklasan': { tr: 'Yaklaşan Randevular', en: 'Upcoming Appointments', ar: 'المواعيد القادمة' },
  'mp.yaklasanYok': { tr: 'Yaklaşan randevun yok.', en: 'You have no upcoming appointments.', ar: 'ليس لديك مواعيد قادمة.' },
  'mp.randevuAlLink': { tr: 'Randevu al', en: 'Book now', ar: 'احجز الآن' },
  'mp.gecmis': { tr: 'Geçmiş Randevular', en: 'Past Appointments', ar: 'المواعيد السابقة' },
  'mp.yeniRandevu': { tr: 'Yeni Randevu Al', en: 'Book New Appointment', ar: 'حجز موعد جديد' },

  // ── Randevu Al ──
  'ra.altbaslik': { tr: 'Online randevu talebi oluştur', en: 'Create an online appointment request', ar: 'إنشاء طلب موعد عبر الإنترنت' },
  'ra.hizmet': { tr: 'Hizmet', en: 'Service', ar: 'الخدمة' },
  'ra.sec': { tr: 'Seçiniz', en: 'Select', ar: 'اختر' },
  'ra.personel': { tr: 'Personel', en: 'Staff', ar: 'الموظف' },
  'ra.opsiyonel': { tr: '(opsiyonel)', en: '(optional)', ar: '(اختياري)' },
  'ra.farketmez': { tr: 'Farketmez', en: 'No preference', ar: 'لا يهم' },
  'ra.tarih': { tr: 'Tarih', en: 'Date', ar: 'التاريخ' },
  'ra.saat': { tr: 'Saat', en: 'Time', ar: 'الوقت' },
  'ra.gonder': { tr: 'Randevu Talebi Gönder', en: 'Send Appointment Request', ar: 'إرسال طلب الموعد' },
  'ra.onayNotu': { tr: 'Talebiniz işletme onayından sonra kesinleşir.', en: 'Your request is finalized after the business approves it.', ar: 'يتم تأكيد طلبك بعد موافقة المنشأة.' },
  'ra.alindiBaslik': { tr: 'Talebiniz Alındı', en: 'Request Received', ar: 'تم استلام طلبك' },
  'ra.alindiMesaj': { tr: 'Randevu talebiniz işletmeye iletildi. Onaylandığında randevularınızda görünecek.', en: 'Your request has been sent to the business. It will appear in your appointments once approved.', ar: 'تم إرسال طلبك إلى المنشأة. سيظهر في مواعيدك بعد الموافقة.' },
  'ra.donus': { tr: 'Randevularıma Dön', en: 'Back to My Appointments', ar: 'العودة إلى مواعيدي' },
  'ra.hataHizmet': { tr: 'Lütfen bir hizmet seçin.', en: 'Please select a service.', ar: 'يرجى اختيار خدمة.' },
  'ra.hataTarih': { tr: 'Tarih ve saat seçin.', en: 'Select a date and time.', ar: 'اختر التاريخ والوقت.' },
  'ra.baslik': { tr: 'Randevu Al', en: 'Book Appointment', ar: 'حجز موعد' },

  // ── Personel paneli ──
  'pp.altbaslik': { tr: 'Günlük programın', en: 'Your daily schedule', ar: 'برنامجك اليومي' },
  'pp.randevuYok': { tr: 'Bu gün için randevun yok.', en: 'No appointments for this day.', ar: 'لا مواعيد لهذا اليوم.' },
  'pp.randevu': { tr: 'randevu', en: 'appointments', ar: 'مواعيد' },
  'pp.bitti': { tr: 'bitti', en: 'done', ar: 'تم' },
  'pp.iptalOnay': { tr: 'Randevu iptal edilsin mi?', en: 'Cancel this appointment?', ar: 'إلغاء هذا الموعد؟' },

  // ── Bekleyen ──
  'bk.baslik': { tr: 'Bekleyen Randevular', en: 'Pending Appointments', ar: 'المواعيد المعلقة' },
  'bk.onayBekliyor': { tr: 'onay bekliyor', en: 'awaiting approval', ar: 'بانتظار الموافقة' },
  'bk.yok': { tr: 'Onay bekleyen online randevu yok.', en: 'No online appointments awaiting approval.', ar: 'لا مواعيد عبر الإنترنت بانتظار الموافقة.' },
  'bk.reddetOnay': { tr: 'Randevu reddedilsin mi?', en: 'Reject this appointment?', ar: 'رفض هذا الموعد؟' },

  // ── Kısıtlı erişim ──
  'kisitli.baslik': { tr: 'Hesabınız Geçici Olarak Kısıtlandı', en: 'Your Account Is Temporarily Restricted', ar: 'تم تقييد حسابك مؤقتًا' },
  'kisitli.mesaj': { tr: 'için ödeme bekleniyor. Aboneliğiniz yenilenene kadar panel salt görüntü (kısıtlı) modundadır.', en: 'has a pending payment. The panel is in read-only (restricted) mode until your subscription is renewed.', ar: 'لديه دفعة معلقة. اللوحة في وضع القراءة فقط حتى تجديد اشتراكك.' },
  'kisitli.iletisim': { tr: 'Erişimi yeniden açmak için lütfen Seanzy yönetimi ile iletişime geçin.', en: 'Please contact Seanzy management to restore access.', ar: 'يرجى الاتصال بإدارة Seanzy لاستعادة الوصول.' },
}

/** Reaktif çeviri — dil değişince bileşen yeniden render olur. */
export function useT(): (key: string) => string {
  const dil = useDil((s) => s.dil)
  return (key: string) => ceviriBul(key, dil)
}

/** Statik (bileşen dışı) çeviri. */
export function t(key: string): string {
  return ceviriBul(key, useDil.getState().dil)
}

function ceviriBul(key: string, dil: Dil): string {
  const c = SOZLUK[key]
  if (!c) return key
  return c[dil] ?? c.en ?? c.tr
}
