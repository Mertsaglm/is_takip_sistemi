'use client'

import { Islem } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'
import { useState, Fragment } from 'react'
import IsPaymentModal from './is-payment-modal'

export default function TransactionList({ 
  islemler, 
  tamirciId 
}: { 
  islemler: Islem[]
  tamirciId: string
}) {
  const [selectedIs, setSelectedIs] = useState<Islem | null>(null)

  if (islemler.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-2xl text-ink-black/40 font-mono">
          Henüz işlem kaydı yok
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
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
              
              // Kapalı işler için farklı stil
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
                        
                        {/* Ödemeler - İşin altında küçük gösterim */}
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
    </>
  )
}
