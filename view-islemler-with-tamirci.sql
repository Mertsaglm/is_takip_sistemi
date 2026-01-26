-- İşlem Geçmişi + Tamirci Adı View
-- Bu SQL'i Supabase SQL Editor'de çalıştır

-- Mevcut view'i varsa sil
DROP VIEW IF EXISTS islemler_detay;

-- Yeni view oluştur
CREATE VIEW islemler_detay AS
SELECT 
  ig.id,
  ig.created_at,
  ig.tamirci_id,
  t.ad_soyad as tamirci_adi,
  t.telefon as tamirci_telefon,
  ig.islem_no,
  ig.islem_tipi,
  ig.aciklama,
  ig.tutar,
  ig.eski_bakiye,
  ig.yeni_bakiye,
  ig.kalan_borc,
  ig.pozisyon_kapali,
  ig.iptal_edilen_islem_id
FROM 
  islem_gecmisi ig
  LEFT JOIN tamirciler t ON ig.tamirci_id = t.id
ORDER BY 
  ig.created_at DESC;

-- RLS politikası ekle
ALTER VIEW islemler_detay SET (security_invoker = true);

-- View oluşturuldu!
-- Artık "islemler_detay" tablosunu Table Editor'de görebilirsin.
