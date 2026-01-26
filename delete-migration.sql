-- İşlem Silme Özelliği için Migration
-- Bu SQL'i Supabase SQL Editor'de çalıştır

-- 1. CASCADE delete için foreign key constraint'i güncelle
ALTER TABLE is_odemeleri 
DROP CONSTRAINT IF EXISTS is_odemeleri_is_id_fkey;

ALTER TABLE is_odemeleri 
ADD CONSTRAINT is_odemeleri_is_id_fkey 
FOREIGN KEY (is_id) 
REFERENCES islem_gecmisi(id) 
ON DELETE CASCADE;

-- 2. is_odemeleri tablosu için silme politikası ekle
DROP POLICY IF EXISTS "Kimse silemez" ON is_odemeleri;
DROP POLICY IF EXISTS "Herkes silebilir" ON is_odemeleri;

CREATE POLICY "Herkes silebilir" ON is_odemeleri 
FOR DELETE USING (true);

-- 3. islem_gecmisi tablosu için silme politikası ekle
DROP POLICY IF EXISTS "Kimse silemez" ON islem_gecmisi;
DROP POLICY IF EXISTS "Herkes silebilir" ON islem_gecmisi;

CREATE POLICY "Herkes silebilir" ON islem_gecmisi 
FOR DELETE USING (true);

-- Migration tamamlandı!
-- Artık işlemler ve ilişkili ödemeler silinebilir.
