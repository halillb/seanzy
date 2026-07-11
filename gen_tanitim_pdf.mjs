import PDFDocument from 'pdfkit'
import { createWriteStream, mkdirSync } from 'fs'

const OUT_DIR = 'C:\\Users\\halil\\OneDrive\\Masaüstü\\PROJELER\\EstetiX\\MAĞAZA KLASÖRLERİ\\UYGULAMA TANITIM İÇERİKLERİ'
mkdirSync(OUT_DIR, { recursive: true })

const GOLD = '#C9A96E'
const GOLD_DARK = '#9A7A45'
const INK = '#0C0C0D'
const INK2 = '#202024'
const MUTED = '#6b6b6f'
const REG = 'C:\\Windows\\Fonts\\arial.ttf'
const BOLD = 'C:\\Windows\\Fonts\\arialbd.ttf'

function coverPage(doc, kicker, title, subtitle) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(INK)
  doc.rect(0, 0, doc.page.width, doc.page.height).fillOpacity(1)
  // gold accent bar
  doc.rect(0, 0, 10, doc.page.height).fill(GOLD)
  doc.fillColor(GOLD).font(BOLD).fontSize(13).text(kicker.toUpperCase(), 70, 220, { characterSpacing: 2 })
  doc.fillColor('#F5F1E8').font(BOLD).fontSize(40).text(title, 70, 250, { width: 460 })
  doc.fillColor('#c9c9cc').font(REG).fontSize(15).text(subtitle, 70, 340, { width: 440 })
  doc.fillColor(GOLD).font(BOLD).fontSize(22).text('Seanzy', 70, doc.page.height - 90)
  doc.fillColor('#8a8a8e').font(REG).fontSize(10).text('Güzellik Merkezi Yönetim Sistemi', 70, doc.page.height - 62)
}

function sectionHeader(doc, no, title) {
  doc.moveDown(0.5)
  const y = doc.y
  doc.circle(45, y + 10, 14).fill(GOLD)
  doc.fillColor(INK).font(BOLD).fontSize(12).text(String(no), 45 - 5, y + 4)
  doc.fillColor(INK).font(BOLD).fontSize(17).text(title, 72, y, { width: 460 })
  doc.moveDown(1.2)
}

function bullet(doc, baslik, aciklama) {
  const y = doc.y
  doc.circle(58, y + 6, 3).fill(GOLD_DARK)
  doc.fillColor(INK).font(BOLD).fontSize(11.5).text(baslik, 72, y, { width: 440, continued: false })
  doc.fillColor(MUTED).font(REG).fontSize(10.5).text(aciklama, 72, doc.y + 1, { width: 440 })
  doc.moveDown(0.7)
}

function statRow(doc, stats) {
  const startX = 72, boxW = 130, gap = 12
  const y = doc.y
  stats.forEach((s, i) => {
    const x = startX + i * (boxW + gap)
    doc.roundedRect(x, y, boxW, 64, 8).fillAndStroke('#F7F4EC', '#E4D9BE')
    doc.fillColor(GOLD_DARK).font(BOLD).fontSize(20).text(s.deger, x + 10, y + 10, { width: boxW - 20 })
    doc.fillColor(INK2).font(REG).fontSize(9).text(s.etiket, x + 10, y + 36, { width: boxW - 20 })
  })
  doc.moveDown(6.2)
}

function footer(doc, sayfaAdi) {
  const y = doc.page.height - 40
  doc.fontSize(8).fillColor('#a8a8ac').font(REG)
    .text('Seanzy — ' + sayfaAdi, 72, y, { width: 300 })
  doc.text('seanzy.app', doc.page.width - 172, y, { width: 100, align: 'right' })
}

function baslikSayfasi(doc, baslik, ustBaslik) {
  doc.addPage()
  doc.rect(0, 0, doc.page.width, 90).fill(INK)
  doc.rect(0, 0, 8, 90).fill(GOLD)
  doc.fillColor(GOLD).font(BOLD).fontSize(11).text(ustBaslik.toUpperCase(), 72, 28, { characterSpacing: 1.5 })
  doc.fillColor('#fff').font(BOLD).fontSize(24).text(baslik, 72, 46)
  doc.y = 130
}

// ── 1) GENEL TANITIM PDF ─────────────────────────────────────────────────
function genelPdf() {
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true })
  doc.pipe(createWriteStream(`${OUT_DIR}\\Seanzy-Genel-Tanitim.pdf`))
  doc.registerFont('R', REG); doc.registerFont('B', BOLD)
  doc.font('R')

  coverPage(doc, 'Salon & Klinik Yönetimi', 'Seanzy', 'Randevudan tahsilata, tek panelden yönetin. Güzellik merkezleri için modern, hızlı ve VIP hissettiren bir yönetim sistemi.')

  baslikSayfasi(doc, 'Seanzy Nedir?', 'Genel Bakış')
  doc.font('R').fontSize(11.5).fillColor(INK2).text(
    'Seanzy; kuaför, güzellik merkezi, klinik ve spa işletmeleri için geliştirilmiş uçtan uca bir yönetim platformudur. ' +
    'Randevu takviminden müşteri ilişkilerine, personel prim hesaplamalarından stok takibine kadar işletmenizin tüm günlük ' +
    'işleyişini tek bir yerden, sade ve hızlı bir arayüzle yönetmenizi sağlar.', 72, doc.y, { width: 450, lineGap: 3 })
  doc.moveDown(1.5)

  statRow(doc, [
    { deger: '4', etiket: 'Rol Bazlı Panel' },
    { deger: '%100', etiket: 'Mobil Uyumlu' },
    { deger: 'Çoklu', etiket: 'Kanal Bildirim' },
  ])

  sectionHeader(doc, 1, 'Kimler İçin?')
  bullet(doc, 'İşletme Sahipleri / Müdürler', 'Randevu, ciro, personel performansı ve müşteri ilişkilerini tek ekrandan yönetir.')
  bullet(doc, 'Personel', 'Kendi programını görür, randevularını yönetir, hakedişlerini takip eder.')
  bullet(doc, 'Müşteriler', 'Kendi randevusunu oluşturur, geçmişini ve puan/paket durumunu görür.')
  bullet(doc, 'Zincir İşletmeler', 'Süper admin paneliyle birden çok şubeyi merkezi olarak yönetir.')

  sectionHeader(doc, 2, 'Öne Çıkan Özellikler')
  bullet(doc, 'Akıllı Takvim', 'Sürükle-bırak randevu yönetimi, personel bazlı renklendirme, çakışma kontrolü.')
  bullet(doc, 'Modüler Hizmet & Paket Sistemi', 'Seanslı hizmetler, kombine paketler, esnek ödeme planları.')
  bullet(doc, 'Çok Kanallı Bildirimler', 'E-posta, SMS, WhatsApp ve anlık push bildirimleriyle müşteri iletişimi.')
  bullet(doc, 'Parapuan Sadakat Sistemi', 'Müşteri sadakatini artıran puan tabanlı ödül mekanizması.')
  bullet(doc, 'Finans & Stok Takibi', 'Gelir-gider, ürün stok seviyeleri ve personel prim hesaplamaları.')

  footer(doc, 'Genel Tanıtım')
  doc.flushPages()
  doc.end()
}

// ── 2) PANEL BAZLI PDF'LER ────────────────────────────────────────────────
const PANELLER = [
  {
    dosya: 'Seanzy-Mudur-Paneli-Tanitim.pdf',
    ustBaslik: 'İşletme Sahibi / Müdür',
    baslik: 'Müdür Paneli',
    aciklama: 'İşletmenizin nabzını tek ekrandan tutun — randevudan ciroya, personelden stoğa kadar her şey kontrolünüzde.',
    stats: [
      { deger: '360°', etiket: 'İşletme Görünürlüğü' },
      { deger: 'Anlık', etiket: 'Ciro Takibi' },
      { deger: 'Tümü', etiket: 'Tek Panelde' },
    ],
    ozellikler: [
      ['Genel Bakış Paneli', 'Günlük randevu, ciro ve doluluk oranını tek bakışta görün.'],
      ['Akıllı Takvim', 'Tüm personelin programını aynı ekranda görün, sürükle-bırakla randevu düzenleyin.'],
      ['Müşteri Yönetimi', 'Müşteri geçmişi, harcama, paket ve puan durumunu tek profilde inceleyin.'],
      ['Personel & Prim', 'Personel performansını izleyin, hakediş/prim hesaplamalarını otomatikleştirin.'],
      ['Hizmet & Paket Kurulumu', 'Seanslı hizmetler ve indirimli kombine paketler oluşturun.'],
      ['Finans & Raporlar', 'Gelir-gider takibi, satış raporları ve stok seviyelerini yönetin.'],
      ['Bildirim Kanalları', 'E-posta/SMS/WhatsApp kurulumunu talep edin, müşteri iletişimini otomatikleştirin.'],
    ],
  },
  {
    dosya: 'Seanzy-Personel-Paneli-Tanitim.pdf',
    ustBaslik: 'Çalışanlar İçin',
    baslik: 'Personel Paneli',
    aciklama: 'Kendi programınızı, randevularınızı ve hakedişlerinizi cebinizden takip edin.',
    stats: [
      { deger: 'Anlık', etiket: 'Program Görünümü' },
      { deger: 'Kolay', etiket: 'Randevu Yönetimi' },
      { deger: 'Şeffaf', etiket: 'Prim Takibi' },
    ],
    ozellikler: [
      ['Programım', 'Günlük/haftalık randevu programınızı net bir takvimde görün.'],
      ['Randevu Detayları', 'Müşteri bilgisi, uygulanacak hizmet ve notları tek dokunuşla görüntüleyin.'],
      ['Müşteri Geçmişi', 'Daha önce hizmet verdiğiniz müşterilerin tercihlerini hatırlayın.'],
      ['Hakediş Takibi', 'Prim ve hakedişlerinizi şeffaf bir şekilde anlık izleyin.'],
      ['Ürün / Stok Erişimi', 'Hizmet sırasında kullanılan ürünleri kolayca kaydedin.'],
      ['Mobil Öncelikli Tasarım', 'Telefonunuzdan hızlı ve rahat kullanım.'],
    ],
  },
  {
    dosya: 'Seanzy-Musteri-Paneli-Tanitim.pdf',
    ustBaslik: 'Müşteriler İçin',
    baslik: 'Müşteri Paneli',
    aciklama: 'Randevunuzu saniyeler içinde alın, geçmişinizi ve avantajlarınızı tek yerden takip edin.',
    stats: [
      { deger: '7/24', etiket: 'Online Randevu' },
      { deger: 'Anlık', etiket: 'Hatırlatmalar' },
      { deger: 'Ödüllü', etiket: 'Sadakat Puanı' },
    ],
    ozellikler: [
      ['Online Randevu Alma', 'İstediğiniz hizmeti, personeli ve saati seçerek saniyeler içinde randevu oluşturun.'],
      ['Randevularım', 'Geçmiş ve gelecek randevularınızı tek ekranda görün, iptal/değişiklik talep edin.'],
      ['Parapuan Sadakat Programı', 'Her ziyarette puan kazanın, ödüllerinizi takip edin.'],
      ['Paket Takibi', 'Satın aldığınız seanslı paketlerin kalan hakkını görün.'],
      ['Bildirimler', 'Randevu onayı, hatırlatma ve kampanyalardan anında haberdar olun.'],
      ['Instagram & Konum Erişimi', 'İşletmenin sosyal medyasına ve konumuna tek dokunuşla ulaşın.'],
    ],
  },
  {
    dosya: 'Seanzy-SuperAdmin-Paneli-Tanitim.pdf',
    ustBaslik: 'Platform Yönetimi',
    baslik: 'Süper Admin Paneli',
    aciklama: 'Birden fazla işletmeyi/şubeyi tek merkezden yönetin, paketlerini ve entegrasyonlarını kontrol edin.',
    stats: [
      { deger: 'Çoklu', etiket: 'İşletme Yönetimi' },
      { deger: 'Esnek', etiket: 'Paket Sistemi' },
      { deger: 'Merkezi', etiket: 'Entegrasyon Yönetimi' },
    ],
    ozellikler: [
      ['İşletmeler', 'Sisteme kayıtlı tüm işletmeleri görüntüleyin, durumlarını yönetin.'],
      ['Paket Yönetimi', 'Basic/Pro/Enterprise gibi abonelik paketlerini oluşturun ve düzenleyin.'],
      ['Entegrasyonlar', 'E-posta, SMS, WhatsApp ve push bildirim altyapısını merkezi olarak yapılandırın.'],
      ['Entegrasyon Talepleri', 'İşletmelerden gelen SMS/WhatsApp kurulum taleplerini adım adım takip edin ve sonuçlandırın.'],
      ['Genel Bakış', 'Platform genelinde işletme sayısı, aktif abonelikler ve büyüme metriklerini izleyin.'],
      ['Bildirimler', 'Sistem genelindeki önemli olaylardan anında haberdar olun.'],
    ],
  },
]

function panelPdf(p) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true })
  doc.pipe(createWriteStream(`${OUT_DIR}\\${p.dosya}`))
  doc.registerFont('R', REG); doc.registerFont('B', BOLD)
  doc.font('R')

  coverPage(doc, p.ustBaslik, p.baslik, p.aciklama)

  baslikSayfasi(doc, 'Öne Çıkan Yetenekler', p.ustBaslik)
  statRow(doc, p.stats)
  sectionHeader(doc, 1, 'Bu Panelde Neler Var?')
  p.ozellikler.forEach(([b, a]) => bullet(doc, b, a))

  footer(doc, p.baslik)
  doc.flushPages()
  doc.end()
}

genelPdf()
PANELLER.forEach(panelPdf)
console.log('Tüm PDF\'ler oluşturuldu.')
