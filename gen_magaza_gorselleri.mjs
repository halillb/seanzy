import sharp from 'sharp'
import { mkdirSync } from 'fs'

const OUT_DIR = 'C:\\Users\\halil\\OneDrive\\Masaüstü\\PROJELER\\EstetiX\\MAĞAZA KLASÖRLERİ\\MAĞAZA GÖRSELLERİ'
mkdirSync(OUT_DIR, { recursive: true })

const W = 1080, H = 1920
const GOLD = '#C9A96E', GOLD2 = '#EDD9A3'

const THEMES = {
  dark: {
    bgFrom: '#141416', bgTo: '#0C0C0D', ink: '#0C0C0D', ink2: '#1c1c20',
    card: '#1E1E22', border: '#2c2c30', text: '#F0F0F0', text2: '#8a8a8e',
    titleText: '#F5F1E8', subText: '#a8a8ac', statusText: '#F5F1E8',
    badgeBg: 'rgba(0,0,0,.6)', badgeBorder: 'rgba(201,169,110,.35)', badgeText: '#F5F1E8', badgeIcon: '🌙', badgeLabel: 'Karanlık Mod',
  },
  light: {
    bgFrom: '#F6F2EB', bgTo: '#EFE7D8', ink: '#FFFFFF', ink2: '#F6F1E7',
    card: '#FFFFFF', border: 'rgba(60,48,28,.14)', text: '#2A2620', text2: '#8a8072',
    titleText: '#2A2620', subText: '#6B6253', statusText: '#2A2620',
    badgeBg: 'rgba(255,255,255,.85)', badgeBorder: 'rgba(154,122,69,.35)', badgeText: '#6a4f22', badgeIcon: '☀️', badgeLabel: 'Aydınlık Mod',
  },
}

function shell(baslik, altBaslik, sahneSvg, T) {
  const frameX = 90, frameY = 430, frameW = W - 180, frameH = 1360, radius = 56
  return `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${T.bgFrom}"/><stop offset="100%" stop-color="${T.bgTo}"/>
    </linearGradient>
    <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9A7A45"/><stop offset="55%" stop-color="${GOLD}"/><stop offset="100%" stop-color="${GOLD2}"/>
    </linearGradient>
    <clipPath id="frameClip"><rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="${radius}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <circle cx="${W / 2}" cy="200" r="380" fill="rgba(201,169,110,0.07)"/>

  <!-- Mod rozeti -->
  <rect x="${W - 230}" y="40" width="180" height="44" rx="22" fill="${T.badgeBg}" stroke="${T.badgeBorder}" stroke-width="1.5"/>
  <text x="${W - 140}" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${T.badgeText}">${T.badgeIcon} ${T.badgeLabel}</text>

  <!-- Başlık -->
  <text x="${W / 2}" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="50" font-weight="700" fill="${T.titleText}">${baslik}</text>
  <text x="${W / 2}" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="${T.subText}">${altBaslik}</text>

  <!-- Telefon çerçevesi -->
  <rect x="${frameX - 14}" y="${frameY - 14}" width="${frameW + 28}" height="${frameH + 28}" rx="${radius + 12}" fill="#000" stroke="${T.border}" stroke-width="2"/>
  <g clip-path="url(#frameClip)">
    ${sahneSvg}
  </g>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="${radius}" fill="none" stroke="rgba(201,169,110,0.3)" stroke-width="2"/>

  <!-- Alt marka -->
  <text x="${W / 2}" y="${H - 60}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="url(#gg)">Seanzy</text>
</svg>`
}

function statusBar(fx, fy, fw, T) {
  return `
  <rect x="${fx}" y="${fy}" width="${fw}" height="70" fill="${T.ink}"/>
  <text x="${fx + 24}" y="${fy + 46}" font-family="Arial" font-size="24" fill="${T.statusText}" font-weight="700">9:41</text>
  <text x="${fx + fw - 24}" y="${fy + 46}" text-anchor="end" font-family="Arial" font-size="22" fill="${T.statusText}">●●●●  📶  🔋</text>`
}

function appHeader(fx, fy, fw, title, sub, T) {
  return `
  <rect x="${fx}" y="${fy + 70}" width="${fw}" height="86" fill="${T.ink}"/>
  <text x="${fx + 30}" y="${fy + 116}" font-family="Arial" font-size="30" font-weight="700" fill="${T.text}">${title}</text>
  <text x="${fx + 30}" y="${fy + 142}" font-family="Arial" font-size="16" fill="${T.text2}">${sub}</text>`
}

function card(x, y, w, h, T, r = 18) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${T.card}" stroke="${T.border}" stroke-width="1.5"/>`
}

// ── Sahne 1: Takvim (daha dolu) ──
function sahneTakvim(fx, fy, fw, fh, T) {
  const bodyY = fy + 170
  const cols = 3, colW = (fw - 40) / cols, names = ['Ayşe', 'Elif', 'Zeynep']
  let colsSvg = ''
  for (let i = 0; i < cols; i++) {
    const cx = fx + 20 + i * colW
    colsSvg += `<rect x="${cx}" y="${bodyY}" width="${colW - 8}" height="40" rx="8" fill="${T.ink2}"/>
      <text x="${cx + colW / 2 - 4}" y="${bodyY + 27}" text-anchor="middle" font-family="Arial" font-size="16" fill="${T.text}">${names[i]}</text>`
  }
  const apptColors = ['#F7DCC4', '#CFEBD7', '#CFE3F4']
  let apptSvg = ''
  const apptData = [
    [0, 30, 100, 'Manikür', '09:30'], [0, 150, 90, 'Boya', '11:00'], [0, 260, 110, 'Fön', '12:45'], [0, 400, 90, 'Kaş', '14:30'],
    [1, 10, 150, 'Lazer', '09:00'], [1, 180, 90, 'Cilt Bak.', '11:30'], [1, 300, 100, 'Masaj', '13:15'], [1, 430, 80, 'Ağda', '15:00'],
    [2, 60, 130, 'Cilt Bakımı', '10:00'], [2, 210, 90, 'Manikür', '12:00'], [2, 320, 110, 'Saç Kesim', '13:45'],
  ]
  apptData.forEach(([col, top, h, ad, saat]) => {
    const cx = fx + 20 + col * colW
    apptSvg += `<rect x="${cx + 4}" y="${bodyY + 56 + top}" width="${colW - 16}" height="${h}" rx="10" fill="${apptColors[col]}"/>
      <text x="${cx + 16}" y="${bodyY + 56 + top + 26}" font-family="Arial" font-size="14" font-weight="700" fill="#2a2a2a">${ad}</text>
      <text x="${cx + 16}" y="${bodyY + 56 + top + 47}" font-family="Arial" font-size="12" fill="#5a5a5a">${saat}</text>`
  })
  let lines = ''
  for (let i = 0; i < 8; i++) lines += `<line x1="${fx}" y1="${bodyY + 56 + i * 68}" x2="${fx + fw}" y2="${bodyY + 56 + i * 68}" stroke="${T.border}" stroke-width="1"/>`
  return statusBar(fx, fy, fw, T) + appHeader(fx, fy, fw, 'Takvim', 'Bugün · 11 Temmuz 2026', T)
    + `<rect x="${fx}" y="${fy + 156}" width="${fw}" height="${fh - 156}" fill="${T.ink}"/>` + lines + colsSvg + apptSvg
}

// ── Sahne 2: Randevu Al (Müşteri) ──
function sahneRandevuAl(fx, fy, fw, fh, T) {
  const hizmetler = ['Manikür &amp; Pedikür', 'Saç Boyama', 'Cilt Bakımı', 'Lazer Epilasyon']
  let hizmetSvg = ''
  hizmetler.forEach((h, i) => {
    const y = fy + 230 + i * 96
    hizmetSvg += card(fx + 24, y, fw - 48, 78, T) +
      `<circle cx="${fx + 60}" cy="${y + 39}" r="20" fill="rgba(201,169,110,.18)"/>
      <text x="${fx + 60}" y="${y + 46}" text-anchor="middle" font-family="Arial" font-size="18" fill="${GOLD}">✂</text>
      <text x="${fx + 96}" y="${y + 34}" font-family="Arial" font-size="18" font-weight="700" fill="${T.text}">${h}</text>
      <text x="${fx + 96}" y="${y + 58}" font-family="Arial" font-size="14" fill="${T.text2}">45 dk · 350 ₺</text>
      <circle cx="${fx + fw - 60}" cy="${y + 39}" r="16" fill="none" stroke="${GOLD}" stroke-width="2"/>`
  })
  return statusBar(fx, fy, fw, T) + appHeader(fx, fy, fw, 'Randevu Al', 'Hizmet seçin', T)
    + `<rect x="${fx}" y="${fy + 156}" width="${fw}" height="${fh - 156}" fill="${T.ink}"/>`
    + card(fx + 24, fy + 176, fw - 48, 44, T)
    + `<text x="${fx + 44}" y="${fy + 204}" font-family="Arial" font-size="15" fill="${T.text2}">🔍  Hizmet ara…</text>`
    + hizmetSvg
    + `<rect x="${fx + 24}" y="${fy + fh - 110}" width="${fw - 48}" height="66" rx="16" fill="url(#gg)"/>
       <text x="${fx + fw / 2}" y="${fy + fh - 70}" text-anchor="middle" font-family="Arial" font-size="19" font-weight="700" fill="#0C0C0D">Devam Et</text>`
}

// ── Sahne 3: Müşteri Paneli / Parapuan ──
function sahneMusteriPaneli(fx, fy, fw, fh, T) {
  return statusBar(fx, fy, fw, T) + appHeader(fx, fy, fw, 'Merhaba, Ayşe', 'İyi günler dileriz ✨', T)
    + `<rect x="${fx}" y="${fy + 156}" width="${fw}" height="${fh - 156}" fill="${T.ink}"/>`
    + card(fx + 24, fy + 190, fw - 48, 150, T, 20)
    + `<text x="${fx + 48}" y="${fy + 232}" font-family="Arial" font-size="16" fill="${T.text2}">Parapuan Bakiyeniz</text>
       <text x="${fx + 48}" y="${fy + 290}" font-family="Arial" font-size="46" font-weight="700" fill="url(#gg)">1.240</text>
       <text x="${fx + fw - 48}" y="${fy + 290}" text-anchor="end" font-family="Arial" font-size="15" fill="${T.text2}">bu ay +180</text>`
    + card(fx + 24, fy + 366, (fw - 64) / 2, 110, T)
    + card(fx + 24 + (fw - 64) / 2 + 16, fy + 366, (fw - 64) / 2, 110, T)
    + `<text x="${fx + 48}" y="${fy + 402}" font-family="Arial" font-size="30" font-weight="700" fill="${T.text}">3</text>
       <text x="${fx + 48}" y="${fy + 428}" font-family="Arial" font-size="13" fill="${T.text2}">Aktif Paket</text>
       <text x="${fx + 48 + (fw - 64) / 2 + 16}" y="${fy + 402}" font-family="Arial" font-size="30" font-weight="700" fill="${T.text}">12</text>
       <text x="${fx + 48 + (fw - 64) / 2 + 16}" y="${fy + 428}" font-family="Arial" font-size="13" fill="${T.text2}">Tamamlanan Randevu</text>`
    + `<text x="${fx + 24}" y="${fy + 520}" font-family="Arial" font-size="18" font-weight="700" fill="${T.text}">Yaklaşan Randevunuz</text>`
    + card(fx + 24, fy + 540, fw - 48, 110, T)
    + `<rect x="${fx + 44}" y="${fy + 562}" width="8" height="66" rx="4" fill="url(#gg)"/>
       <text x="${fx + 68}" y="${fy + 588}" font-family="Arial" font-size="18" font-weight="700" fill="${T.text}">Cilt Bakımı</text>
       <text x="${fx + 68}" y="${fy + 614}" font-family="Arial" font-size="14" fill="${T.text2}">Yarın · 14:00 — Elif Hanım</text>`
}

// ── Sahne 4: Süper Admin / Genel Bakış ──
function sahneSuperAdmin(fx, fy, fw, fh, T) {
  const stats = [['24', 'Aktif İşletme'], ['%92', 'Doluluk'], ['₺48K', 'Aylık Ciro']]
  let statSvg = ''
  const sw = (fw - 24 * 2 - 16 * 2) / 3
  stats.forEach(([v, l], i) => {
    const x = fx + 24 + i * (sw + 16)
    statSvg += card(x, fy + 190, sw, 110, T) +
      `<text x="${x + sw / 2}" y="${fy + 240}" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="${GOLD}">${v}</text>
       <text x="${x + sw / 2}" y="${fy + 268}" text-anchor="middle" font-family="Arial" font-size="12" fill="${T.text2}">${l}</text>`
  })
  const isletmeler = ['Prestige Kuaför', 'Glow Güzellik Merkezi', 'Luxe Spa &amp; Wellness']
  let listSvg = ''
  isletmeler.forEach((ad, i) => {
    const y = fy + 340 + i * 96
    listSvg += card(fx + 24, y, fw - 48, 78, T) +
      `<rect x="${fx + 44}" y="${y + 19}" width="40" height="40" rx="10" fill="rgba(201,169,110,.18)"/>
       <text x="${fx + 64}" y="${y + 45}" text-anchor="middle" font-family="Arial" font-size="17" fill="${GOLD}">${ad[0]}</text>
       <text x="${fx + 100}" y="${y + 34}" font-family="Arial" font-size="17" font-weight="700" fill="${T.text}">${ad}</text>
       <text x="${fx + 100}" y="${y + 58}" font-family="Arial" font-size="13" fill="#3ecf7a">● Aktif</text>`
  })
  return statusBar(fx, fy, fw, T) + appHeader(fx, fy, fw, 'Genel Bakış', 'Platform özeti', T)
    + `<rect x="${fx}" y="${fy + 156}" width="${fw}" height="${fh - 156}" fill="${T.ink}"/>` + statSvg + listSvg
}

// ── Sahne 5: Personel Paneli / Programım ──
function sahnePersonel(fx, fy, fw, fh, T) {
  const randevular = [['09:00', 'Zeynep K.', 'Manikür'], ['10:30', 'Ayşe T.', 'Lazer Kol'], ['12:00', 'Elif S.', 'Saç Boyama'], ['14:00', 'Merve D.', 'Cilt Bakımı']]
  let listSvg = ''
  randevular.forEach(([saat, ad, hizmet], i) => {
    const y = fy + 260 + i * 108
    listSvg += card(fx + 24, y, fw - 48, 90, T) +
      `<rect x="${fx + 24}" y="${y}" width="6" height="90" rx="3" fill="url(#gg)"/>
       <text x="${fx + 48}" y="${y + 34}" font-family="Arial" font-size="20" font-weight="700" fill="${GOLD}">${saat}</text>
       <text x="${fx + 150}" y="${y + 34}" font-family="Arial" font-size="18" font-weight="700" fill="${T.text}">${ad}</text>
       <text x="${fx + 150}" y="${y + 60}" font-family="Arial" font-size="14" fill="${T.text2}">${hizmet}</text>`
  })
  return statusBar(fx, fy, fw, T) + appHeader(fx, fy, fw, 'Programım', 'Bugünkü randevularınız', T)
    + `<rect x="${fx}" y="${fy + 156}" width="${fw}" height="${fh - 156}" fill="${T.ink}"/>`
    + card(fx + 24, fy + 176, (fw - 64) / 2, 66, T)
    + card(fx + 24 + (fw - 64) / 2 + 16, fy + 176, (fw - 64) / 2, 66, T)
    + `<text x="${fx + 44}" y="${fy + 212}" font-family="Arial" font-size="22" font-weight="700" fill="${T.text}">4</text>
       <text x="${fx + 90}" y="${fy + 212}" font-family="Arial" font-size="13" fill="${T.text2}">Bugün Randevu</text>
       <text x="${fx + 44 + (fw - 64) / 2 + 16}" y="${fy + 212}" font-family="Arial" font-size="22" font-weight="700" fill="${GOLD}">₺2.140</text>
       <text x="${fx + 44 + (fw - 64) / 2 + 16 + 90}" y="${fy + 212}" font-family="Arial" font-size="13" fill="${T.text2}">Hakediş</text>`
    + listSvg
}

// ── Sahne 6: Bildirimler ──
function sahneBildirimler(fx, fy, fw, fh, T) {
  const bildirimler = [
    ['Yeni Randevu Talebi', 'Ayşe Yılmaz — Cilt Bakımı, yarın 14:00', true],
    ['Randevu Onaylandı', 'Elif Kaya randevunuzu onayladı', false],
    ['Ödeme Alındı', '₺350 tahsilat kaydedildi', false],
    ['Sadakat Puanı', 'Merve D. 50 puan kazandı', false],
  ]
  let listSvg = ''
  bildirimler.forEach(([baslik, mesaj, yeni], i) => {
    const y = fy + 190 + i * 130
    listSvg += card(fx + 24, y, fw - 48, 112, T) +
      `<circle cx="${fx + 60}" cy="${y + 40}" r="20" fill="rgba(201,169,110,.16)"/>
       <text x="${fx + 60}" y="${y + 47}" text-anchor="middle" font-family="Arial" font-size="18" fill="${GOLD}">🔔</text>
       <text x="${fx + 96}" y="${y + 36}" font-family="Arial" font-size="17" font-weight="700" fill="${T.text}">${baslik}</text>
       <text x="${fx + 96}" y="${y + 62}" font-family="Arial" font-size="13.5" fill="${T.text2}">${mesaj}</text>
       ${yeni ? `<circle cx="${fx + fw - 48}" cy="${y + 30}" r="6" fill="${GOLD}"/>` : ''}`
  })
  return statusBar(fx, fy, fw, T) + appHeader(fx, fy, fw, 'Bildirimler', '4 bildirim', T)
    + `<rect x="${fx}" y="${fy + 156}" width="${fw}" height="${fh - 156}" fill="${T.ink}"/>` + listSvg
}

const SAHNELER = [
  { dosya: 'seanzy-01-takvim', baslik: 'Akıllı Takvim', alt: 'Tüm personelinizi tek ekrandan yönetin', sahne: sahneTakvim },
  { dosya: 'seanzy-02-randevu-al', baslik: 'Saniyeler İçinde Randevu', alt: 'Müşterileriniz 7/24 kendi randevusunu alsın', sahne: sahneRandevuAl },
  { dosya: 'seanzy-03-musteri-paneli', baslik: 'VIP Müşteri Deneyimi', alt: 'Puan, paket ve randevu tek yerde', sahne: sahneMusteriPaneli },
  { dosya: 'seanzy-04-superadmin', baslik: 'Çoklu Şube Yönetimi', alt: 'Tüm işletmelerinizi merkezi kontrol edin', sahne: sahneSuperAdmin },
  { dosya: 'seanzy-05-personel', baslik: 'Personel Programı', alt: 'Randevu ve hakedişinizi cebinizden takip edin', sahne: sahnePersonel },
  { dosya: 'seanzy-06-bildirimler', baslik: 'Anlık Bildirimler', alt: 'Hiçbir randevuyu, ödemeyi kaçırmayın', sahne: sahneBildirimler },
]

async function main() {
  const fx = 90 + 20, fy = 430 + 0, fw = W - 180 - 40, fh = 1360
  for (const s of SAHNELER) {
    for (const [modAd, T] of Object.entries(THEMES)) {
      const svg = shell(s.baslik, s.alt, s.sahne(fx, fy, fw, fh, T), T)
      const dosyaAdi = `${s.dosya}-${modAd}.png`
      await sharp(Buffer.from(svg)).png().toFile(`${OUT_DIR}\\${dosyaAdi}`)
      console.log('✓', dosyaAdi)
    }
  }
}
main()
