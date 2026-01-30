# İş Takip Sistemi

Tamirci borç-alacak takip sistemi. Next.js + Supabase ile geliştirilmiştir.

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Supabase Projesi Oluştur

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. Project Settings → API bölümünden bilgileri alın

### 3. Environment Değişkenlerini Ayarla

`.env.example` dosyasını `.env.local` olarak kopyalayın:

```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Veritabanını Kur

1. Supabase Dashboard → SQL Editor'e gidin
2. `database-setup-clean.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'de çalıştırın

### 5. Uygulamayı Başlat

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

---

## 📋 Özellikler

- ✅ Tamirci ekleme/düzenleme
- ✅ İş kaydı ekleme
- ✅ Ödeme kaydı ekleme
- ✅ Bakiye takibi
- ✅ İşlem geçmişi
- ✅ İşlem iptal etme
- ✅ Tamirci silme (soft delete)
- ✅ Audit log (tüm değişiklikler kaydedilir)

---

## 🗄️ Veritabanı Yapısı

### Tablolar

| Tablo | Açıklama |
|-------|----------|
| `tamirciler` | Müşteri bilgileri |
| `islem_gecmisi` | İş ve ödeme kayıtları |
| `is_odemeleri` | İşe özel ödemeler |
| `islemler_detay` | İşlem detayları (otomatik) |
| `audit_log` | Kara kutu (tüm değişiklikler) |

### Önemli Kurallar

- ❌ **Fiziksel silme YASAK** - Veritabanı seviyesinde engellendi
- ✅ Tamirci silmek: `is_active = false`
- ✅ İşlem iptal etmek: `islem_durumu = 'IPTAL'`

### View'lar

| View | Açıklama |
|------|----------|
| `v_tamirci_aktif_bakiye` | Aktif işlemlerden bakiye hesabı |
| `v_iptal_edilen_islemler` | İptal edilmiş işlemler |
| `v_silinen_tamirciler` | Silinmiş tamirciler |

---

## 🛠️ Teknolojiler

- [Next.js 16](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - PostgreSQL veritabanı
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - İkonlar

---

## 📁 Dosya Yapısı

```
is_takip/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Ana sayfa
│   ├── actions.ts         # Server actions
│   └── tamirci/[id]/      # Tamirci detay sayfası
├── components/            # React bileşenleri
├── lib/                   # Yardımcı fonksiyonlar
├── types/                 # TypeScript tipleri
└── database-setup-clean.sql  # Veritabanı kurulum dosyası
```

---

## 📝 Lisans

MIT
