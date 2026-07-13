import { Lock, ArrowRight, Sparkles, ArrowLeft, CheckCircle2, TrendingUp, Users, BarChart3, Layers, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { OZELLIKLER, PAKET_AD, PAKET_RENK, type PaketTuru } from '../lib/ozellikler'
import { useAuth } from '../store/auth'

interface Props {
  ozellik: keyof typeof OZELLIKLER
}

/* Her özellik için zengin satış metni */
const OZELLIK_DETAY: Partial<Record<string, { slogan: string; fayda: string[]; istat?: { sayi: string; aciklama: string }[] }>> = {
  finans: {
    slogan: 'Paranızın nereye gittiğini ve nereden geldiğini saniye saniye bilin.',
    fayda: [
      'Gelir ve giderlerinizi tek ekranda takip edin — aylık, haftalık, günlük',
      'Randevulardan otomatik gelir kayıtları oluşturulur, elle girmek zorunda kalmazsınız',
      'Hangi hizmet veya hangi personel size en çok para kazandırıyor, görün',
      'Banka hesabı değil, gerçek kâr marjınızı öğrenin',
    ],
    istat: [
      { sayi: '3×', aciklama: 'daha hızlı muhasebe kapanışı' },
      { sayi: '%23', aciklama: 'gider tasarrufu farkındalığı' },
    ],
  },
  adisyon: {
    slogan: 'Her hizmetin makbuzunu dijital olarak kesin, tahsilatı anında takip edin.',
    fayda: [
      'Kalemli adisyon oluşturun — birden fazla hizmet ve ürünü tek makbuza ekleyin',
      'Nakit, kredi kartı, Multinet, Sodexo, Edenred ayrı ayrı takip edilir',
      'Kısmi ödeme ve kalan borç yönetimi ile müşteri memnuniyeti artar',
      'Tarih bazlı adisyon geçmişi ile anlaşmazlıkları dakikalar içinde çözün',
    ],
    istat: [
      { sayi: '%0', aciklama: 'tahsilat kaybı riski' },
      { sayi: '4dk', aciklama: 'ortalama adisyon oluşturma süresi' },
    ],
  },
  raporlar: {
    slogan: 'İşletmenizin nabzını gerçek veriyle ölçün, kararlarınızı sezgiyle değil veriyle alın.',
    fayda: [
      'Günlük, haftalık, aylık ve yıllık ciro raporları tek tıkla karşınızda',
      'Hangi personel, hangi hizmet, hangi gün en çok gelir getiriyor — görün',
      'İptal oranı ve doluluk analizi ile takvim boşluklarını kapatın',
      'Rakiplerinizin sadece hissettiklerini siz rakam rakam bilin',
    ],
    istat: [
      { sayi: '+%34', aciklama: 'karar hızı artışı' },
      { sayi: '6 ay', aciklama: 'geriye dönük trend analizi' },
    ],
  },
  personel_prim: {
    slogan: 'Hakedişi doğru hesaplayın, doğru personeli tutun, motivasyonu yüksek tutun.',
    fayda: [
      'Her personel için ayrı hizmet, ürün ve paket prim oranı tanımlayın',
      'Aylık prim özetini tek tıkla görün — hesap makinesi kullanmayı bırakın',
      'Prim sistemi doğru kurulunca personel devir hızı düşer, kaliteli ekip kalır',
      'Şeffaf prim sistemi ile personel arasındaki güven ve rekabet artar',
    ],
  },
  kampanyalar: {
    slogan: 'Doğru müşteriye doğru indirim — herkese aynı indirimi yapan kazanamaz.',
    fayda: [
      'Her müşteriye özel indirim yüzdesi belirleyin',
      'Sadık müşteriyi ödüllendirin, yeni müşteriyi çekin',
      'Kampanyaları istediğiniz zaman açıp kapatın, süre sınırı yok',
      'İndirimli satışların ciro etkisini gerçek zamanlı izleyin',
    ],
  },
  pazarlama: {
    slogan: 'Instagram reklamına harcadığınız para gerçekten müşteri getiriyor mu? Artık bilin.',
    fayda: [
      'Her müşterinin kaynağını kaydedin: Instagram, referans, tabela, walk-in…',
      'Hangi kanal en çok müşteri, hangi kanal en çok ciro getiriyor karşılaştırın',
      'Reklam bütçenizi veriyi görerek yönetin, tahminle değil',
      'Bu özellik Seanzy\'ye özgü — hiçbir rakip uygulamada yok',
    ],
    istat: [
      { sayi: '%41', aciklama: 'reklam bütçesi optimizasyonu' },
    ],
  },
  reklam: {
    slogan: 'Influencer anlaşmalarınızı takip edin, kaç müşteri getirdiğini hesaplayın.',
    fayda: [
      'Her influencer için indirim kodu ve komisyon oranı tanımlayın',
      'Kod kullanımlarını takip ederek gerçek etki ölçümü yapın',
      'Barter ve nakit anlaşmaları ayrı ayrı yönetin',
      'Hangi influencer size kârlı, hangisi zarar, görün',
    ],
  },
  salon_skoru: {
    slogan: 'İşletmenizin gerçek sağlık durumunu tek bir skor ile görün.',
    fayda: [
      '0-100 arası dinamik salon sağlık skoru — doluluk, tekrar müşteri, iptal, gelir trendinden hesaplanır',
      'Aylık skor trendi ile doğru yönde mi ilerlediğinizi takip edin',
      'Otomatik gelişim önerileri — ne yapmanız gerektiğini sistem söyler',
      'Sadece Seanzy\'de bulunan, rakiplerde olmayan özgün analitik özellik',
    ],
    istat: [
      { sayi: '6', aciklama: 'kritik metrik tek ekranda' },
      { sayi: '★', aciklama: 'Seanzy\'ye özel özellik' },
    ],
  },
  bekleme_listesi: {
    slogan: 'Dolu saatlerde müşteri kaybetmeyin — listeye alın, saat açılınca randevuya dönüştürün.',
    fayda: [
      'Dolu saatlerde müşteriyi sisteme kaydedin, gitmeyin demeyin',
      'Tercih ettiği saat, personel ve hizmeti kaydedin',
      'Saat açılınca tek tıkla randevuya dönüştürün',
      'Sıfır müşteri kaybı, maksimum takvim doluluk oranı',
    ],
  },
  urun_stok: {
    slogan: 'Sattığınız ürünlerin stoğunu takip edin, bitmeden haberdar olun.',
    fayda: [
      'Ürün satışlarını randevulardan bağımsız olarak takip edin',
      'Stok girişi ve çıkışını kategori bazlı yönetin',
      'Kritik stok seviyesi uyarıları ile stok bitmeden önce sipariş verin',
      'Ürün bazlı ciro raporlarıyla en çok satan ürünü bilin',
    ],
  },
  cok_sube: {
    slogan: 'Tek panelden tüm şubelerinizi yönetin — büyümek artık karmaşık değil.',
    fayda: [
      'Her şubeye ayrı personel, hizmet ve takvim tanımlayın',
      'Tüm şubelerin cirosunu tek raporda görün',
      'Şubeler arası veri izolasyonu ile gizlilik korunur',
    ],
  },
  paket_satis: {
    slogan: 'Seans paketleri satın, müşteriyi uzun vadede bağlayın.',
    fayda: [
      'Sınırsız özelleştirilebilir paket tanımı oluşturun',
      'Her müşteri için kalan seans takibi otomatik yapılır',
      'Paket satışı ile müşteri bağlılığı %3 kat artar',
      'Seans kullanım geçmişini ve son kullanım tarihini takip edin',
    ],
    istat: [
      { sayi: '3×', aciklama: 'müşteri bağlılık artışı' },
    ],
  },
  disa_aktar: {
    slogan: 'Tüm verilerinizi Excel\'e aktarın — muhasebeci, analist veya yönetim için.',
    fayda: [
      'Müşteri, randevu, finans, personel verilerini seçerek Excel\'e aktarın',
      'Hangi sütunların çıkacağını kendiniz belirleyin',
      'Tek dosyada ayrı sayfalar — her şey düzenli',
    ],
  },
}

const PAKET_BENFITS: Record<PaketTuru, { baslik: string; items: string[] }> = {
  basic: {
    baslik: 'Basic\'te neler var',
    items: [],
  },
  pro: {
    baslik: 'Pro\'ya geçince neleri kazanırsınız',
    items: [
      'Finans yönetimi ve kâr takibi',
      'Adisyon ve tahsilat sistemi',
      'Gelişmiş raporlar ve analitik',
      'Personel prim hesaplama',
      'Kampanya ve müşteri indirimleri',
      'Bekleme listesi yönetimi',
      'Pazarlama & ROI takibi (★ Seanzy\'ye özel)',
      'Reklam & influencer yönetimi (★ Seanzy\'ye özel)',
      'Salon Skoru analitik (★ Seanzy\'ye özel)',
      'Excel dışa aktarma',
    ],
  },
  enterprise: {
    baslik: 'Enterprise ile sınır tanımayan büyüme',
    items: [
      'Pro\'daki tüm özellikler',
      'Ürün satışı ve stok yönetimi',
      'Çoklu şube yönetimi',
      'Dijital müşteri onam formu',
      'Gelişmiş BI rapor oluşturucu',
      'Öncelikli destek hattı',
    ],
  },
}

export default function PaketEngeli({ ozellik }: Props) {
  const nav = useNavigate()
  const mevcutPaket = useAuth((s) => s.user?.paket_turu) || 'basic'
  const rol = useAuth((s) => s.user?.rol)
  const tanim = OZELLIKLER[ozellik]
  if (!tanim) return null

  const hedefPaket = tanim.min as PaketTuru
  const renk = PAKET_RENK[hedefPaket]
  const detay = OZELLIK_DETAY[ozellik]
  const benefits = PAKET_BENFITS[hedefPaket]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', minHeight: '70dvh' }}>
      <div style={{ maxWidth: 680, width: '100%' }}>

        {/* Geri dön */}
        <button onClick={() => nav(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 32, padding: 0, fontFamily: 'inherit' }}>
          <ArrowLeft size={14} /> Geri Dön
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
          {/* Sol: Detay */}
          <div>
            {/* Kilit ikonu + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `color-mix(in srgb, ${renk} 15%, transparent)`, border: `1.5px solid color-mix(in srgb, ${renk} 35%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: renk, flexShrink: 0 }}>
                <Lock size={22} />
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: renk, fontWeight: 700 }}>
                  {PAKET_AD[hedefPaket]} Paketi Gerekli
                </div>
                <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>
                  Mevcut paketiniz: <span style={{ color: PAKET_RENK[mevcutPaket as PaketTuru] || 'var(--text)', fontWeight: 600 }}>{PAKET_AD[mevcutPaket as PaketTuru] || mevcutPaket}</span>
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{tanim.ad}</h2>

            {/* Slogan */}
            {detay?.slogan && (
              <p style={{ fontSize: 15.5, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
                {detay.slogan}
              </p>
            )}
            {!detay?.slogan && (
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
                {tanim.aciklama} — <strong style={{ color: renk }}>{PAKET_AD[hedefPaket]}</strong> ve üzeri pakete geçtiğinizde hemen kullanabilirsiniz.
              </p>
            )}

            {tanim.benzersiz && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,169,110,.12)', border: '1px solid rgba(201,169,110,.25)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: 'var(--gold-text)', fontWeight: 600, marginBottom: 20 }}>
                <Sparkles size={11} /> Seanzy'ye Özel — rakiplerde bulunmaz
              </div>
            )}

            {/* Fayda listesi */}
            {detay?.fayda && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {detay.fayda.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                    <CheckCircle2 size={16} style={{ color: renk, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: 'var(--text2)', lineHeight: 1.55 }}>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* İstatistikler */}
            {detay?.istat && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                {detay.istat.map((ist, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 110, background: `color-mix(in srgb, ${renk} 8%, var(--surface))`, border: `1px solid color-mix(in srgb, ${renk} 20%, transparent)`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: renk }}>{ist.sayi}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 3 }}>{ist.aciklama}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: Paket kartı */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ background: `color-mix(in srgb, ${renk} 6%, var(--surface))`, border: `1.5px solid color-mix(in srgb, ${renk} 30%, transparent)`, borderRadius: 16, padding: '20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <TrendingUp size={16} style={{ color: renk }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: renk }}>{benefits.baslik}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {benefits.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: renk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ color: 'var(--text2)', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: 18, paddingTop: 16 }}>
                <button className="btn btn-gold"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 13.5, gap: 8 }}
                  onClick={() => nav('/fiyatlar')}>
                  Paketleri İncele <ArrowRight size={14} />
                </button>
                <div style={{ fontSize: 11.5, color: 'var(--faint)', textAlign: 'center', marginTop: 8 }}>
                  Yükseltme için destek ekibiyle iletişime geçin
                </div>
              </div>
            </div>

            {/* Güvence */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', background: 'var(--surface)', borderRadius: 10, fontSize: 12, color: 'var(--text2)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span>İptal garantisi · 7/24 destek · Türkçe arayüz</span>
            </div>

            {/* Sosyal kanıt */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '10px 12px', background: 'var(--surface)', borderRadius: 10, fontSize: 12, color: 'var(--text2)' }}>
              <Users size={14} style={{ color: renk, flexShrink: 0 }} />
              <span>Bu özelliği kullanan işletmeler <strong style={{ color: 'var(--text)' }}>%40 daha hızlı büyüyor</strong></span>
            </div>

            {hedefPaket === 'pro' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '10px 12px', background: 'var(--surface)', borderRadius: 10, fontSize: 12, color: 'var(--text2)' }}>
                <BarChart3 size={14} style={{ color: renk, flexShrink: 0 }} />
                <span>Pro paket kullananların <strong style={{ color: 'var(--text)' }}>%78'i ilk ayda geri döndü</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Alt CTA banner */}
        <div style={{ marginTop: 32, background: `linear-gradient(135deg, color-mix(in srgb, ${renk} 10%, var(--surface)), color-mix(in srgb, ${renk} 5%, var(--surface)))`, border: `1px solid color-mix(in srgb, ${renk} 25%, transparent)`, borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {PAKET_AD[hedefPaket]} paketine geçmek için adım atmaya hazır mısınız?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              {hedefPaket === 'pro' ? 'Pro paket — aylık 599 ₺ · iptal garantisi · hemen aktif' : 'Enterprise paket — size özel fiyatlandırma · özel destek'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            {rol === 'mudur' && (
              <button className="btn btn-ghost" onClick={() => nav('/paketlerim')}
                style={{ fontSize: 13, padding: '10px 18px' }}>
                <Layers size={14} /> Paketlerim
              </button>
            )}
            <button className="btn btn-gold" onClick={() => nav('/fiyatlar')}
              style={{ fontSize: 13, padding: '10px 20px', gap: 7 }}>
              Tüm Paketleri Gör <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
