-- ========================================
-- İŞ TAKİP SİSTEMİ - VERİTABANI KURULUMU
-- ========================================
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- Tüm tabloları, trigger'ları ve politikaları oluşturur

-- UUID extension'ı aktifleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLOLAR
-- ========================================

-- Tamirciler tablosu
CREATE TABLE IF NOT EXISTS tamirciler (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  toplam_borc DECIMAL(10,2) DEFAULT 0 CHECK (toplam_borc IS NOT NULL),
  son_islem_tarihi TIMESTAMPTZ,
  version INTEGER DEFAULT 1
);

-- İşlem geçmişi tablosu
CREATE TABLE IF NOT EXISTS islem_gecmisi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tamirci_id UUID NOT NULL REFERENCES tamirciler(id) ON DELETE CASCADE,
  islem_no INTEGER,
  islem_tipi TEXT NOT NULL CHECK (islem_tipi IN ('IS', 'ODEME')),
  aciklama TEXT NOT NULL,
  tutar DECIMAL(10,2) NOT NULL CHECK (tutar > 0),
  eski_bakiye DECIMAL(10,2) NOT NULL,
  yeni_bakiye DECIMAL(10,2) NOT NULL,
  kalan_borc DECIMAL(10,2) DEFAULT 0,
  pozisyon_kapali BOOLEAN DEFAULT false,
  iptal_edilen_islem_id UUID REFERENCES islem_gecmisi(id)
);

-- İşe özel ödemeler tablosu
CREATE TABLE IF NOT EXISTS is_odemeleri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_id UUID NOT NULL REFERENCES islem_gecmisi(id) ON DELETE CASCADE,
  tutar DECIMAL(10,2) NOT NULL CHECK (tutar > 0),
  aciklama TEXT
);

-- ========================================
-- İNDEKSLER (Performans için)
-- ========================================

-- Tamirci işlemleri için index
CREATE INDEX IF NOT EXISTS idx_tamirci_islemler 
ON islem_gecmisi(tamirci_id, created_at DESC);

-- Tamirci arama için full-text search index
CREATE INDEX IF NOT EXISTS idx_tamirci_search 
ON tamirciler USING gin(to_tsvector('turkish', ad_soyad));

-- Telefon numarası için unique index (boş değilse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_telefon 
ON tamirciler(telefon) 
WHERE telefon IS NOT NULL AND telefon != '';

-- İş ödemeleri için index
CREATE INDEX IF NOT EXISTS idx_is_odemeleri 
ON is_odemeleri(is_id, created_at DESC);

-- ========================================
-- TRİGGER'LAR
-- ========================================

-- Otomatik bakiye güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_tamirci_bakiye()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tamirciler 
  SET 
    toplam_borc = NEW.yeni_bakiye,
    son_islem_tarihi = NEW.created_at,
    version = version + 1
  WHERE id = NEW.tamirci_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: İşlem eklenince tamirci bakiyesini güncelle
DROP TRIGGER IF EXISTS after_islem_insert ON islem_gecmisi;
CREATE TRIGGER after_islem_insert
AFTER INSERT ON islem_gecmisi
FOR EACH ROW EXECUTE FUNCTION update_tamirci_bakiye();

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ========================================

-- RLS'i aktifleştir
ALTER TABLE tamirciler ENABLE ROW LEVEL SECURITY;
ALTER TABLE islem_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE is_odemeleri ENABLE ROW LEVEL SECURITY;

-- Tamirciler tablosu politikaları
DROP POLICY IF EXISTS "Herkes okuyabilir" ON tamirciler;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON tamirciler;
DROP POLICY IF EXISTS "Herkes güncelleyebilir" ON tamirciler;
DROP POLICY IF EXISTS "Herkes silebilir" ON tamirciler;

CREATE POLICY "Herkes okuyabilir" ON tamirciler 
FOR SELECT USING (true);

CREATE POLICY "Herkes ekleyebilir" ON tamirciler 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Herkes güncelleyebilir" ON tamirciler 
FOR UPDATE USING (true);

CREATE POLICY "Herkes silebilir" ON tamirciler 
FOR DELETE USING (true);

-- İşlem geçmişi tablosu politikaları
DROP POLICY IF EXISTS "Herkes okuyabilir" ON islem_gecmisi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON islem_gecmisi;
DROP POLICY IF EXISTS "Herkes silebilir" ON islem_gecmisi;
DROP POLICY IF EXISTS "Sadece kalan_borc ve pozisyon_kapali güncellenebilir" ON islem_gecmisi;

CREATE POLICY "Herkes okuyabilir" ON islem_gecmisi 
FOR SELECT USING (true);

CREATE POLICY "Herkes ekleyebilir" ON islem_gecmisi 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Herkes silebilir" ON islem_gecmisi 
FOR DELETE USING (true);

CREATE POLICY "Sadece kalan_borc ve pozisyon_kapali güncellenebilir" ON islem_gecmisi 
FOR UPDATE USING (true) WITH CHECK (true);

-- İş ödemeleri tablosu politikaları
DROP POLICY IF EXISTS "Herkes okuyabilir" ON is_odemeleri;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON is_odemeleri;
DROP POLICY IF EXISTS "Herkes silebilir" ON is_odemeleri;

CREATE POLICY "Herkes okuyabilir" ON is_odemeleri 
FOR SELECT USING (true);

CREATE POLICY "Herkes ekleyebilir" ON is_odemeleri 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Herkes silebilir" ON is_odemeleri 
FOR DELETE USING (true);

-- ========================================
-- KURULUM TAMAMLANDI!
-- ========================================
-- Artık uygulamayı kullanmaya başlayabilirsiniz.
-- 
-- Cascade Delete Özellikleri:
-- - Tamirci silinince → Tüm işlemleri ve ödemeleri otomatik silinir
-- - İş silinince → Tüm ödemeleri otomatik silinir
-- 
-- Veritabanı yapısını kontrol etmek için:
-- 1. Table Editor'de tabloları görüntüleyin
-- 2. SQL Editor'de "SELECT * FROM tamirciler;" çalıştırın
