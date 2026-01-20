'use client'

import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { createTamirci } from '@/app/actions'

export default function AddCustomerButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    const form = e.currentTarget
    
    try {
      const formData = new FormData(form)
      await createTamirci(formData)
      form.reset()
      setIsOpen(false)
    } catch (error) {
      console.error('Hata:', error)
      alert('Tamirci eklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg font-semibold text-lg flex items-center gap-2 transition-colors shadow-sm"
      >
        <UserPlus className="w-6 h-6" />
        Yeni Tamirci
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full border-2 border-grid-line shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-mono font-bold text-ink-black">Yeni Tamirci</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-ink-black/60 hover:text-ink-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="ad_soyad" className="block text-sm font-semibold text-ink-black mb-2 uppercase tracking-wide">
                  Tamirci Adı *
                </label>
                <input
                  type="text"
                  id="ad_soyad"
                  name="ad_soyad"
                  required
                  autoFocus
                  className="w-full px-4 py-3 text-2xl font-mono border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="Örn: Ahmet Yılmaz"
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
                  className="flex-1 px-4 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
