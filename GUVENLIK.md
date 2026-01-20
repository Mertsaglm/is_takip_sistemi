# 🔒 Güvenlik Kontrol Listesi

## ✅ Yapılması Gerekenler

### 1. GitHub Repository
- [x] Repository'yi **Private** olarak oluştur
- [x] `.gitignore` dosyasında `.env*` var mı kontrol et
- [x] `.env.local` dosyasını asla commit etme

### 2. Supabase
- [x] Database password'ü güvenli bir yerde sakla
- [x] Row Level Security (RLS) aktif (zaten aktif)
- [x] API keys'i kimseyle paylaşma

### 3. Vercel
- [x] Environment Variables'ı Vercel dashboard'dan ekle
- [x] `.env.local` dosyasını Vercel'e yükleme (sadece dashboard'dan ekle)

## ❌ Yapılmaması Gerekenler

- ❌ `.env.local` dosyasını GitHub'a yükleme
- ❌ Supabase API keys'i kod içinde hardcode etme
- ❌ Database password'ü paylaşma
- ❌ Repository'yi Public yapma (private kalsın)

## 🔍 Kontrol Et

### GitHub'da .env.local var mı?
```bash
# Terminal'de çalıştır:
git ls-files | grep .env.local
```

**Sonuç boş olmalı!** Eğer dosya adı görünüyorsa:
```bash
git rm --cached .env.local
git commit -m "Remove .env.local from git"
git push
```

### .gitignore doğru mu?
```bash
cat .gitignore | grep "env"
```

**Şunu görmelisin:** `.env*`

## 🛡️ Güvenlik Özeti

### Gizli Kalması Gerekenler
1. `.env.local` dosyası
2. Supabase Database Password
3. Supabase API Keys (URL ve anon key)

### Paylaşılabilir Olanlar
1. Vercel deploy linki (örn: `is-takip.vercel.app`)
2. GitHub repository (private olduğu sürece)
3. Uygulama kodu (private repository'de)

## 📱 Baban İçin Güvenlik

Baban sadece şunları bilmeli:
- ✅ Vercel linki (örn: `is-takip.vercel.app`)
- ✅ Nasıl kullanacağı

Bunları bilmesine gerek yok:
- ❌ Supabase bilgileri
- ❌ GitHub repository
- ❌ Environment variables

## 🚨 Sorun Olursa

Eğer yanlışlıkla `.env.local` GitHub'a yüklendiyse:

1. Hemen Supabase'de yeni API keys oluştur
2. Eski keys'i sil
3. `.env.local`'i git'ten kaldır:
```bash
git rm --cached .env.local
git commit -m "Remove sensitive file"
git push
```
4. Yeni keys'i Vercel'de güncelle

## ✅ Her Şey Güvende!

- Private repository ✓
- .env.local .gitignore'da ✓
- RLS aktif ✓
- Vercel environment variables ✓
