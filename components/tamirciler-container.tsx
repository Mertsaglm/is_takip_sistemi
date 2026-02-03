'use client'

import { useState, useMemo, useEffect, useRef, ReactNode } from 'react'
import Fuse from 'fuse.js'
import { Search, Eye, EyeOff } from 'lucide-react'
import CustomerCard from './customer-card'
import { Tamirci } from '@/types/database'

// Türkçe karakterleri normalize et
function normalizeTurkish(text: string): string {
    return text
        .toLocaleLowerCase('tr-TR')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
}

// Arama highlight fonksiyonu
function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query || query.length < 2) return text

    const normalizedText = normalizeTurkish(text)
    const normalizedQuery = normalizeTurkish(query)

    // Basit bir highlight yaklaşımı - query'nin parçalarını bul
    const words = query.trim().split(/\s+/)
    let result = text
    let highlighted = false

    for (const word of words) {
        if (word.length < 2) continue
        const normalizedWord = normalizeTurkish(word)

        // Orijinal metinde eşleşen kısmı bul
        let startIdx = 0
        const lowerText = normalizeTurkish(result)
        const matchIdx = lowerText.indexOf(normalizedWord, startIdx)

        if (matchIdx !== -1) {
            const before = text.substring(0, matchIdx)
            const match = text.substring(matchIdx, matchIdx + word.length)
            const after = text.substring(matchIdx + word.length)

            return (
                <>
                    {before}
                    <span className="bg-yellow-200 text-ink-black font-bold rounded px-0.5">
                        {match}
                    </span>
                    {after}
                </>
            )
        }
    }

    return text
}

interface TamircilerContainerProps {
    tamirciler: Tamirci[]
    addButton?: ReactNode
}

export default function TamircilerContainer({ tamirciler, addButton }: TamircilerContainerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isPending, setIsPending] = useState(false)
    const [hideBorclar, setHideBorclar] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // Fuse.js instance
    const fuse = useMemo(() => {
        // Normalize edilmiş veri ile Fuse oluştur
        const dataWithNormalized = tamirciler.map(t => ({
            ...t,
            ad_soyad_normalized: normalizeTurkish(t.ad_soyad)
        }))

        return new Fuse(dataWithNormalized, {
            keys: ['ad_soyad', 'ad_soyad_normalized'],
            threshold: 0.4,
            ignoreLocation: true,
            minMatchCharLength: 2,
            includeScore: true,
            findAllMatches: true,
        })
    }, [tamirciler])

    // Arama sonuçları
    const filteredTamirciler = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) {
            return tamirciler
        }

        const results = fuse.search(searchQuery)
        return results.map(result => result.item)
    }, [searchQuery, fuse, tamirciler])

    // Arama handler - debounce effect
    function handleSearch(term: string) {
        setIsPending(true)
        setSearchQuery(term)
        // Kısa bir delay sonra pending'i kapat
        setTimeout(() => setIsPending(false), 150)
    }

    return (
        <>
            {/* Search Bar + Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div key="search" className="flex-1 relative">
                    <Search className="absolute left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 text-ink-black/40 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 z-10" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tamirci ara... (akıllı arama)"
                        value={searchQuery}
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
                <button
                    key="toggle-hide"
                    onClick={() => setHideBorclar(!hideBorclar)}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 md:py-5 bg-white border-2 border-grid-line rounded-lg hover:border-accent-blue hover:bg-accent-blue/5 transition-all font-mono text-base sm:text-lg font-semibold text-ink-black shadow-sm"
                    title={hideBorclar ? 'Borçları Göster' : 'Borçları Gizle'}
                >
                    {hideBorclar ? (
                        <>
                            <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="hidden sm:inline">Gizli</span>
                        </>
                    ) : (
                        <>
                            <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="hidden sm:inline">Görünür</span>
                        </>
                    )}
                </button>
                <div key="add-button">
                    {addButton}
                </div>
            </div>

            {/* Arama ipucu */}
            {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-sm text-ink-black/50 -mt-4 mb-4">
                    En az 2 karakter girin...
                </p>
            )}

            {/* Sonuç sayısı */}
            {searchQuery.length >= 2 && (
                <p className="text-sm text-ink-black/60 mb-4 font-mono">
                    {filteredTamirciler.length} sonuç bulundu
                    {filteredTamirciler.length !== tamirciler.length && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="ml-2 text-accent-blue hover:underline"
                        >
                            Temizle
                        </button>
                    )}
                </p>
            )}

            {/* Tamirci Grid */}
            {filteredTamirciler.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTamirciler.map((tamirci) => (
                        <CustomerCard
                            key={tamirci.id}
                            tamirci={tamirci}
                            highlightText={searchQuery.length >= 2 ? searchQuery : undefined}
                            hideBakiye={hideBorclar}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white border-2 border-grid-line rounded-lg">
                    <p className="text-2xl text-ink-black/40 font-mono">
                        {searchQuery ? (
                            <>
                                &quot;{searchQuery}&quot; için sonuç bulunamadı
                                <br />
                                <span className="text-lg">Farklı bir arama deneyin</span>
                            </>
                        ) : (
                            'Henüz tamirci eklenmemiş'
                        )}
                    </p>
                </div>
            )}
        </>
    )
}
