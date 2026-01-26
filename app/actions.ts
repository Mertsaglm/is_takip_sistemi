'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createTamirci(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('tamirciler')
    .insert({
      ad_soyad: formData.get('ad_soyad') as string,
      telefon: formData.get('telefon') as string || null
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
      pozisyon_kapali: false
    })
  
  if (error) throw error
  
  revalidatePath(`/tamirci/${tamirciId}`)
  revalidatePath('/')
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
      aciklama: formData.get('aciklama') as string || null
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

export async function deleteTransaction(islemId: string, tamirciId: string) {
  const supabase = await createServerSupabaseClient()
  
  // İşlemi ve ilişkili verileri al
  const { data: islem, error: fetchError } = await supabase
    .from('islem_gecmisi')
    .select('*, odemeler:is_odemeleri(*)')
    .eq('id', islemId)
    .single()
  
  if (fetchError || !islem) throw new Error('İşlem bulunamadı')
  
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
    // İş siliniyorsa: toplam borçtan kalan borcu düş
    yeniToplamBorc -= (islem.kalan_borc || 0)
  } else {
    // Ödeme siliniyorsa: toplam borca ödeme tutarını ekle (ödeme geri alınıyor)
    yeniToplamBorc += islem.tutar
  }
  
  // İş ödemelerini sil (varsa)
  if (islem.islem_tipi === 'IS' && islem.odemeler && islem.odemeler.length > 0) {
    const { error: odemeDeleteError } = await supabase
      .from('is_odemeleri')
      .delete()
      .eq('is_id', islemId)
    
    if (odemeDeleteError) throw odemeDeleteError
  }
  
  // İşlemi sil
  const { error: deleteError } = await supabase
    .from('islem_gecmisi')
    .delete()
    .eq('id', islemId)
  
  if (deleteError) throw deleteError
  
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
