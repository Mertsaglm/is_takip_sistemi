-- ========================================
-- İŞ TAKİP SİSTEMİ - VERİTABANI KURULUMU
-- ========================================
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- Tüm tabloları, trigger'ları, view'ları ve politikaları oluşturur
-- 
-- VERSİYON: 2.1 - Kayıpsız Yedek Sistemi (Final)
-- TARİH: 2026-01-30
-- ========================================

-- UUID extension'ı aktifleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLOLAR
-- ========================================

-- Audit Log Tablosu (KARA KUTU - Her değişiklik kaydedilir)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Hangi tablo, hangi kayıt
  tablo_adi TEXT NOT NULL,
  kayit_id UUID NOT NULL,
  
  -- Ne yapıldı
  islem_tipi TEXT NOT NULL CHECK (islem_tipi IN ('INSERT', 'UPDATE', 'DELETE', 'IPTAL', 'PASIF')),
  
  -- Veri snapshot'ları (JSONB olarak tam kayıt)
  eski_veri JSONB,
  yeni_veri JSONB,
  
  -- Açıklama (iptal sebebi vb.)
  aciklama TEXT,
  
  -- Kim yaptı (ileride auth eklenince)
  kullanici TEXT DEFAULT 'sistem',
  
  -- Ekstra bilgiler
  metadata JSONB
);

-- Tamirciler tablosu
CREATE TABLE IF NOT EXISTS tamirciler (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  toplam_borc DECIMAL(10,2) DEFAULT 0 CHECK (toplam_borc IS NOT NULL),
  son_islem_tarihi TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  -- Soft delete alanları
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ NULL,
  deleted_reason TEXT NULL
);

-- İşlem geçmişi tablosu
CREATE TABLE IF NOT EXISTS islem_gecmisi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tamirci_id UUID NOT NULL REFERENCES tamirciler(id) ON DELETE RESTRICT,
  tamirci_adi TEXT,
  tamirci_telefon TEXT,
  islem_no INTEGER,
  islem_tipi TEXT NOT NULL CHECK (islem_tipi IN ('IS', 'ODEME')),
  aciklama TEXT NOT NULL,
  tutar DECIMAL(10,2) NOT NULL CHECK (tutar > 0),
  eski_bakiye DECIMAL(10,2) NOT NULL,
  yeni_bakiye DECIMAL(10,2) NOT NULL,
  kalan_borc DECIMAL(10,2) DEFAULT 0,
  pozisyon_kapali BOOLEAN DEFAULT false,
  iptal_edilen_islem_id UUID REFERENCES islem_gecmisi(id),
  -- İptal mekanizması
  islem_durumu TEXT DEFAULT 'AKTIF' CHECK (islem_durumu IN ('AKTIF', 'IPTAL', 'DUZELTME')),
  iptal_nedeni TEXT NULL,
  iptal_tarihi TIMESTAMPTZ NULL
);

-- İşe özel ödemeler tablosu
CREATE TABLE IF NOT EXISTS is_odemeleri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_id UUID NOT NULL REFERENCES islem_gecmisi(id) ON DELETE RESTRICT,
  tutar DECIMAL(10,2) NOT NULL CHECK (tutar > 0),
  aciklama TEXT,
  -- İptal mekanizması
  islem_durumu TEXT DEFAULT 'AKTIF' CHECK (islem_durumu IN ('AKTIF', 'IPTAL')),
  iptal_nedeni TEXT NULL,
  iptal_tarihi TIMESTAMPTZ NULL
);

-- İşlemler detay tablosu
CREATE TABLE IF NOT EXISTS islemler_detay (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  islem_id UUID NOT NULL REFERENCES islem_gecmisi(id) ON DELETE RESTRICT,
  tamirci_adi TEXT NOT NULL,
  islem_tipi TEXT NOT NULL CHECK (islem_tipi IN ('IS', 'ODEME')),
  aciklama TEXT NOT NULL,
  tutar DECIMAL(10,2) NOT NULL CHECK (tutar > 0),
  eski_bakiye DECIMAL(10,2) NOT NULL,
  yeni_bakiye DECIMAL(10,2) NOT NULL,
  kalan_borc DECIMAL(10,2) DEFAULT 0,
  -- İptal mekanizması
  islem_durumu TEXT DEFAULT 'AKTIF' CHECK (islem_durumu IN ('AKTIF', 'IPTAL', 'DUZELTME')),
  iptal_nedeni TEXT NULL,
  iptal_tarihi TIMESTAMPTZ NULL
);

-- ========================================
-- İNDEKSLER (Performans için)
-- ========================================

-- Audit log indexleri
CREATE INDEX IF NOT EXISTS idx_audit_log_tablo_kayit ON audit_log(tablo_adi, kayit_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tarih ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_islem_tipi ON audit_log(islem_tipi);

-- Tamirciler indexleri
CREATE INDEX IF NOT EXISTS idx_tamirciler_active ON tamirciler(is_active) WHERE is_active = true;

-- İşlem geçmişi indexleri
CREATE INDEX IF NOT EXISTS idx_tamirci_islemler ON islem_gecmisi(tamirci_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_islem_durumu ON islem_gecmisi(islem_durumu);
CREATE INDEX IF NOT EXISTS idx_islem_aktif ON islem_gecmisi(tamirci_id, islem_durumu) WHERE islem_durumu = 'AKTIF';

-- İş ödemeleri indexleri
CREATE INDEX IF NOT EXISTS idx_is_odemeleri ON is_odemeleri(is_id, created_at DESC);

-- İşlemler detay indexleri
CREATE INDEX IF NOT EXISTS idx_islemler_detay_islem ON islemler_detay(islem_id);
CREATE INDEX IF NOT EXISTS idx_islemler_detay_tamirci ON islemler_detay(tamirci_adi);
CREATE INDEX IF NOT EXISTS idx_islemler_detay_created ON islemler_detay(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_islemler_detay_durumu ON islemler_detay(islem_durumu);

-- ========================================
-- TRİGGER FONKSİYONLARI
-- ========================================

-- Tamirci bilgilerini otomatik doldur
CREATE OR REPLACE FUNCTION populate_tamirci_info()
RETURNS TRIGGER AS $$
BEGIN
  SELECT ad_soyad, telefon INTO NEW.tamirci_adi, NEW.tamirci_telefon
  FROM tamirciler
  WHERE id = NEW.tamirci_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- İşlemler detay kaydı oluştur
CREATE OR REPLACE FUNCTION create_islemler_detay()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO islemler_detay (
    islem_id,
    tamirci_adi,
    islem_tipi,
    aciklama,
    tutar,
    eski_bakiye,
    yeni_bakiye,
    kalan_borc,
    islem_durumu
  ) VALUES (
    NEW.id,
    NEW.tamirci_adi,
    NEW.islem_tipi,
    NEW.aciklama,
    NEW.tutar,
    NEW.eski_bakiye,
    NEW.yeni_bakiye,
    NEW.kalan_borc,
    NEW.islem_durumu
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Otomatik bakiye güncelleme
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

-- Audit Log Trigger Fonksiyonu (Kara Kutu)
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT işlemi
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tablo_adi, kayit_id, islem_tipi, yeni_veri)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
    RETURN NEW;
  
  -- UPDATE işlemi
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tablo_adi, kayit_id, islem_tipi, eski_veri, yeni_veri)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  
  -- DELETE işlemi - ENGELLE!
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'FİZİKSEL SİLME YASAKTIR! Lütfen soft delete (is_active=false veya islem_durumu=IPTAL) kullanın. Tablo: %, Kayıt ID: %', TG_TABLE_NAME, OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- İşlemler detay senkronizasyon fonksiyonu
CREATE OR REPLACE FUNCTION sync_islemler_detay_func()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.islem_durumu IS DISTINCT FROM NEW.islem_durumu THEN
    UPDATE islemler_detay
    SET 
      islem_durumu = NEW.islem_durumu,
      iptal_nedeni = NEW.iptal_nedeni,
      iptal_tarihi = NEW.iptal_tarihi
    WHERE islem_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRİGGER'LAR
-- ========================================

-- Önce varsa eski trigger'ları kaldır
DROP TRIGGER IF EXISTS before_islem_insert_populate_info ON islem_gecmisi;
DROP TRIGGER IF EXISTS after_islem_insert_create_detay ON islem_gecmisi;
DROP TRIGGER IF EXISTS after_islem_insert_update_bakiye ON islem_gecmisi;
DROP TRIGGER IF EXISTS audit_tamirciler ON tamirciler;
DROP TRIGGER IF EXISTS audit_islem_gecmisi ON islem_gecmisi;
DROP TRIGGER IF EXISTS audit_is_odemeleri ON is_odemeleri;
DROP TRIGGER IF EXISTS sync_islemler_detay ON islem_gecmisi;

-- İşlem geçmişi trigger'ları
CREATE TRIGGER before_islem_insert_populate_info
BEFORE INSERT ON islem_gecmisi
FOR EACH ROW EXECUTE FUNCTION populate_tamirci_info();

CREATE TRIGGER after_islem_insert_create_detay
AFTER INSERT ON islem_gecmisi
FOR EACH ROW EXECUTE FUNCTION create_islemler_detay();

CREATE TRIGGER after_islem_insert_update_bakiye
AFTER INSERT ON islem_gecmisi
FOR EACH ROW EXECUTE FUNCTION update_tamirci_bakiye();

-- Audit trigger'ları (Kara Kutu)
CREATE TRIGGER audit_tamirciler
  AFTER INSERT OR UPDATE OR DELETE ON tamirciler
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_islem_gecmisi
  AFTER INSERT OR UPDATE OR DELETE ON islem_gecmisi
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_is_odemeleri
  AFTER INSERT OR UPDATE OR DELETE ON is_odemeleri
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Senkronizasyon trigger'ı
CREATE TRIGGER sync_islemler_detay
  AFTER UPDATE ON islem_gecmisi
  FOR EACH ROW EXECUTE FUNCTION sync_islemler_detay_func();

-- ========================================
-- VIEW'LAR (Güvenli - security_invoker)
-- ========================================

DROP VIEW IF EXISTS v_tamirci_aktif_bakiye;
DROP VIEW IF EXISTS v_iptal_edilen_islemler;
DROP VIEW IF EXISTS v_silinen_tamirciler;

-- Aktif bakiye hesaplama view'ı
CREATE VIEW v_tamirci_aktif_bakiye 
WITH (security_invoker = true)
AS
SELECT 
  t.id,
  t.ad_soyad,
  t.telefon,
  t.is_active,
  t.created_at,
  t.son_islem_tarihi,
  t.toplam_borc as kayitli_borc,
  COALESCE(
    (
      SELECT SUM(
        CASE 
          WHEN ig.islem_tipi = 'IS' THEN ig.tutar
          WHEN ig.islem_tipi = 'ODEME' THEN -ig.tutar
          ELSE 0
        END
      )
      FROM islem_gecmisi ig
      WHERE ig.tamirci_id = t.id 
        AND ig.islem_durumu = 'AKTIF'
    ), 
    0
  ) as hesaplanan_borc,
  (
    SELECT COUNT(*) 
    FROM islem_gecmisi ig 
    WHERE ig.tamirci_id = t.id 
      AND ig.islem_durumu = 'IPTAL'
  ) as iptal_edilen_islem_sayisi
FROM tamirciler t;

-- İptal edilmiş işlemler view'ı
CREATE VIEW v_iptal_edilen_islemler 
WITH (security_invoker = true)
AS
SELECT 
  ig.*,
  t.ad_soyad as tamirci_ad_soyad,
  t.telefon as tamirci_tel
FROM islem_gecmisi ig
JOIN tamirciler t ON t.id = ig.tamirci_id
WHERE ig.islem_durumu = 'IPTAL'
ORDER BY ig.iptal_tarihi DESC;

-- Pasif (silinmiş) tamirciler view'ı
CREATE VIEW v_silinen_tamirciler 
WITH (security_invoker = true)
AS
SELECT 
  t.*,
  (
    SELECT COUNT(*) 
    FROM islem_gecmisi ig 
    WHERE ig.tamirci_id = t.id
  ) as toplam_islem_sayisi
FROM tamirciler t
WHERE t.is_active = false
ORDER BY t.deleted_at DESC;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Audit log RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT USING (true);
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT WITH CHECK (true);

-- Tamirciler politikaları
ALTER TABLE tamirciler ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tamirciler_select" ON tamirciler;
DROP POLICY IF EXISTS "tamirciler_insert" ON tamirciler;
DROP POLICY IF EXISTS "tamirciler_update" ON tamirciler;
CREATE POLICY "tamirciler_select" ON tamirciler FOR SELECT USING (true);
CREATE POLICY "tamirciler_insert" ON tamirciler FOR INSERT WITH CHECK (true);
CREATE POLICY "tamirciler_update" ON tamirciler FOR UPDATE USING (true);

-- İşlem geçmişi politikaları
ALTER TABLE islem_gecmisi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "islem_gecmisi_select" ON islem_gecmisi;
DROP POLICY IF EXISTS "islem_gecmisi_insert" ON islem_gecmisi;
DROP POLICY IF EXISTS "islem_gecmisi_update" ON islem_gecmisi;
CREATE POLICY "islem_gecmisi_select" ON islem_gecmisi FOR SELECT USING (true);
CREATE POLICY "islem_gecmisi_insert" ON islem_gecmisi FOR INSERT WITH CHECK (true);
CREATE POLICY "islem_gecmisi_update" ON islem_gecmisi FOR UPDATE USING (true);

-- İş ödemeleri politikaları
ALTER TABLE is_odemeleri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "is_odemeleri_select" ON is_odemeleri;
DROP POLICY IF EXISTS "is_odemeleri_insert" ON is_odemeleri;
DROP POLICY IF EXISTS "is_odemeleri_update" ON is_odemeleri;
CREATE POLICY "is_odemeleri_select" ON is_odemeleri FOR SELECT USING (true);
CREATE POLICY "is_odemeleri_insert" ON is_odemeleri FOR INSERT WITH CHECK (true);
CREATE POLICY "is_odemeleri_update" ON is_odemeleri FOR UPDATE USING (true);

-- İşlemler detay politikaları
ALTER TABLE islemler_detay ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "islemler_detay_select" ON islemler_detay;
DROP POLICY IF EXISTS "islemler_detay_insert" ON islemler_detay;
DROP POLICY IF EXISTS "islemler_detay_update" ON islemler_detay;
CREATE POLICY "islemler_detay_select" ON islemler_detay FOR SELECT USING (true);
CREATE POLICY "islemler_detay_insert" ON islemler_detay FOR INSERT WITH CHECK (true);
CREATE POLICY "islemler_detay_update" ON islemler_detay FOR UPDATE USING (true);

-- ========================================
-- TAMAMLANDI!
-- ========================================
-- 
-- Bu SQL dosyası şunları oluşturur:
-- 
-- TABLOLAR:
-- ✅ audit_log - Kara kutu, tüm değişiklikler kaydedilir
-- ✅ tamirciler - Müşteri bilgileri (soft delete destekli)
-- ✅ islem_gecmisi - İşlem kayıtları (iptal mekanizması destekli)
-- ✅ is_odemeleri - Ödeme kayıtları (iptal mekanizması destekli)
-- ✅ islemler_detay - İşlem detayları (otomatik senkronize)
--
-- TRİGGER'LAR:
-- ✅ Tamirci bilgisi otomatik doldurma
-- ✅ İşlem detayı otomatik oluşturma
-- ✅ Bakiye otomatik güncelleme
-- ✅ Audit log (INSERT, UPDATE kaydeder, DELETE engeller)
-- ✅ İşlem-Detay senkronizasyonu
--
-- VIEW'LAR (Güvenli):
-- ✅ v_tamirci_aktif_bakiye
-- ✅ v_iptal_edilen_islemler
-- ✅ v_silinen_tamirciler
--
-- GÜVENLİK:
-- ✅ RLS politikaları (DELETE yok!)
-- ✅ View'lar security_invoker ile korumalı
--
-- ÖNEMLİ KURALLAR:
-- ❌ Fiziksel silme (DELETE) veritabanı seviyesinde engellendi
-- ✅ Tamirci silmek: is_active = false
-- ✅ İşlem iptal etmek: islem_durumu = 'IPTAL'
-- ========================================
