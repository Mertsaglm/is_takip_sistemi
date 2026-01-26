'use client'

import { useState } from 'react'
import { Islem } from '@/types/database'
import TransactionFilter, { FilterType } from './transaction-filter'
import TransactionList from './transaction-list'

type TransactionFilterWrapperProps = {
  islemler: Islem[]
  tamirciId: string
}

export default function TransactionFilterWrapper({ islemler, tamirciId }: TransactionFilterWrapperProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

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
      <TransactionFilter 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      
      <div className="bg-white border-2 border-grid-line rounded-lg overflow-hidden shadow-sm">
        <div className="bg-ink-black text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-mono font-bold">İşlem Geçmişi</h2>
        </div>
        <TransactionList islemler={filteredIslemler} tamirciId={tamirciId} />
      </div>
    </>
  )
}
