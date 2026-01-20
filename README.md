# İş Takip Sistemi

Tamirci borç-alacak takip sistemi. Next.js 15, Supabase ve Tailwind CSS ile geliştirilmiştir.

## 🚀 Hızlı Başlangıç

### Seçenek 1: Online Kullanım (ÖNERİLEN)

Vercel'e deploy ederek online kullanın. Detaylı adımlar için [KURULUM-REHBERI.md](./KURULUM-REHBERI.md) dosyasına bakın.

### Seçenek 2: Lokal Kullanım

#### Windows'ta
1. `baslat.bat` dosyasına çift tıklayın
2. Tarayıcı otomatik açılacak

#### Mac'te
1. `baslat.command` dosyasına çift tıklayın
2. Tarayıcı otomatik açılacak

#### Manuel Başlatma
```bash
npm install
npm run dev
```

## ✨ Özellikler

- ✅ Tamirci ekleme ve arama
- ✅ İş kaydı ekleme (borç artırma)
- ✅ Genel ödeme alma
- ✅ İşe özel ödeme alma
- ✅ Pozisyon kapatma (borç affı)
- ✅ Her işin altında ödeme detayları
- ✅ Filtreleme (Son 1 hafta, Son 1 ay, Sadece işler, Sadece ödemeler)
- ✅ Immutable data (kayıtlar silinmez)
- ✅ Otomatik bakiye hesaplama

## 📖 Detaylı Kurulum

Detaylı kurulum adımları için [KURULUM-REHBERI.md](./KURULUM-REHBERI.md) dosyasına bakın.

## 🔒 Güvenlik

- Repository **Private** olmalı
- `.env.local` dosyası asla GitHub'a yüklenmemeli
- Güvenlik kontrol listesi için [GUVENLIK.md](./GUVENLIK.md) dosyasına bakın

## 🎯 Kullanım

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

### Filtreleme

İşlem geçmişinde 5 filtre seçeneği:
- **Tümü** - Tüm işlemler
- **Son 1 Hafta** - Son 7 gün
- **Son 1 Ay** - Son 30 gün
- **Sadece İşler** - Yapılan işler
- **Sadece Ödemeler** - Alınan ödemeler

## 🛠 Teknolojiler

- Next.js 15 (App Router)
- Supabase (PostgreSQL)
- Tailwind CSS
- TypeScript
- Lucide React (icons)

## 📊 Veritabanı

### tamirciler
Tamirci bilgileri ve toplam borç

### islem_gecmisi
Tüm işlemler (İŞ ve ÖDEME)

### is_odemeleri
İşe özel ödemeler

## 📝 Lisans

MIT
