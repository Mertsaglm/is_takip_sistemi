import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Tamirci } from '@/types/database'
import { Phone, Calendar, ArrowRight } from 'lucide-react'

export default function CustomerCard({ tamirci }: { tamirci: Tamirci }) {
  const bakiye = tamirci.toplam_borc
  
  // Negatif bakiye (fazla ödeme) = yeşil, pozitif (borç) = kırmızı
  const borcColor = bakiye > 0 
    ? 'text-debt-red' 
    : bakiye < 0 
    ? 'text-payment-green' 
    : 'text-ink-black/60'
  
  const displayAmount = bakiye < 0 ? Math.abs(bakiye) : bakiye
  const label = bakiye < 0 ? 'Kredi' : 'Bakiye'
  
  return (
    <Link
      href={`/tamirci/${tamirci.id}`}
      className="group block bg-white border-2 border-grid-line rounded-lg p-6 hover:border-accent-blue hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-2xl font-mono font-bold text-ink-black group-hover:text-accent-blue transition-colors">
          {tamirci.ad_soyad}
        </h3>
        <ArrowRight className="w-5 h-5 text-ink-black/40 group-hover:text-accent-blue group-hover:translate-x-1 transition-all" />
      </div>
      
      {tamirci.telefon && (
        <div className="flex items-center gap-2 text-ink-black/60 mb-4">
          <Phone className="w-4 h-4" />
          <span className="font-mono text-sm">{tamirci.telefon}</span>
        </div>
      )}
      
      <div className="flex items-baseline justify-between pt-4 border-t border-grid-line">
        <span className="text-sm text-ink-black/60 font-semibold uppercase tracking-wide">{label}</span>
        <span className={`text-3xl font-mono font-bold ${borcColor}`}>
          {formatCurrency(displayAmount)}
        </span>
      </div>
      
      {tamirci.son_islem_tarihi && (
        <div className="flex items-center gap-2 text-xs text-ink-black/40 mt-4">
          <Calendar className="w-3 h-3" />
          <span>Son işlem: {formatDate(tamirci.son_islem_tarihi)}</span>
        </div>
      )}
    </Link>
  )
}
