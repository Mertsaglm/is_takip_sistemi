-- İş Takip Sistemi - Güncelleme
-- Bu SQL'i Supabase SQL Editor'de çalıştır

-- İşlem geçmişi tablosuna yeni alanlar ekle
ALTER TABLE islem_gecmisi 
ADD COLUMN IF NOT EXISTS kalan_borc DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pozisyon_kapali BOOLEAN DEFAULT false;

-- Mevcut İŞ kayıtları için kalan_borc'u tutar ile eşitle
UPDATE islem_gecmisi 
SET kalan_borc = tutar 
WHERE islem_tipi = 'IS' AND (kalan_borc IS NULL OR kalan_borc = 0);

-- ODEME kayıtları için kalan_borc 0 olsun
UPDATE islem_gecmisi 
SET kalan_borc = 0 
WHERE islem_tipi = 'ODEME';

-- İşe özel ödeme tablosu oluştur
CREATE TABLE IF NOT EXISTS is_odemeleri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_id UUID NOT NULL REFERENCES islem_gecmisi(id) ON DELETE CASCADE,
  tutar DECIMAL(10,2) NOT NULL CHECK (tutar > 0),
  aciklama TEXT
);

-- İş ödemeleri için index
CREATE INDEX IF NOT EXISTS idx_is_odemeleri ON is_odemeleri(is_id, created_at DESC);

-- RLS politikaları
ALTER TABLE is_odemeleri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON is_odemeleri;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON is_odemeleri;
DROP POLICY IF EXISTS "Kimse silemez" ON is_odemeleri;
DROP POLICY IF EXISTS "Kimse güncelleyemez" ON is_odemeleri;
DROP POLICY IF EXISTS "Herkes silebilir" ON is_odemeleri;

CREATE POLICY "Herkes okuyabilir" ON is_odemeleri FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON is_odemeleri FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes silebilir" ON is_odemeleri FOR DELETE USING (true);
CREATE POLICY "Kimse güncelleyemez" ON is_odemeleri FOR UPDATE USING (false);

-- İşlem geçmişi tablosunu güncellenebilir ve silinebilir yap
DROP POLICY IF EXISTS "Kimse güncelleyemez" ON islem_gecmisi;
DROP POLICY IF EXISTS "Kimse silemez" ON islem_gecmisi;
DROP POLICY IF EXISTS "Herkes silebilir" ON islem_gecmisi;

CREATE POLICY "Sadece kalan_borc ve pozisyon_kapali güncellenebilir" ON islem_gecmisi 
FOR UPDATE USING (true) 
WITH CHECK (true);

CREATE POLICY "Herkes silebilir" ON islem_gecmisi 
FOR DELETE USING (true);


-- Mevcut foreign key constraint'i CASCADE delete ile güncelle
-- Önce mevcut constraint'i kaldır
ALTER TABLE is_odemeleri 
DROP CONSTRAINT IF EXISTS is_odemeleri_is_id_fkey;

-- Yeni constraint'i CASCADE ile ekle
ALTER TABLE is_odemeleri 
ADD CONSTRAINT is_odemeleri_is_id_fkey 
FOREIGN KEY (is_id) 
REFERENCES islem_gecmisi(id) 
ON DELETE CASCADE;
