'use client'

import { Islem } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, CheckCircle2, Trash2 } from 'lucide-react'
import { useState, Fragment } from 'react'
import IsPaymentModal from './is-payment-modal'
import { deleteTransaction } from '@/app/actions'

export default function TransactionList({ 
  islemler, 
  tamirciId 
}: { 
  islemler: Islem[]
  tamirciId: string
}) {
  const [selectedIs, setSelectedIs] = useState<Islem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Islem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(islem: Islem) {
    setIsDeleting(true)
    try {
      await deleteTransaction(islem.id, tamirciId)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Silme hatası:', error)
      alert('İşlem silinirken hata oluştu')
    } finally {
      setIsDeleting(false)
    }
  }

  if (islemler.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center">
        <p className="text-xl sm:text-2xl text-ink-black/40 font-mono">
          Henüz işlem kaydı yok
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobil görünüm - Kartlar */}
      <div className="block lg:hidden space-y-4">
        {islemler.map((islem) => {
          const isDebt = islem.islem_tipi === 'IS'
          const kalanBorc = islem.kalan_borc || 0
          const isPaid = islem.pozisyon_kapali || kalanBorc <= 0
          const hasPayments = islem.odemeler && islem.odemeler.length > 0
          
          const rowColor = isPaid && isDebt 
            ? 'bg-payment-green/10' 
            : isDebt 
            ? 'bg-debt-red/5' 
            : 'bg-payment-green/5'
          
          const textColor = isPaid && isDebt
            ? 'text-payment-green'
            : isDebt 
            ? 'text-debt-red' 
            : 'text-payment-green'
          
          return (
            <div key={islem.id} className={`${rowColor} border-2 border-grid-line rounded-lg p-4 ${isPaid && isDebt ? 'opacity-75' : ''}`}>
              {/* Başlık ve Tip */}
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${textColor} font-semibold text-sm`}>
                  {isDebt ? (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      İş
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      Ödeme
                    </>
                  )}
                </div>
                <span className="text-xs text-ink-black/60 font-mono">
                  {formatDate(islem.created_at)}
                </span>
              </div>

              {/* Açıklama */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-base ${isPaid && isDebt ? 'line-through text-ink-black/60' : 'text-ink-black'}`}>
                    {islem.aciklama}
                  </span>
                  {isPaid && isDebt && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-payment-green text-white rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      ÖDENDİ
                    </span>
                  )}
                </div>
                
                {/* Ödemeler */}
                {hasPayments && (
                  <div className="mt-2 space-y-1">
                    {islem.odemeler!.map((odeme) => (
                      <div
                        key={odeme.id}
                        className="flex items-center gap-2 text-xs text-payment-green/80"
                      >
                        <TrendingDown className="w-3 h-3" />
                        <span className="font-mono font-semibold">
                          {formatCurrency(odeme.tutar)}
                        </span>
                        {odeme.aciklama && (
                          <>
                            <span className="text-ink-black/40">•</span>
                            <span className="text-ink-black/60">{odeme.aciklama}</span>
                          </>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs font-semibold text-payment-green pt-1 border-t border-payment-green/20">
                      <span>Toplam Ödenen:</span>
                      <span className="font-mono">
                        {formatCurrency(
                          islem.odemeler!.reduce((sum, o) => sum + o.tutar, 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tutar ve Kalan */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-grid-line">
                <div>
                  <span className="text-xs text-ink-black/60 uppercase tracking-wide">Tutar</span>
                  <p className={`text-xl font-mono font-bold ${isPaid && isDebt ? 'line-through text-ink-black/40' : textColor}`}>
                    {isDebt ? '+' : '-'}{formatCurrency(islem.tutar)}
                  </p>
                </div>
                {isDebt && (
                  <div className="text-right">
                    <span className="text-xs text-ink-black/60 uppercase tracking-wide">Kalan</span>
                    <p className={`text-xl font-mono font-bold ${kalanBorc > 0 ? 'text-debt-red' : 'text-payment-green'}`}>
                      {formatCurrency(kalanBorc)}
                      {kalanBorc === 0 && <CheckCircle2 className="inline w-4 h-4 ml-1" />}
                    </p>
                  </div>
                )}
              </div>

              {/* İşlem Butonu */}
              {isDebt && !isPaid && (
                <button
                  onClick={() => setSelectedIs(islem)}
                  className="w-full px-4 py-2 bg-payment-green hover:bg-payment-green/90 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  Ödeme Al
                </button>
              )}
              {isPaid && isDebt && (
                <div className="text-center text-xs text-payment-green font-semibold">
                  Tamamlandı
                </div>
              )}
              
              {/* Silme Butonu */}
              <button
                onClick={() => setDeleteConfirm(islem)}
                className="w-full mt-2 px-4 py-2 bg-debt-red/10 hover:bg-debt-red/20 text-debt-red rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sil
              </button>
            </div>
          )
        })}
      </div>

      {/* Desktop görünüm - Tablo */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-grid-line">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-ink-black uppercase tracking-wide">
                Tarih
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-ink-black uppercase tracking-wide">
                Tip
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-ink-black uppercase tracking-wide">
                Açıklama
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-ink-black uppercase tracking-wide">
                Tutar
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-ink-black uppercase tracking-wide">
                Kalan
              </th>
              <th className="px-6 py-4 text-center text-sm font-bold text-ink-black uppercase tracking-wide">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grid-line">
            {islemler.map((islem) => {
              const isDebt = islem.islem_tipi === 'IS'
              const kalanBorc = islem.kalan_borc || 0
              const isPaid = islem.pozisyon_kapali || kalanBorc <= 0
              const hasPayments = islem.odemeler && islem.odemeler.length > 0
              
              const rowColor = isPaid && isDebt 
                ? 'bg-payment-green/10' 
                : isDebt 
                ? 'bg-debt-red/5' 
                : 'bg-payment-green/5'
              
              const textColor = isPaid && isDebt
                ? 'text-payment-green'
                : isDebt 
                ? 'text-debt-red' 
                : 'text-payment-green'
              
              return (
                <Fragment key={islem.id}>
                  <tr className={`${rowColor} hover:bg-accent-blue/5 transition-colors ${isPaid && isDebt ? 'opacity-75' : ''}`}>
                    <td className="px-6 py-4 text-sm text-ink-black/60 font-mono whitespace-nowrap">
                      {formatDate(islem.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${textColor} font-semibold text-sm`}>
                        {isDebt ? (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            İş
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4" />
                            Ödeme
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-ink-black max-w-md">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={isPaid && isDebt ? 'line-through text-ink-black/60' : ''}>
                            {islem.aciklama}
                          </span>
                          {isPaid && isDebt && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-payment-green text-white rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              ÖDENDİ
                            </span>
                          )}
                        </div>
                        
                        {hasPayments && (
                          <div className="mt-2 space-y-1">
                            {islem.odemeler!.map((odeme) => (
                              <div
                                key={odeme.id}
                                className="flex items-center gap-2 text-xs text-payment-green/80"
                              >
                                <TrendingDown className="w-3 h-3" />
                                <span className="font-mono font-semibold">
                                  {formatCurrency(odeme.tutar)}
                                </span>
                                {odeme.aciklama && (
                                  <>
                                    <span className="text-ink-black/40">•</span>
                                    <span className="text-ink-black/60">{odeme.aciklama}</span>
                                  </>
                                )}
                                <span className="text-ink-black/40">•</span>
                                <span className="text-ink-black/40 font-mono">
                                  {formatDate(odeme.created_at)}
                                </span>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 text-xs font-semibold text-payment-green pt-1 border-t border-payment-green/20">
                              <span>Toplam Ödenen:</span>
                              <span className="font-mono">
                                {formatCurrency(
                                  islem.odemeler!.reduce((sum, o) => sum + o.tutar, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold text-lg ${isPaid && isDebt ? 'line-through text-ink-black/40' : textColor}`}>
                      {isDebt ? '+' : '-'}{formatCurrency(islem.tutar)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-lg">
                      {isDebt ? (
                        <span className={kalanBorc > 0 ? 'text-debt-red' : 'text-payment-green flex items-center justify-end gap-1'}>
                          {formatCurrency(kalanBorc)}
                          {kalanBorc === 0 && <CheckCircle2 className="w-4 h-4" />}
                        </span>
                      ) : (
                        <span className="text-ink-black/40">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isDebt && !isPaid && (
                        <button
                          onClick={() => setSelectedIs(islem)}
                          className="px-4 py-2 bg-payment-green hover:bg-payment-green/90 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          Ödeme Al
                        </button>
                      )}
                      {isPaid && isDebt && (
                        <span className="text-xs text-payment-green font-semibold">
                          Tamamlandı
                        </span>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(islem)}
                        className="ml-2 px-3 py-2 bg-debt-red/10 hover:bg-debt-red/20 text-debt-red rounded-lg font-semibold text-sm transition-colors inline-flex items-center gap-1"
                        title="İşlemi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedIs && (
        <IsPaymentModal
          islem={selectedIs}
          tamirciId={tamirciId}
          onClose={() => setSelectedIs(null)}
        />
      )}

      {/* Silme Onay Modalı */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border-2 border-debt-red shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-debt-red/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-debt-red" />
              </div>
              <h2 className="text-2xl font-mono font-bold text-ink-black">
                İşlemi Sil
              </h2>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-ink-black">
                Bu işlemi <strong>kalıcı olarak</strong> silmek istediğinize emin misiniz?
              </p>
              
              <div className="bg-gray-50 border-2 border-grid-line rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    deleteConfirm.islem_tipi === 'IS' ? 'text-debt-red' : 'text-payment-green'
                  }`}>
                    {deleteConfirm.islem_tipi === 'IS' ? (
                      <>
                        <TrendingUp className="w-3 h-3" />
                        İş
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3" />
                        Ödeme
                      </>
                    )}
                  </span>
                  <span className="text-xs text-ink-black/60 font-mono">
                    {formatDate(deleteConfirm.created_at)}
                  </span>
                </div>
                <p className="text-sm text-ink-black">{deleteConfirm.aciklama}</p>
                <p className="text-lg font-mono font-bold text-ink-black">
                  {deleteConfirm.islem_tipi === 'IS' ? '+' : '-'}{formatCurrency(deleteConfirm.tutar)}
                </p>
                {deleteConfirm.islem_tipi === 'IS' && deleteConfirm.odemeler && deleteConfirm.odemeler.length > 0 && (
                  <p className="text-xs text-debt-red font-semibold">
                    ⚠️ Bu işe ait {deleteConfirm.odemeler.length} ödeme kaydı da silinecek
                  </p>
                )}
              </div>

              <p className="text-sm text-ink-black/60">
                Bu işlem geri alınamaz. Toplam borç hesaplamaları otomatik olarak güncellenecektir.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border-2 border-grid-line text-ink-black rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-debt-red hover:bg-debt-red/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  'Siliniyor...'
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
