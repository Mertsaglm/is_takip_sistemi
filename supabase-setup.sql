-- İş Takip Sistemi - Supabase Database Setup
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tamirciler tablosu
CREATE TABLE tamirciler (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  toplam_borc DECIMAL(10,2) DEFAULT 0 CHECK (toplam_borc IS NOT NULL),
  son_islem_tarihi TIMESTAMPTZ,
  version INTEGER DEFAULT 1
);

-- İşlem geçmişi tablosu
CREATE TABLE islem_gecmisi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tamirci_id UUID NOT NULL REFERENCES tamirciler(id) ON DELETE RESTRICT,
  islem_no INTEGER,
  islem_tipi TEXT NOT NULL CHECK (islem_tipi IN ('IS', 'ODEME')),
  aciklama TEXT NOT NULL,
  tutar DECIMAL(10,2) NOT NULL CHECK (tutar > 0),
  eski_bakiye DECIMAL(10,2) NOT NULL,
  yeni_bakiye DECIMAL(10,2) NOT NULL,
  iptal_edilen_islem_id UUID REFERENCES islem_gecmisi(id)
);

-- İndeksler (performans için)
CREATE INDEX idx_tamirci_islemler ON islem_gecmisi(tamirci_id, created_at DESC);
CREATE INDEX idx_tamirci_search ON tamirciler USING gin(to_tsvector('turkish', ad_soyad));
CREATE UNIQUE INDEX idx_unique_telefon ON tamirciler(telefon) WHERE telefon IS NOT NULL AND telefon != '';

-- Otomatik bakiye güncelleme trigger
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

CREATE TRIGGER after_islem_insert
AFTER INSERT ON islem_gecmisi
FOR EACH ROW EXECUTE FUNCTION update_tamirci_bakiye();

-- Row Level Security (RLS) politikaları
ALTER TABLE tamirciler ENABLE ROW LEVEL SECURITY;
ALTER TABLE islem_gecmisi ENABLE ROW LEVEL SECURITY;

-- Tamirciler için politikalar
CREATE POLICY "Herkes okuyabilir" ON tamirciler FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON tamirciler FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON tamirciler FOR UPDATE USING (true);
CREATE POLICY "Kimse silemez" ON tamirciler FOR DELETE USING (false);

-- İşlem geçmişi için politikalar
CREATE POLICY "Herkes okuyabilir" ON islem_gecmisi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON islem_gecmisi FOR INSERT WITH CHECK (true);
CREATE POLICY "Kimse silemez" ON islem_gecmisi FOR DELETE USING (false);
CREATE POLICY "Kimse güncelleyemez" ON islem_gecmisi FOR UPDATE USING (false);

-- Test verisi (isteğe bağlı)
INSERT INTO tamirciler (ad_soyad, telefon) VALUES 
  ('Ahmet Yılmaz', '0532 123 4567'),
  ('Mehmet Demir', '0543 987 6543');
