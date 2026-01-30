'use client'

import { useState } from 'react'
import { Islem } from '@/types/database'
import TransactionFilter, { FilterType } from './transaction-filter'
import TransactionList from './transaction-list'
import { Ban, Eye, EyeOff } from 'lucide-react'

type TransactionFilterWrapperProps = {
  islemler: Islem[]
  tamirciId: string
}

export default function TransactionFilterWrapper({ islemler, tamirciId }: TransactionFilterWrapperProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showIptalEdilen, setShowIptalEdilen] = useState(true)

  // İptal edilen işlem sayısı
  const iptalSayisi = islemler.filter(i => i.islem_durumu === 'IPTAL').length

  // Filtreleme fonksiyonu
  const filteredIslemler = islemler.filter((islem) => {
    const now = new Date()
    const islemDate = new Date(islem.created_at)

    switch (activeFilter) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return islemDate >= weekAgo

      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return islemDate >= monthAgo

      case 'is':
        return islem.islem_tipi === 'IS'

      case 'odeme':
        return islem.islem_tipi === 'ODEME'

      default:
        return true
    }
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <TransactionFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* İptal Edilenleri Göster/Gizle Toggle */}
        {iptalSayisi > 0 && (
          <button
            onClick={() => setShowIptalEdilen(!showIptalEdilen)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${showIptalEdilen
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
          >
            {showIptalEdilen ? (
              <>
                <EyeOff className="w-4 h-4" />
                İptalleri Gizle
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                İptalleri Göster
              </>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs ${showIptalEdilen
                ? 'bg-gray-200 text-gray-700'
                : 'bg-gray-600 text-white'
              }`}>
              {iptalSayisi}
            </span>
          </button>
        )}
      </div>

      <div className="bg-white border-2 border-grid-line rounded-lg overflow-hidden shadow-sm">
        <div className="bg-ink-black text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-mono font-bold">İşlem Geçmişi</h2>
          {iptalSayisi > 0 && showIptalEdilen && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Ban className="w-4 h-4" />
              <span>{iptalSayisi} iptal edilmiş işlem gösteriliyor</span>
            </div>
          )}
        </div>
        <TransactionList
          islemler={filteredIslemler}
          tamirciId={tamirciId}
          showIptalEdilen={showIptalEdilen}
        />
      </div>
    </>
  )
}
