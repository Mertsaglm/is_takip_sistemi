'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useEffect, useRef } from 'react'

export default function SearchBar({ initialValue }: { initialValue?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  function handleSearch(term: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      if (term) {
        params.set('q', term)
      } else {
        params.delete('q')
      }
      router.push(`/?${params.toString()}`)
    })
  }
  
  return (
    <div className="relative">
      <Search className="absolute left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 text-ink-black/40 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Tamirci ara..."
        defaultValue={initialValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-11 sm:pl-13 md:pl-16 pr-4 sm:pr-6 py-3 sm:py-4 md:py-5 text-base sm:text-xl md:text-2xl font-mono bg-white border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue transition-colors shadow-sm"
        aria-label="Tamirci ara"
      />
      {isPending && (
        <div className="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
