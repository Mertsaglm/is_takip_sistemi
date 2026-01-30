import { createServerSupabaseClient } from '@/lib/supabase-server'
import TamircilerContainer from '@/components/tamirciler-container'
import AddCustomerButton from '@/components/add-customer-button'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  // Tüm aktif tamircileri getir (fuzzy search client-side yapılacak)
  const { data: tamirciler } = await supabase
    .from('tamirciler')
    .select('*')
    .eq('is_active', true)

  // Son işlem tarihine göre sırala
  const sortedTamirciler = tamirciler
    ? tamirciler.sort((a, b) => {
      const dateA = a.son_islem_tarihi || a.created_at
      const dateB = b.son_islem_tarihi || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    : []

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

        <TamircilerContainer
          tamirciler={sortedTamirciler}
          addButton={<AddCustomerButton />}
        />
      </div>
    </main>
  )
}


