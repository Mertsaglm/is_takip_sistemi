export type Tamirci = {
  id: string
  created_at: string
  ad_soyad: string
  telefon: string | null
  toplam_borc: number
  son_islem_tarihi: string | null
  version: number
}

export type Islem = {
  id: string
  created_at: string
  tamirci_id: string
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
}

export type IsOdemesi = {
  id: string
  created_at: string
  is_id: string
  tutar: number
  aciklama: string | null
}
