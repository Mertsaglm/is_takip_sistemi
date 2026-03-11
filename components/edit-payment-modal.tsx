'use client'

import { useState } from 'react'
import { X, Edit2 } from 'lucide-react'
import { IsOdemesi } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { updateIsOdemesi } from '@/app/actions'

type EditPaymentModalProps = {
  odeme: IsOdemesi
  isId: string
  tamirciId: string
  maxTutar: number
  onClose: () => void
}

export default function EditPaymentModal({ odeme, isId, tamirciId, maxTutar, onClose }: EditPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [aciklama, setAciklama] = useState(odeme.aciklama || '')
  const [tutar, setTutar] = useState(odeme.tutar.toString())

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('aciklama', aciklama)
      formData.append('tutar', tutar)
      
      await updateIsOdemesi(odeme.id, isId, tamirciId, formData)
      onClose()
    } catch (error) {
      console.error('Hata:', error)
      alert('Ödeme güncellenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full border-2 border-grid-line shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-ink-black">Ödemeyi Düzenle</h2>
          <button
            onClick={onClose}
            className="text-ink-black/60 hover:text-ink-black transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tutar" className="block text-xs sm:text-sm font-semibold text-ink-black mb-2 uppercase tracking-wide">
              Ödeme Tutarı (₺) *
            </label>
            <input
              type="number"
              id="tutar"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              required
              min="0"
              max={maxTutar}
              step="0.01"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xl sm:text-2xl font-mono border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue transition-colors"
              placeholder="0.00"
            />
            <p className="text-xs text-ink-black/60 mt-1">
              Eski tutar: {formatCurrency(odeme.tutar)} | Maksimum: {formatCurrency(maxTutar)}
            </p>
          </div>

          <div>
            <label htmlFor="aciklama" className="block text-xs sm:text-sm font-semibold text-ink-black mb-2 uppercase tracking-wide">
              Not (İsteğe Bağlı)
            </label>
            <input
              type="text"
              id="aciklama"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue transition-colors"
              placeholder="Örn: Nakit ödeme"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-grid-line text-ink-black rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              {isLoading ? 'Kaydediliyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
