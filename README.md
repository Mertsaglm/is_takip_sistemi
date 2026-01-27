# İş Takip Sistemi

Tamirci borç-alacak takip uygulaması. Next.js 16, Supabase ve Tailwind CSS ile geliştirilmiştir.

## 🚀 Hızlı Başlangıç

### Windows
`baslat.bat` dosyasına çift tıklayın. Tarayıcı otomatik olarak açılacaktır.

### macOS
`baslat.command` dosyasına çift tıklayın. Tarayıcı otomatik olarak açılacaktır.

### Manuel Başlatma
```bash
npm install
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## ✨ Özellikler

### Tamirci Yönetimi
- Tamirci ekleme ve arama
- Telefon numarası ile iletişim bilgileri
- Toplam borç takibi
- Tamirci silme (tüm kayıtlarıyla birlikte)

### İş Takibi
- İş kaydı ekleme (borç artırma)
- İşe özel ödeme alma
- Pozisyon kapatma (borç affı)
- İş silme (ödemelerle birlikte)
- Her işin altında ödeme detayları

### Ödeme Yönetimi
- Genel ödeme alma
- İşe özel ödeme alma
- Otomatik bakiye hesaplama
- Ödeme geçmişi

### Filtreleme
- Tümü
- Son 1 hafta
- Son 1 ay
- Sadece işler
- Sadece ödemeler

### Güvenlik
- Cascade delete ile veri tutarlılığı
- Row Level Security (RLS) politikaları
- Atomik işlemler

## 📋 Kurulum

### 1. Projeyi İndirin
```bash
git clone <repository-url>
cd is-takip
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Supabase Projesi Oluşturun
1. [Supabase](https://supabase.com) hesabı açın
2. Yeni proje oluşturun
3. Project Settings > API'den URL ve Anon Key'i alın

### 4. Ortam Değişkenlerini Ayarlayın
`.env.example` dosyasını `.env.local` olarak kopyalayın:
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Veritabanını Kurun
Supabase Dashboard > SQL Editor'de `database-setup.sql` dosyasını çalıştırın.

Bu dosya tüm tabloları, trigger'ları, index'leri ve RLS politikalarını otomatik oluşturur.

### 6. Uygulamayı Başlatın
```bash
npm run dev
```

## 🎯 Kullanım Örnekleri

### İş Ekleme ve Ödeme Alma
```
1. İş ekle: Balata değişimi - 3200 TL
   → Tamirci borcu: 3200 TL
   → İş kalan borç: 3200 TL

2. İşe ödeme al: 3000 TL
   → Tamirci borcu: 200 TL
   → İş kalan borç: 200 TL
   → Ödeme işin altında görünür

3. İşe ödeme al: 200 TL
   → Tamirci borcu: 0 TL
   → İş otomatik kapalı (ÖDENDİ)
```

### Pozisyon Kapatma
```
1. İş ekle: Motor tamiri - 5000 TL
2. Ödeme al: 2000 TL (kalan: 3000 TL)
3. "Pozisyonu Kapat" butonuna tıkla
   → Kalan 3000 TL borç affedilir
   → İş kapalı olarak işaretlenir
```

### Silme İşlemleri
- **Tamirci Sil**: Tamirci ve tüm işlemleri/ödemeleri kalıcı olarak silinir
- **İş Sil**: İş ve ödemeleri silinir, toplam borç otomatik güncellenir
- **Ödeme Sil**: Ödeme silinir, borç geri eklenir

⚠️ **Dikkat**: Silme işlemleri geri alınamaz!

## 🛠 Teknolojiler

- **Next.js 16** - React framework (App Router)
- **React 19** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Supabase** - Backend ve veritabanı (PostgreSQL)
- **Tailwind CSS 4** - Styling
- **Lucide React** - İkonlar

## 📊 Veritabanı Yapısı

### tamirciler
Tamirci bilgileri ve toplam borç takibi
- `id` - UUID (Primary Key)
- `ad_soyad` - Tamirci adı
- `telefon` - İletişim numarası
- `toplam_borc` - Güncel toplam borç
- `son_islem_tarihi` - Son işlem zamanı
- `version` - Optimistic locking için

### islem_gecmisi
Tüm işlemler (İŞ ve ÖDEME)
- `id` - UUID (Primary Key)
- `tamirci_id` - Foreign Key (CASCADE DELETE)
- `islem_tipi` - 'IS' veya 'ODEME'
- `aciklama` - İşlem açıklaması
- `tutar` - İşlem tutarı
- `eski_bakiye` - İşlem öncesi bakiye
- `yeni_bakiye` - İşlem sonrası bakiye
- `kalan_borc` - İş için kalan borç
- `pozisyon_kapali` - İş kapalı mı?

### is_odemeleri
İşe özel ödemeler
- `id` - UUID (Primary Key)
- `is_id` - Foreign Key (CASCADE DELETE)
- `tutar` - Ödeme tutarı
- `aciklama` - Ödeme açıklaması

## 🔒 Güvenlik

### Row Level Security (RLS)
Tüm tablolar için RLS politikaları aktif:
- Herkes okuyabilir
- Herkes ekleyebilir
- Herkes silebilir
- Sadece belirli alanlar güncellenebilir

### Cascade Delete
- Tamirci silinince → Tüm işlemleri ve ödemeleri otomatik silinir
- İş silinince → Tüm ödemeleri otomatik silinir

### Veri Tutarlılığı
- Atomik işlemler
- Otomatik bakiye hesaplama
- Trigger'lar ile tutarlılık garantisi

## 📦 Deployment

### Vercel (Önerilen)
1. GitHub'a push edin
2. [Vercel](https://vercel.com)'e import edin
3. Environment variables ekleyin
4. Deploy edin

### Diğer Platformlar
Next.js uyumlu herhangi bir platformda çalışır:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

## 🐛 Sorun Giderme

### "Supabase bağlantı hatası"
- `.env.local` dosyasının doğru yapılandırıldığından emin olun
- Supabase URL ve Anon Key'i kontrol edin
- Supabase projesinin aktif olduğunu doğrulayın

### "İşlem silinemiyor"
- `delete-migration.sql` dosyasının çalıştırıldığından emin olun
- RLS politikalarını kontrol edin
- Browser console'da detaylı hata mesajını inceleyin

### "Toplam borç yanlış hesaplanıyor"
- Veritabanı migration'larının tam olarak uygulandığından emin olun
- Trigger'ların aktif olduğunu kontrol edin

## 📝 Lisans

MIT

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.
