'use client'

import { useState } from 'react'
import { addIslem } from '@/app/actions'

type TransactionFormProps = {
  tamirciId: string
  type: 'IS' | 'ODEME'
  label: string
  icon: React.ReactNode
  className: string
}

export default function TransactionForm({ 
  tamirciId, 
  type, 
  label, 
  icon, 
  className 
}: TransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    const form = e.currentTarget
    
    try {
      const formData = new FormData(form)
      formData.append('islem_tipi', type)
      await addIslem(tamirciId, formData)
      form.reset()
      setIsOpen(false)
    } catch (error) {
      console.error('Hata:', error)
      alert('İşlem eklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-sm ${className}`}
      >
        {icon}
        {label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full border-2 border-grid-line shadow-xl">
            <h2 className="text-3xl font-mono font-bold text-ink-black mb-6">
              {label}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="aciklama" className="block text-sm font-semibold text-ink-black mb-2 uppercase tracking-wide">
                  {type === 'IS' ? 'İş Açıklaması' : 'Ödeme Notu'} *
                </label>
                <textarea
                  id="aciklama"
                  name="aciklama"
                  required
                  rows={3}
                  className="w-full px-4 py-3 text-lg border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue transition-colors resize-none"
                  placeholder={type === 'IS' ? 'Örn: 2 disk değişimi, fren balatası' : 'Örn: Elden nakit ödeme'}
                />
              </div>

              <div>
                <label htmlFor="tutar" className="block text-sm font-semibold text-ink-black mb-2 uppercase tracking-wide">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  id="tutar"
                  name="tutar"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 text-2xl font-mono border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 border-2 border-grid-line text-ink-black rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${className}`}
                >
                  {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
