import { createServerSupabaseClient } from '@/lib/supabase-server'
import SearchBar from '@/components/search-bar'
import CustomerCard from '@/components/customer-card'
import AddCustomerButton from '@/components/add-customer-button'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()

  // Sadece aktif (silinmemiş) tamircileri getir
  let query = supabase
    .from('tamirciler')
    .select('*')
    .eq('is_active', true) // Sadece aktif olanlar

  if (params.q) {
    query = query.ilike('ad_soyad', `%${params.q}%`)
  }

  let { data: tamirciler } = await query

  // Client-side sıralama: son_islem_tarihi varsa onu, yoksa created_at kullan
  if (tamirciler) {
    tamirciler = tamirciler.sort((a, b) => {
      const dateA = a.son_islem_tarihi || a.created_at
      const dateB = b.son_islem_tarihi || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-ledger-paper">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-mono font-bold mb-2 sm:mb-3 text-ink-black">
            İş Takip Sistemi
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-ink-black/60">
            Tamirci borç-alacak takibi
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <SearchBar initialValue={params.q} />
          </div>
          <AddCustomerButton />
        </div>

        {tamirciler && tamirciler.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tamirciler.map((tamirci) => (
              <CustomerCard key={tamirci.id} tamirci={tamirci} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border-2 border-grid-line rounded-lg">
            <p className="text-2xl text-ink-black/40 font-mono">
              {params.q ? 'Tamirci bulunamadı' : 'Henüz tamirci eklenmemiş'}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
