// İşlem durumu tipi
export type IslemDurumu = 'AKTIF' | 'IPTAL' | 'DUZELTME'

export type Tamirci = {
  id: string
  created_at: string
  ad_soyad: string
  telefon: string | null
  toplam_borc: number
  son_islem_tarihi: string | null
  version: number
  // Yeni soft delete alanları
  is_active: boolean
  deleted_at: string | null
  deleted_reason: string | null
}

export type Islem = {
  id: string
  created_at: string
  tamirci_id: string
  tamirci_adi: string | null
  tamirci_telefon: string | null
  islem_no: number | null
  islem_tipi: 'IS' | 'ODEME'
  aciklama: string
  tutar: number
  eski_bakiye: number
  yeni_bakiye: number
  iptal_edilen_islem_id: string | null
  kalan_borc: number | null
  pozisyon_kapali: boolean
  odemeler?: IsOdemesi[]
  // Yeni iptal alanları
  islem_durumu: IslemDurumu
  iptal_nedeni: string | null
  iptal_tarihi: string | null
}

export type IsOdemesi = {
  id: string
  created_at: string
  is_id: string
  tutar: number
  aciklama: string | null
  // Yeni iptal alanları
  islem_durumu: 'AKTIF' | 'IPTAL'
  iptal_nedeni: string | null
  iptal_tarihi: string | null
}

export type IslemlerDetay = {
  id: string
  created_at: string
  islem_id: string
  tamirci_adi: string
  islem_tipi: 'IS' | 'ODEME'
  aciklama: string
  tutar: number
  eski_bakiye: number
  yeni_bakiye: number
  kalan_borc: number
  // Yeni iptal alanları
  islem_durumu: IslemDurumu
  iptal_nedeni: string | null
  iptal_tarihi: string | null
}

// Audit log tipi
export type AuditLog = {
  id: string
  created_at: string
  tablo_adi: string
  kayit_id: string
  islem_tipi: 'INSERT' | 'UPDATE' | 'DELETE' | 'IPTAL' | 'PASIF'
  eski_veri: Record<string, unknown> | null
  yeni_veri: Record<string, unknown> | null
  aciklama: string | null
  kullanici: string
  metadata: Record<string, unknown> | null
}
