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
    <div className="bg-white border-2 border-grid-line rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id
          
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                ${isActive 
                  ? 'bg-accent-blue text-white shadow-md' 
                  : 'bg-gray-100 text-ink-black hover:bg-gray-200'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
