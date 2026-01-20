'use client'

import { useState } from 'react'
import { X, DollarSign, CheckCircle } from 'lucide-react'
import { Islem } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { addIsOdemesi, kapaPozisyon } from '@/app/actions'

type IsPaymentModalProps = {
  islem: Islem
  tamirciId: string
  onClose: () => void
}

export default function IsPaymentModal({ islem, tamirciId, onClose }: IsPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const kalanBorc = islem.kalan_borc || 0

  async function handlePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    const form = e.currentTarget
    const formData = new FormData(form)
    const tutar = parseFloat(formData.get('tutar') as string)
    
    try {
      await addIsOdemesi(islem.id, tamirciId, formData)
      
      // Eğer tam ödeme yapıldıysa modal'ı kapat
      if (tutar >= kalanBorc) {
        onClose()
      } else {
        // Kısmi ödeme yapıldıysa formu sıfırla
        form.reset()
      }
    } catch (error) {
      console.error('Hata:', error)
      alert('Ödeme eklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleKapaPozisyon() {
    if (!confirm(`Bu işin kalan borcu ${formatCurrency(kalanBorc)}.\n\nPozisyonu kapatırsanız bu borç affedilecek ve tamircinin toplam borcundan düşülecek.\n\nDevam etmek istiyor musunuz?`)) {
      return
    }

    setIsLoading(true)
    
    try {
      await kapaPozisyon(islem.id, tamirciId)
      onClose()
    } catch (error) {
      console.error('Hata:', error)
      alert('Pozisyon kapatılırken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full border-2 border-grid-line shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-mono font-bold text-ink-black">İşe Ödeme</h2>
          <button
            onClick={onClose}
            className="text-ink-black/60 hover:text-ink-black transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-grid-line">
          <p className="text-sm text-ink-black/60 mb-1">İş Açıklaması</p>
          <p className="font-semibold text-ink-black mb-3">{islem.aciklama}</p>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-ink-black/60">Toplam Tutar</p>
              <p className="text-lg font-mono font-bold text-ink-black">
                {formatCurrency(islem.tutar)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-black/60">Kalan Borç</p>
              <p className="text-2xl font-mono font-bold text-debt-red">
                {formatCurrency(kalanBorc)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4 mb-4">
          <div>
            <label htmlFor="tutar" className="block text-sm font-semibold text-ink-black mb-2 uppercase tracking-wide">
              Ödeme Tutarı (₺) *
            </label>
            <input
              type="number"
              id="tutar"
              name="tutar"
              required
              min="0"
              max={kalanBorc}
              step="0.01"
              autoFocus
              className="w-full px-4 py-3 text-2xl font-mono border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue transition-colors"
              placeholder="0.00"
            />
            <p className="text-xs text-ink-black/60 mt-1">
              Maksimum: {formatCurrency(kalanBorc)}
            </p>
          </div>

          <div>
            <label htmlFor="aciklama" className="block text-sm font-semibold text-ink-black mb-2 uppercase tracking-wide">
              Not (İsteğe Bağlı)
            </label>
            <input
              type="text"
              id="aciklama"
              name="aciklama"
              className="w-full px-4 py-3 text-lg border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue transition-colors"
              placeholder="Örn: Nakit ödeme"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-grid-line text-ink-black rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-payment-green hover:bg-payment-green/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              {isLoading ? 'Kaydediliyor...' : 'Ödeme Al'}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-grid-line">
          <button
            onClick={handleKapaPozisyon}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Pozisyonu Kapat (Borç Affı)
          </button>
          <p className="text-xs text-ink-black/60 text-center mt-2">
            Kalan {formatCurrency(kalanBorc)} affedilir ve iş kapatılır
          </p>
        </div>
      </div>
    </div>
  )
}
