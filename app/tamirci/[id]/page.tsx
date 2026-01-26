import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCurrency } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, Phone } from 'lucide-react'
import Link from 'next/link'
import TransactionForm from '@/components/transaction-form'
import TransactionList from '@/components/transaction-list'
import TransactionFilter from '@/components/transaction-filter-wrapper'

export default async function TamirciPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  
  const { data: tamirci } = await supabase
    .from('tamirciler')
    .select('*')
    .eq('id', id)
    .single()
  
  if (!tamirci) notFound()
  
  const { data: islemler } = await supabase
    .from('islem_gecmisi')
    .select('*')
    .eq('tamirci_id', id)
    .order('created_at', { ascending: true })
  
  // Her iş için ödemeleri al
  const islemlerWithPayments = await Promise.all(
    (islemler || []).map(async (islem) => {
      if (islem.islem_tipi === 'IS') {
        const { data: odemeler } = await supabase
          .from('is_odemeleri')
          .select('*')
          .eq('is_id', islem.id)
          .order('created_at', { ascending: true })
        
        return { ...islem, odemeler: odemeler || [] }
      }
      return { ...islem, odemeler: [] }
    })
  )
  
  const borcColor = tamirci.toplam_borc > 0 
    ? 'text-debt-red bg-debt-red/10 border-debt-red' 
    : tamirci.toplam_borc < 0 
    ? 'text-payment-green bg-payment-green/10 border-payment-green' 
    : 'text-ink-black/60 bg-gray-100 border-gray-300'
  
  const borcLabel = tamirci.toplam_borc > 0 
    ? 'Borç' 
    : tamirci.toplam_borc < 0 
    ? 'Kredi' 
    : 'Dengede'
  
  const displayAmount = tamirci.toplam_borc < 0 ? Math.abs(tamirci.toplam_borc) : tamirci.toplam_borc
  
  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-ledger-paper">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ink-black/60 hover:text-ink-black mb-4 sm:mb-6 md:mb-8 transition-colors text-base sm:text-lg"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Geri Dön</span>
        </Link>
        
        <div className="bg-white border-2 border-grid-line rounded-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mono font-bold text-ink-black mb-2 sm:mb-3 break-words">
                {tamirci.ad_soyad}
              </h1>
              {tamirci.telefon && (
                <div className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-ink-black/60">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-mono">{tamirci.telefon}</span>
                </div>
              )}
            </div>
            
            <div className={`border-2 rounded-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 ${borcColor} shadow-sm flex-shrink-0`}>
              <p className="text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">{borcLabel}</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold">
                {formatCurrency(displayAmount)}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <TransactionForm
              tamirciId={tamirci.id}
              type="IS"
              label="İş Ekle"
              icon={<TrendingUp className="w-5 h-5" />}
              className="bg-debt-red hover:bg-debt-red/90 text-white"
            />
            <TransactionForm
              tamirciId={tamirci.id}
              type="ODEME"
              label="Ödeme Al"
              icon={<TrendingDown className="w-5 h-5" />}
              className="bg-payment-green hover:bg-payment-green/90 text-white"
            />
          </div>
        </div>
        
        <TransactionFilter islemler={islemlerWithPayments} tamirciId={tamirci.id} />
      </div>
    </main>
  )
}
