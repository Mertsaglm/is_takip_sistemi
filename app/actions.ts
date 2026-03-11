'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createTamirci(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('tamirciler')
    .insert({
      ad_soyad: formData.get('ad_soyad') as string,
      telefon: formData.get('telefon') as string || null,
      is_active: true // Yeni tamirciler aktif olarak başlar
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  return data
}

export async function addIslem(tamirciId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  // Mevcut bakiyeyi al
  const { data: tamirci, error: fetchError } = await supabase
    .from('tamirciler')
    .select('toplam_borc')
    .eq('id', tamirciId)
    .single()

  if (fetchError || !tamirci) throw new Error('Tamirci bulunamadı')

  const tutar = parseFloat(formData.get('tutar') as string)
  const islemTipi = formData.get('islem_tipi') as 'IS' | 'ODEME'
  const eskiBakiye = tamirci.toplam_borc
  const yeniBakiye = islemTipi === 'IS'
    ? eskiBakiye + tutar
    : eskiBakiye - tutar

  const { error } = await supabase
    .from('islem_gecmisi')
    .insert({
      tamirci_id: tamirciId,
      islem_tipi: islemTipi,
      aciklama: formData.get('aciklama') as string,
      tutar,
      eski_bakiye: eskiBakiye,
      yeni_bakiye: yeniBakiye,
      kalan_borc: islemTipi === 'IS' ? tutar : 0,
      pozisyon_kapali: false,
      islem_durumu: 'AKTIF' // Yeni işlemler aktif olarak başlar
    })

  if (error) throw error

  revalidatePath(`/tamirci/${tamirciId}`)
  revalidatePath('/')
}

export async function updateIslem(islemId: string, tamirciId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  // Mevcut işlemi al
  const { data: mevcutIslem, error: fetchError } = await supabase
    .from('islem_gecmisi')
    .select('*, odemeler:is_odemeleri(*)')
    .eq('id', islemId)
    .single()

  if (fetchError || !mevcutIslem) throw new Error('İşlem bulunamadı')

  // İptal edilmiş işlemler düzenlenemez
  if (mevcutIslem.islem_durumu === 'IPTAL') {
    throw new Error('İptal edilmiş işlemler düzenlenemez')
  }

  const yeniTutar = parseFloat(formData.get('tutar') as string)
  const yeniAciklama = formData.get('aciklama') as string
  const eskiTutar = mevcutIslem.tutar
  const tutarFarki = yeniTutar - eskiTutar

  // Tamircinin mevcut toplam borcunu al
  const { data: tamirci, error: tamirciError } = await supabase
    .from('tamirciler')
    .select('toplam_borc')
    .eq('id', tamirciId)
    .single()

  if (tamirciError || !tamirci) throw new Error('Tamirci bulunamadı')

  // Yeni toplam borcu hesapla
  let yeniToplamBorc = tamirci.toplam_borc
  let yeniKalanBorc = mevcutIslem.kalan_borc || 0

  if (mevcutIslem.islem_tipi === 'IS') {
    // İş işlemi için: kalan borcu ve toplam borcu güncelle
    const toplamOdenen = mevcutIslem.odemeler
      ?.filter((o: { islem_durumu: string }) => o.islem_durumu === 'AKTIF')
      .reduce((sum: number, o: { tutar: number }) => sum + o.tutar, 0) || 0
    
    yeniKalanBorc = Math.max(0, yeniTutar - toplamOdenen)
    yeniToplamBorc = tamirci.toplam_borc + tutarFarki
  } else {
    // Ödeme işlemi için: sadece toplam borcu güncelle (ters yönde)
    yeniToplamBorc = tamirci.toplam_borc - tutarFarki
  }

  // İşlemi güncelle
  const { error: updateError } = await supabase
    .from('islem_gecmisi')
    .update({
      aciklama: yeniAciklama,
      tutar: yeniTutar,
      kalan_borc: mevcutIslem.islem_tipi === 'IS' ? yeniKalanBorc : null,
      pozisyon_kapali: mevcutIslem.islem_tipi === 'IS' ? yeniKalanBorc === 0 : mevcutIslem.pozisyon_kapali
    })
    .eq('id', islemId)

  if (updateError) throw updateError

  // Tamircinin toplam borcunu güncelle
  const { error: borcUpdateError } = await supabase
    .from('tamirciler')
    .update({ toplam_borc: yeniToplamBorc })
    .eq('id', tamirciId)

  if (borcUpdateError) throw borcUpdateError

  revalidatePath(`/tamirci/${tamirciId}`)
  revalidatePath('/')

  return { success: true, yeniToplamBorc }
}

export async function addIsOdemesi(isId: string, tamirciId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const tutar = parseFloat(formData.get('tutar') as string)

  // İşin mevcut kalan borcunu al
  const { data: is, error: fetchError } = await supabase
    .from('islem_gecmisi')
    .select('kalan_borc, tutar, tamirci_id')
    .eq('id', isId)
    .single()

  if (fetchError || !is) throw new Error('İş bulunamadı')

  const yeniKalanBorc = Math.max(0, (is.kalan_borc || 0) - tutar)

  // İş ödemesi kaydet
  const { error: odemeError } = await supabase
    .from('is_odemeleri')
    .insert({
      is_id: isId,
      tutar,
      aciklama: formData.get('aciklama') as string || null,
      islem_durumu: 'AKTIF' // Yeni ödemeler aktif olarak başlar
    })

  if (odemeError) throw odemeError

  // İşin kalan borcunu güncelle
  const { error: updateError } = await supabase
    .from('islem_gecmisi')
    .update({
      kalan_borc: yeniKalanBorc,
      pozisyon_kapali: yeniKalanBorc === 0
    })
    .eq('id', isId)

  if (updateError) throw updateError

  // Tamircinin toplam borcunu güncelle
  const { data: tamirci } = await supabase
    .from('tamirciler')
    .select('toplam_borc')
    .eq('id', tamirciId)
    .single()

  if (tamirci) {
    await supabase
      .from('tamirciler')
      .update({ toplam_borc: tamirci.toplam_borc - tutar })
      .eq('id', tamirciId)
  }

  revalidatePath(`/tamirci/${tamirciId}`)
  revalidatePath('/')
}

export async function updateIsOdemesi(odemeId: string, isId: string, tamirciId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  // Mevcut ödemeyi al
  const { data: mevcutOdeme, error: fetchError } = await supabase
    .from('is_odemeleri')
    .select('*')
    .eq('id', odemeId)
    .single()

  if (fetchError || !mevcutOdeme) throw new Error('Ödeme bulunamadı')

  // İptal edilmiş ödemeler düzenlenemez
  if (mevcutOdeme.islem_durumu === 'IPTAL') {
    throw new Error('İptal edilmiş ödemeler düzenlenemez')
  }

  const yeniTutar = parseFloat(formData.get('tutar') as string)
  const yeniAciklama = formData.get('aciklama') as string
  const eskiTutar = mevcutOdeme.tutar
  const tutarFarki = yeniTutar - eskiTutar

  // İşin mevcut kalan borcunu al
  const { data: is, error: isError } = await supabase
    .from('islem_gecmisi')
    .select('kalan_borc, tutar')
    .eq('id', isId)
    .single()

  if (isError || !is) throw new Error('İş bulunamadı')

  // Yeni kalan borcu hesapla (ödeme artarsa borç azalır, azalırsa borç artar)
  const yeniKalanBorc = Math.max(0, (is.kalan_borc || 0) - tutarFarki)

  // Ödemeyi güncelle
  const { error: updateError } = await supabase
    .from('is_odemeleri')
    .update({
      tutar: yeniTutar,
      aciklama: yeniAciklama || null
    })
    .eq('id', odemeId)

  if (updateError) throw updateError

  // İşin kalan borcunu güncelle
  const { error: isUpdateError } = await supabase
    .from('islem_gecmisi')
    .update({
      kalan_borc: yeniKalanBorc,
      pozisyon_kapali: yeniKalanBorc === 0
    })
    .eq('id', isId)

  if (isUpdateError) throw isUpdateError

  // Tamircinin toplam borcunu güncelle (ödeme artarsa borç azalır)
  const { data: tamirci } = await supabase
    .from('tamirciler')
    .select('toplam_borc')
    .eq('id', tamirciId)
    .single()

  if (tamirci) {
    await supabase
      .from('tamirciler')
      .update({ toplam_borc: tamirci.toplam_borc - tutarFarki })
      .eq('id', tamirciId)
  }

  revalidatePath(`/tamirci/${tamirciId}`)
  revalidatePath('/')

  return { success: true }
}

export async function kapaPozisyon(isId: string, tamirciId: string) {
  const supabase = await createServerSupabaseClient()

  // İşin kalan borcunu al
  const { data: is } = await supabase
    .from('islem_gecmisi')
    .select('kalan_borc')
    .eq('id', isId)
    .single()

  if (!is) throw new Error('İş bulunamadı')

  const kalanBorc = is.kalan_borc || 0

  // Pozisyonu kapat ve kalan borcu sıfırla
  const { error: updateError } = await supabase
    .from('islem_gecmisi')
    .update({
      pozisyon_kapali: true,
      kalan_borc: 0
    })
    .eq('id', isId)

  if (updateError) throw updateError

  // Eğer kalan borç varsa, tamircinin toplam borcundan düş
  // (Çünkü bu borç artık affediliyor/silinmiş sayılıyor)
  if (kalanBorc > 0) {
    const { data: tamirci } = await supabase
      .from('tamirciler')
      .select('toplam_borc')
      .eq('id', tamirciId)
      .single()

    if (tamirci) {
      await supabase
        .from('tamirciler')
        .update({ toplam_borc: tamirci.toplam_borc - kalanBorc })
        .eq('id', tamirciId)
    }
  }

  revalidatePath(`/tamirci/${tamirciId}`)
  revalidatePath('/')
}

// ========================================
// İPTAL İŞLEMLERİ (ESKİ SİLME YERİNE)
// ========================================

/**
 * İşlemi iptal et (eski deleteTransaction yerine)
 * Artık fiziksel silme yapmıyor, sadece iptal olarak işaretliyor
 */
export async function iptalTransaction(islemId: string, tamirciId: string, iptalNedeni?: string) {
  const supabase = await createServerSupabaseClient()

  // İşlemi ve ilişkili verileri al
  const { data: islem, error: fetchError } = await supabase
    .from('islem_gecmisi')
    .select('*, odemeler:is_odemeleri(*)')
    .eq('id', islemId)
    .single()

  if (fetchError || !islem) throw new Error('İşlem bulunamadı')

  // Zaten iptal edilmiş mi kontrol et
  if (islem.islem_durumu === 'IPTAL') {
    throw new Error('Bu işlem zaten iptal edilmiş')
  }

  // Tamircinin mevcut toplam borcunu al
  const { data: tamirci, error: tamirciError } = await supabase
    .from('tamirciler')
    .select('toplam_borc')
    .eq('id', tamirciId)
    .single()

  if (tamirciError || !tamirci) throw new Error('Tamirci bulunamadı')

  // Toplam borcu yeniden hesapla
  let yeniToplamBorc = tamirci.toplam_borc

  if (islem.islem_tipi === 'IS') {
    // İş iptal ediliyorsa: toplam borçtan kalan borcu düş
    yeniToplamBorc -= (islem.kalan_borc || 0)
  } else {
    // Ödeme iptal ediliyorsa: toplam borca ödeme tutarını ekle (ödeme geri alınıyor)
    yeniToplamBorc += islem.tutar
  }

  const now = new Date().toISOString()

  // İş ödemelerini de iptal et (varsa)
  if (islem.islem_tipi === 'IS' && islem.odemeler && islem.odemeler.length > 0) {
    const { error: odemeIptalError } = await supabase
      .from('is_odemeleri')
      .update({
        islem_durumu: 'IPTAL',
        iptal_nedeni: iptalNedeni ? `Ana iş iptal edildi: ${iptalNedeni}` : 'Ana iş iptal edildi',
        iptal_tarihi: now
      })
      .eq('is_id', islemId)

    if (odemeIptalError) throw odemeIptalError
  }

  // İşlemi iptal olarak işaretle (SİLME YOK!)
  const { error: iptalError } = await supabase
    .from('islem_gecmisi')
    .update({
      islem_durumu: 'IPTAL',
      iptal_nedeni: iptalNedeni,
      iptal_tarihi: now
    })
    .eq('id', islemId)

  if (iptalError) throw iptalError

  // Tamircinin toplam borcunu güncelle
  const { error: updateError } = await supabase
    .from('tamirciler')
    .update({ toplam_borc: yeniToplamBorc })
    .eq('id', tamirciId)

  if (updateError) throw updateError

  revalidatePath(`/tamirci/${tamirciId}`)
  revalidatePath('/')

  return { success: true, yeniToplamBorc }
}

/**
 * Ödemeyi iptal et
 */
export async function iptalOdeme(odemeId: string, isId: string, tamirciId: string, iptalNedeni?: string) {
  const supabase = await createServerSupabaseClient()

  // Ödemeyi al
  const { data: odeme, error: fetchError } = await supabase
    .from('is_odemeleri')
    .select('*')
    .eq('id', odemeId)
    .single()

  if (fetchError || !odeme) throw new Error('Ödeme bulunamadı')

  // Zaten iptal edilmiş mi kontrol et
  if (odeme.islem_durumu === 'IPTAL') {
    throw new Error('Bu ödeme zaten iptal edilmiş')
  }

  const now = new Date().toISOString()

  // Ödemeyi iptal olarak işaretle
  const { error: iptalError } = await supabase
    .from('is_odemeleri')
    .update({
      islem_durumu: 'IPTAL',
      iptal_nedeni: iptalNedeni,
      iptal_tarihi: now
    })
    .eq('id', odemeId)

  if (iptalError) throw iptalError

  // İşin kalan borcunu güncelle (ödeme geri alındığı için artar)
  const { data: is } = await supabase
    .from('islem_gecmisi')
    .select('kalan_borc')
    .eq('id', isId)
    .single()

  if (is) {
    const yeniKalanBorc = (is.kalan_borc || 0) + odeme.tutar
    await supabase
      .from('islem_gecmisi')
      .update({
        kalan_borc: yeniKalanBorc,
        pozisyon_kapali: false // Borç geri geldiği için pozisyon açılır
      })
      .eq('id', isId)
  }

  // Tamircinin toplam borcunu güncelle (ödeme iptal = borç artar)
  const { data: tamirci } = await supabase
    .from('tamirciler')
    .select('toplam_borc')
    .eq('id', tamirciId)
    .single()

  if (tamirci) {
    await supabase
      .from('tamirciler')
      .update({ toplam_borc: tamirci.toplam_borc + odeme.tutar })
      .eq('id', tamirciId)
  }

  revalidatePath(`/tamirci/${tamirciId}`)
  revalidatePath('/')

  return { success: true }
}

/**
 * Tamirciyi pasif yap (eski deleteTamirci yerine)
 * Artık fiziksel silme yapmıyor, sadece pasif olarak işaretliyor
 */
export async function pasifTamirci(tamirciId: string, pasifNedeni?: string) {
  const supabase = await createServerSupabaseClient()

  const now = new Date().toISOString()

  // Tamirciyi pasif olarak işaretle (SİLME YOK!)
  const { error } = await supabase
    .from('tamirciler')
    .update({
      is_active: false,
      deleted_at: now,
      deleted_reason: pasifNedeni
    })
    .eq('id', tamirciId)

  if (error) {
    console.error('Tamirci pasif yapma hatası:', error)
    throw new Error(`Tamirci pasif yapılırken hata oluştu: ${error.message}`)
  }

  revalidatePath('/')

  return { success: true }
}

/**
 * Pasif tamirciyi tekrar aktif yap
 */
export async function aktiveTamirci(tamirciId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('tamirciler')
    .update({
      is_active: true,
      deleted_at: null,
      deleted_reason: null
    })
    .eq('id', tamirciId)

  if (error) {
    console.error('Tamirci aktif yapma hatası:', error)
    throw new Error(`Tamirci aktif yapılırken hata oluştu: ${error.message}`)
  }

  revalidatePath('/')

  return { success: true }
}

// ========================================
// GERİYE DÖNÜK UYUMLULUK (DEPRECATED)
// ========================================
// Bu fonksiyonlar artık kullanılmamalı ama
// eski kodlarla uyumluluk için hata vermeden çalışır

/**
 * @deprecated iptalTransaction kullanın
 */
export async function deleteTransaction(islemId: string, tamirciId: string) {
  console.warn('⚠️ deleteTransaction deprecated! iptalTransaction kullanın.')
  // Varsayılan bir iptal nedeni ile iptal et
  return iptalTransaction(islemId, tamirciId, 'Kullanıcı tarafından iptal edildi')
}

/**
 * @deprecated pasifTamirci kullanın
 */
export async function deleteTamirci(tamirciId: string) {
  console.warn('⚠️ deleteTamirci deprecated! pasifTamirci kullanın.')
  // Varsayılan bir neden ile pasif yap
  return pasifTamirci(tamirciId, 'Kullanıcı tarafından kaldırıldı')
}
