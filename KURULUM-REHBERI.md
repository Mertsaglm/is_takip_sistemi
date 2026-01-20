# İş Takip Sistemi - Kurulum Rehberi

## Seçenek 1: Online Kullanım (ÖNERİLEN - EN KOLAY)

Bu yöntemle program internette çalışır, baban sadece tarayıcıdan link açar.

### Adım 1: GitHub Hesabı Oluştur

1. [github.com](https://github.com) adresine git
2. "Sign up" butonuna tıkla
3. Email, şifre belirle ve hesabı oluştur

### Adım 2: Projeyi GitHub'a Yükle

1. GitHub'da sağ üstten "+" işaretine tıkla
2. "New repository" seç
3. Repository adı: `is-takip`
4. **"Private" seç** (önemli - kimse görmez)
5. "Create repository" tıkla

Sonra terminal'de (bu bilgisayarda):

```bash
cd is-takip
git init
git add .
git commit -m "İlk yükleme"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/is-takip.git
git push -u origin main
```

**Not:** Private repository seçtiğin için sadece sen görebilirsin. Vercel'e deploy ederken GitHub'dan izin isteyecek, ona izin ver.

### Adım 3: Supabase Kurulumu

1. [supabase.com](https://supabase.com) adresine git
2. GitHub ile giriş yap
3. "New Project" tıkla
4. Proje bilgileri:
   - Name: `is-takip`
   - Database Password: Güçlü bir şifre (kaydet!)
   - Region: `Europe West (Frankfurt)`
5. "Create new project" tıkla (1-2 dakika bekle)

### Adım 4: Veritabanı Tablolarını Oluştur

1. Sol menüden "SQL Editor" tıkla
2. "New query" tıkla
3. `supabase-setup.sql` dosyasını aç, içeriği kopyala ve yapıştır
4. "RUN" butonuna tıkla
5. Yeni query aç
6. `supabase-migration.sql` dosyasını aç, içeriği kopyala ve yapıştır
7. "RUN" butonuna tıkla

### Adım 5: API Bilgilerini Al

1. Sol menüden "Project Settings" (dişli ikonu) tıkla
2. "API" sekmesine tıkla
3. Şu bilgileri kopyala:
   - **Project URL** (örn: https://xxxxx.supabase.co)
   - **anon public** key (uzun bir metin)

**⚠️ ÖNEMLİ GÜVENLİK NOTU:**
- Bu bilgileri kimseyle paylaşma
- `.env.local` dosyası GitHub'a yüklenmez (zaten .gitignore'da)
- Vercel'de Environment Variables olarak ekleyeceğiz

### Adım 6: Vercel'e Deploy Et

1. [vercel.com](https://vercel.com) adresine git
2. GitHub ile giriş yap
3. "Add New..." > "Project" tıkla
4. `is-takip` repository'sini seç
5. "Import" tıkla
6. "Environment Variables" kısmına ekle:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Supabase Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Supabase anon key)
7. "Deploy" butonuna tıkla (2-3 dakika bekle)

### Adım 7: Hazır! 🎉

Deploy tamamlandığında bir link verecek (örn: `is-takip.vercel.app`)

**Bu linki babana gönder. Artık herhangi bir cihazdan bu linke girip kullanabilir!**

---

## Seçenek 2: Bilgisayarında Lokal Kullanım

Bu yöntemle program sadece o bilgisayarda çalışır.

### Gereksinimler

1. **Node.js 18+** yüklü olmalı
   - [nodejs.org](https://nodejs.org) adresinden indir ve kur
   - Terminal'de `node --version` yazarak kontrol et

### Kurulum Adımları

1. Projeyi babamın bilgisayarına kopyala (USB veya email ile)

2. Terminal'i aç ve proje klasörüne git:
```bash
cd is-takip
```

3. Bağımlılıkları yükle:
```bash
npm install
```

4. `.env.local` dosyasını düzenle:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Uygulamayı başlat:
```bash
npm run dev
```

6. Tarayıcıda aç: `http://localhost:3000`

### Her Kullanımda

Bilgisayarı her açtığında:

1. Terminal'i aç
2. `cd is-takip` yaz
3. `npm run dev` yaz
4. Tarayıcıda `http://localhost:3000` aç

---

## Seçenek 3: Masaüstü Uygulaması (EN KOLAY - LOKAL)

Eğer baban her seferinde terminal açmak istemiyorsa, bir başlatma scripti oluşturabiliriz.

### Windows için

`baslat.bat` dosyası oluştur:

```batch
@echo off
cd /d "%~dp0"
start http://localhost:3000
npm run dev
```

Çift tıklayınca otomatik başlar!

### Mac için

`baslat.command` dosyası oluştur:

```bash
#!/bin/bash
cd "$(dirname "$0")"
open http://localhost:3000
npm run dev
```

Terminal'de çalıştırılabilir yap:
```bash
chmod +x baslat.command
```

Çift tıklayınca otomatik başlar!

---

## 🔒 Güvenlik Notları

### GitHub Private Repository
- Repository'yi **Private** olarak oluşturdun
- Sadece sen görebilirsin
- Vercel deploy ederken GitHub'a izin vereceksin (normal)

### Gizli Kalması Gerekenler
1. **`.env.local`** - Supabase bilgileri (zaten .gitignore'da)
2. **Supabase Database Password** - Güvenli bir yerde sakla
3. **Supabase API Keys** - Kimseyle paylaşma

### Güvenli Olan
- Vercel deploy linki (`is-takip.vercel.app`) - Babana verebilirsin
- Uygulama kodu - Private repository'de güvende

### Supabase Row Level Security (RLS)
- Zaten aktif
- Herkes sadece kendi verilerini görebilir
- Ek güvenlik ayarı gerektirmez

---

## Hangi Yöntemi Seçmeli?

### ✅ Seçenek 1 (Online - Vercel) - ÖNERİLEN
**Artıları:**
- En kolay kullanım
- Herhangi bir cihazdan erişim (telefon, tablet, başka bilgisayar)
- Otomatik güncellemeler
- Kurulum gerektirmez
- Her zaman açık

**Eksileri:**
- İnternet bağlantısı gerekli
- Supabase ücretsiz limiti (50,000 satır, 500MB)

### Seçenek 2 (Lokal)
**Artıları:**
- İnternet gerektirmez
- Tamamen özel
- Sınırsız kullanım

**Eksileri:**
- Her kullanımda terminal açmak gerekir
- Sadece o bilgisayarda çalışır
- Node.js kurulumu gerekli

### Seçenek 3 (Masaüstü Script)
**Artıları:**
- Çift tıklama ile başlar
- İnternet gerektirmez

**Eksileri:**
- İlk kurulum biraz teknik
- Sadece o bilgisayarda çalışır

---

## Önerilen Yöntem

**Baban için en iyisi Seçenek 1 (Vercel):**

1. Sen bir kere kur (15 dakika)
2. Babana linki gönder
3. O sadece linke tıklayıp kullanır
4. Telefon, tablet, bilgisayar - her yerden erişir
5. Hiçbir teknik bilgi gerektirmez

---

## Yardım

Sorun yaşarsan:
- Supabase Dashboard > Logs kısmına bak
- Vercel Dashboard > Deployments > Logs kısmına bak
- Browser console'u kontrol et (F12)
