# İşlem Silme Özelliği (Hard Delete)

## Özellikler

✅ **Tam Silme (Hard Delete)**: Hatalı işlemler veritabanından kalıcı olarak silinir
✅ **Atomik İşlem**: Tüm ilişkili veriler ve hesaplamalar tutarlı şekilde güncellenir
✅ **Onay Modalı**: Yanlışlıkla silmelere karşı kullanıcı onayı
✅ **Otomatik Hesaplama**: Toplam borç otomatik olarak yeniden hesaplanır
✅ **Cascade Delete**: İşe ait ödemeler otomatik olarak silinir

## Kurulum

### 1. Veritabanı Migration'ını Uygula

Supabase Dashboard'a git ve SQL Editor'de aşağıdaki komutu çalıştır:

```sql
-- Mevcut foreign key constraint'i CASCADE delete ile güncelle
ALTER TABLE is_odemeleri 
DROP CONSTRAINT IF EXISTS is_odemeleri_is_id_fkey;

ALTER TABLE is_odemeleri 
ADD CONSTRAINT is_odemeleri_is_id_fkey 
FOREIGN KEY (is_id) 
REFERENCES islem_gecmisi(id) 
ON DELETE CASCADE;

-- Silme politikalarını güncelle
DROP POLICY IF EXISTS "Kimse silemez" ON is_odemeleri;
DROP POLICY IF EXISTS "Herkes silebilir" ON is_odemeleri;
CREATE POLICY "Herkes silebilir" ON is_odemeleri FOR DELETE USING (true);

DROP POLICY IF EXISTS "Kimse silemez" ON islem_gecmisi;
DROP POLICY IF EXISTS "Herkes silebilir" ON islem_gecmisi;
CREATE POLICY "Herkes silebilir" ON islem_gecmisi FOR DELETE USING (true);
```

### 2. Uygulamayı Yeniden Başlat

```bash
npm run dev
```

## Kullanım

### İşlem Silme

1. Tamirci detay sayfasında işlem listesini görüntüle
2. Silmek istediğin işlemin yanındaki **Sil** butonuna tıkla
3. Onay modalında işlem detaylarını kontrol et
4. **Sil** butonuna tıklayarak işlemi kalıcı olarak sil

### Silme İşlemi Nasıl Çalışır?

#### İş Kaydı Silindiğinde:
- İşin kendisi veritabanından silinir
- İşe ait tüm ödemeler otomatik olarak silinir (CASCADE)
- Tamircinin toplam borcundan **kalan borç** düşülür
- Sayfa otomatik olarak güncellenir

#### Ödeme Kaydı Silindiğinde:
- Ödeme kaydı veritabanından silinir
- Tamircinin toplam borcuna **ödeme tutarı** eklenir (ödeme geri alınmış olur)
- Sayfa otomatik olarak güncellenir

## Güvenlik

⚠️ **Dikkat**: Bu işlem geri alınamaz!

- Silme işlemi kalıcıdır
- Onay modalı yanlışlıkla silmeleri önler
- Tüm hesaplamalar atomik olarak yapılır
- Veri tutarlılığı garanti edilir

## Teknik Detaylar

### API Endpoint

```typescript
deleteTransaction(islemId: string, tamirciId: string)
```

### İşlem Akışı

1. İşlem ve ilişkili veriler getirilir
2. Tamircinin mevcut toplam borcu alınır
3. Yeni toplam borç hesaplanır:
   - İş siliniyorsa: `yeni_borc = mevcut_borc - kalan_borc`
   - Ödeme siliniyorsa: `yeni_borc = mevcut_borc + odeme_tutari`
4. İş ödemeleri silinir (varsa)
5. İşlem silinir
6. Tamircinin toplam borcu güncellenir
7. Sayfa yenilenir

### Database Schema

```sql
-- CASCADE delete ile foreign key
ALTER TABLE is_odemeleri 
ADD CONSTRAINT is_odemeleri_is_id_fkey 
FOREIGN KEY (is_id) 
REFERENCES islem_gecmisi(id) 
ON DELETE CASCADE;
```

## Test Senaryoları

### Senaryo 1: Ödenmemiş İş Silme
1. 1000₺ tutarında iş ekle
2. İşi sil
3. ✅ Toplam borç 1000₺ azalmalı

### Senaryo 2: Kısmi Ödenmiş İş Silme
1. 1000₺ tutarında iş ekle
2. 400₺ ödeme al
3. İşi sil (kalan: 600₺)
4. ✅ Toplam borç 600₺ azalmalı
5. ✅ 400₺'lik ödeme kaydı da silinmeli

### Senaryo 3: Tam Ödenmiş İş Silme
1. 1000₺ tutarında iş ekle
2. 1000₺ ödeme al
3. İşi sil (kalan: 0₺)
4. ✅ Toplam borç değişmemeli
5. ✅ Ödeme kaydı da silinmeli

### Senaryo 4: Ödeme Silme
1. 1000₺ tutarında iş ekle
2. 400₺ ödeme al
3. 400₺'lik ödemeyi sil
4. ✅ Toplam borç 400₺ artmalı

## Sorun Giderme

### "İşlem silinirken hata oluştu"
- Supabase bağlantısını kontrol et
- RLS politikalarının doğru ayarlandığından emin ol
- Browser console'da detaylı hata mesajını kontrol et

### Toplam Borç Yanlış Hesaplanıyor
- Migration'ın tam olarak uygulandığından emin ol
- Mevcut verileri kontrol et
- Gerekirse toplam borçları yeniden hesapla

## Gelecek İyileştirmeler

- [ ] Undo/Geri Al özelliği (soft delete ile)
- [ ] Silme geçmişi/log tutma
- [ ] Toplu silme özelliği
- [ ] Silme nedeni ekleme
