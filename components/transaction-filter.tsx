'use client'

import { Calendar, TrendingUp, TrendingDown, List } from 'lucide-react'

export type FilterType = 'all' | 'week' | 'month' | 'is' | 'odeme'

type TransactionFilterProps = {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export default function TransactionFilter({ activeFilter, onFilterChange }: TransactionFilterProps) {
  const filters = [
    { id: 'all' as FilterType, label: 'Tümü', icon: List },
    { id: 'week' as FilterType, label: 'Son 1 Hafta', icon: Calendar },
    { id: 'month' as FilterType, label: 'Son 1 Ay', icon: Calendar },
    { id: 'is' as FilterType, label: 'Sadece İşler', icon: TrendingUp },
    { id: 'odeme' as FilterType, label: 'Sadece Ödemeler', icon: TrendingDown },
  ]

  return (
    <div className="bg-white border-2 border-grid-line rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id
          
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`
                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all
                ${isActive 
                  ? 'bg-accent-blue text-white shadow-md' 
                  : 'bg-gray-100 text-ink-black hover:bg-gray-200'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">{filter.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
