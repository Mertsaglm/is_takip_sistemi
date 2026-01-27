'use client'

import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Tamirci } from '@/types/database'
import { Phone, Calendar, ArrowRight, Trash2 } from 'lucide-react'
import { deleteTamirci } from '@/app/actions'
import { useState } from 'react'

export default function CustomerCard({ tamirci }: { tamirci: Tamirci }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const bakiye = tamirci.toplam_borc
  
  // Negatif bakiye (fazla ödeme) = yeşil, pozitif (borç) = kırmızı
  const borcColor = bakiye > 0 
    ? 'text-debt-red' 
    : bakiye < 0 
    ? 'text-payment-green' 
    : 'text-ink-black/60'
  
  const displayAmount = bakiye < 0 ? Math.abs(bakiye) : bakiye
  const label = bakiye < 0 ? 'Kredi' : 'Bakiye'
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }
    
    setIsDeleting(true)
    try {
      await deleteTamirci(tamirci.id)
    } catch (error) {
      console.error('Silme hatası:', error)
      alert('Tamirci silinirken bir hata oluştu')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }
  
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(false)
  }
  
  return (
    <div className="relative">
      <Link
        href={`/tamirci/${tamirci.id}`}
        className="group block bg-white border-2 border-grid-line rounded-lg p-4 sm:p-6 hover:border-accent-blue hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
      >
        <div className="flex items-start justify-between mb-3 sm:mb-4 pr-8">
          <h3 className="text-xl sm:text-2xl font-mono font-bold text-ink-black group-hover:text-accent-blue transition-colors">
            {tamirci.ad_soyad}
          </h3>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-ink-black/40 group-hover:text-accent-blue group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
        </div>
        
        {tamirci.telefon && (
          <div className="flex items-center gap-2 text-ink-black/60 mb-3 sm:mb-4">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-mono text-xs sm:text-sm">{tamirci.telefon}</span>
          </div>
        )}
        
        <div className="flex items-baseline justify-between pt-3 sm:pt-4 border-t border-grid-line">
          <span className="text-xs sm:text-sm text-ink-black/60 font-semibold uppercase tracking-wide">{label}</span>
          <span className={`text-2xl sm:text-3xl font-mono font-bold ${borcColor}`}>
            {formatCurrency(displayAmount)}
          </span>
        </div>
        
        {tamirci.son_islem_tarihi && (
          <div className="flex items-center gap-2 text-xs text-ink-black/40 mt-3 sm:mt-4">
            <Calendar className="w-3 h-3" />
            <span>Son işlem: {formatDate(tamirci.son_islem_tarihi)}</span>
          </div>
        )}
      </Link>
      
      {/* Silme Butonu */}
      <div className="absolute top-3 right-3 z-10">
        {!showConfirm ? (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 bg-white/90 backdrop-blur-sm border border-grid-line rounded hover:border-debt-red hover:bg-debt-red/10 transition-all disabled:opacity-50 shadow-sm"
            title="Tamirciyi Sil"
          >
            <Trash2 className="w-3.5 h-3.5 text-debt-red" />
          </button>
        ) : (
          <div className="flex gap-1 bg-white/95 backdrop-blur-sm border border-debt-red rounded p-1 shadow-lg">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-2 py-0.5 bg-debt-red text-white text-[10px] font-semibold rounded hover:bg-debt-red/90 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isDeleting ? '...' : 'Sil'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className="px-2 py-0.5 bg-gray-200 text-ink-black text-[10px] font-semibold rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              X
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
