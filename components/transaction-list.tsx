'use client'

import { Islem, IsOdemesi } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Ban } from 'lucide-react'
import { useState, Fragment } from 'react'
import IsPaymentModal from './is-payment-modal'
import EditTransactionModal from './edit-transaction-modal'
import EditPaymentModal from './edit-payment-modal'
import { iptalTransaction, iptalOdeme } from '@/app/actions'

export default function TransactionList({
  islemler,
  tamirciId,
  showIptalEdilen = true
}: {
  islemler: Islem[]
  tamirciId: string
  showIptalEdilen?: boolean
}) {
  const [selectedIs, setSelectedIs] = useState<Islem | null>(null)
  const [editingIslem, setEditingIslem] = useState<Islem | null>(null)
  const [editingOdeme, setEditingOdeme] = useState<{ odeme: IsOdemesi; islem: Islem } | null>(null)
  const [iptalConfirm, setIptalConfirm] = useState<Islem | null>(null)
  const [iptalOdemeConfirm, setIptalOdemeConfirm] = useState<{ odeme: IsOdemesi; islem: Islem } | null>(null)
  const [iptalNedeni, setIptalNedeni] = useState('')
  const [isIptalEtme, setIsIptalEtme] = useState(false)

  // İptal edilenleri filtrele (opsiyonel)
  const filteredIslemler = showIptalEdilen
    ? islemler
    : islemler.filter(i => i.islem_durumu !== 'IPTAL')

  async function handleIptal(islem: Islem) {
    setIsIptalEtme(true)
    try {
      // iptalNedeni boş olabilir (opsiyonel)
      await iptalTransaction(islem.id, tamirciId, iptalNedeni || '')
      setIptalConfirm(null)
      setIptalNedeni('')
    } catch (error) {
      console.error('İptal hatası:', error)
      alert('İşlem iptal edilirken hata oluştu')
    } finally {
      setIsIptalEtme(false)
    }
  }

  async function handleIptalOdeme(odeme: IsOdemesi, islem: Islem) {
    setIsIptalEtme(true)
    try {
      await iptalOdeme(odeme.id, islem.id, tamirciId, iptalNedeni || '')
      setIptalOdemeConfirm(null)
      setIptalNedeni('')
    } catch (error) {
      console.error('Ödeme iptal hatası:', error)
      alert('Ödeme iptal edilirken hata oluştu')
    } finally {
      setIsIptalEtme(false)
    }
  }

  if (filteredIslemler.length === 0) {
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
        {filteredIslemler.map((islem) => {
          const isDebt = islem.islem_tipi === 'IS'
          const kalanBorc = islem.kalan_borc || 0
          const isPaid = islem.pozisyon_kapali || kalanBorc <= 0
          const hasPayments = islem.odemeler && islem.odemeler.filter(o => o.islem_durumu === 'AKTIF').length > 0
          const isIptal = islem.islem_durumu === 'IPTAL'

          // İptal edilen işlemler için özel stil
          const rowColor = isIptal
            ? 'bg-gray-100 border-gray-300'
            : isPaid && isDebt
              ? 'bg-payment-green/10'
              : isDebt
                ? 'bg-debt-red/5'
                : 'bg-payment-green/5'

          const textColor = isIptal
            ? 'text-gray-400'
            : isPaid && isDebt
              ? 'text-payment-green'
              : isDebt
                ? 'text-debt-red'
                : 'text-payment-green'

          return (
            <div
              key={islem.id}
              className={`${rowColor} border-2 border-grid-line rounded-lg p-4 ${isIptal ? 'opacity-60' : ''} ${isPaid && isDebt && !isIptal ? 'opacity-75' : ''}`}
            >
              {/* İptal Badge */}
              {isIptal && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-200 rounded-lg">
                  <Ban className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase">İptal Edildi</span>
                  {islem.iptal_tarihi && (
                    <span className="text-xs text-gray-500 ml-auto font-mono">
                      {formatDate(islem.iptal_tarihi)}
                    </span>
                  )}
                </div>
              )}

              {/* İptal Nedeni */}
              {isIptal && islem.iptal_nedeni && (
                <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>Neden:</strong> {islem.iptal_nedeni}
                </div>
              )}

              {/* Başlık ve Tip */}
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${textColor} font-semibold text-sm ${isIptal ? 'line-through' : ''}`}>
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
                  <span className={`text-base ${isIptal || (isPaid && isDebt) ? 'line-through text-ink-black/60' : 'text-ink-black'}`}>
                    {islem.aciklama}
                  </span>
                  {!isIptal && isPaid && isDebt && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-payment-green text-white rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      ÖDENDİ
                    </span>
                  )}
                </div>

                {/* Ödemeler */}
                {hasPayments && !isIptal && (
                  <div className="mt-2 space-y-1">
                    {islem.odemeler!.filter(o => o.islem_durumu === 'AKTIF').map((odeme) => (
                      <div key={odeme.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-payment-green/80">
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
                        <div className="flex gap-1 ml-5">
                          <button
                            onClick={() => setEditingOdeme({ odeme, islem })}
                            className="px-2 py-1 bg-accent-blue hover:bg-accent-blue/90 text-white rounded text-xs"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => setIptalOdemeConfirm({ odeme, islem })}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            İptal
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs font-semibold text-payment-green pt-1 border-t border-payment-green/20">
                      <span>Toplam Ödenen:</span>
                      <span className="font-mono">
                        {formatCurrency(
                          islem.odemeler!.filter(o => o.islem_durumu === 'AKTIF').reduce((sum, o) => sum + o.tutar, 0)
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
                  <p className={`text-xl font-mono font-bold ${isIptal || (isPaid && isDebt) ? 'line-through text-ink-black/40' : textColor}`}>
                    {isDebt ? '+' : '-'}{formatCurrency(islem.tutar)}
                  </p>
                </div>
                {isDebt && !isIptal && (
                  <div className="text-right">
                    <span className="text-xs text-ink-black/60 uppercase tracking-wide">Kalan</span>
                    <p className={`text-xl font-mono font-bold ${kalanBorc > 0 ? 'text-debt-red' : 'text-payment-green'}`}>
                      {formatCurrency(kalanBorc)}
                      {kalanBorc === 0 && <CheckCircle2 className="inline w-4 h-4 ml-1" />}
                    </p>
                  </div>
                )}
              </div>

              {/* İşlem Butonları - Sadece aktif işlemler için */}
              {!isIptal && (
                <>
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

                  {/* Düzenle ve İptal Butonları */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setEditingIslem(islem)}
                      className="flex-1 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg font-semibold text-sm transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => setIptalConfirm(islem)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      İptal Et
                    </button>
                  </div>
                </>
              )}

              {/* İptal edilmiş işlemler için bilgi */}
              {isIptal && (
                <div className="text-center text-xs text-gray-500 font-medium py-2">
                  Bu işlem iptal edilmiştir
                </div>
              )}
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
                Durum
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
            {filteredIslemler.map((islem) => {
              const isDebt = islem.islem_tipi === 'IS'
              const kalanBorc = islem.kalan_borc || 0
              const isPaid = islem.pozisyon_kapali || kalanBorc <= 0
              const hasPayments = islem.odemeler && islem.odemeler.filter(o => o.islem_durumu === 'AKTIF').length > 0
              const isIptal = islem.islem_durumu === 'IPTAL'

              const rowColor = isIptal
                ? 'bg-gray-50'
                : isPaid && isDebt
                  ? 'bg-payment-green/10'
                  : isDebt
                    ? 'bg-debt-red/5'
                    : 'bg-payment-green/5'

              const textColor = isIptal
                ? 'text-gray-400'
                : isPaid && isDebt
                  ? 'text-payment-green'
                  : isDebt
                    ? 'text-debt-red'
                    : 'text-payment-green'

              return (
                <Fragment key={islem.id}>
                  <tr className={`${rowColor} hover:bg-accent-blue/5 transition-colors ${isIptal ? 'opacity-60' : ''} ${isPaid && isDebt && !isIptal ? 'opacity-75' : ''}`}>
                    <td className="px-6 py-4 text-sm text-ink-black/60 font-mono whitespace-nowrap">
                      {formatDate(islem.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {isIptal ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                          <Ban className="w-3 h-3" />
                          İPTAL
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          AKTİF
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${textColor} font-semibold text-sm ${isIptal ? 'line-through' : ''}`}>
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
                          <span className={isIptal || (isPaid && isDebt) ? 'line-through text-ink-black/60' : ''}>
                            {islem.aciklama}
                          </span>
                          {!isIptal && isPaid && isDebt && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-payment-green text-white rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              ÖDENDİ
                            </span>
                          )}
                        </div>

                        {/* İptal Nedeni */}
                        {isIptal && islem.iptal_nedeni && (
                          <div className="mt-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded inline-block">
                            <strong>Neden:</strong> {islem.iptal_nedeni}
                          </div>
                        )}

                        {hasPayments && !isIptal && (
                          <div className="mt-2 space-y-1">
                            {islem.odemeler!.filter(o => o.islem_durumu === 'AKTIF').map((odeme) => (
                              <div key={odeme.id} className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-payment-green/80">
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
                                <div className="flex gap-1 ml-5">
                                  <button
                                    onClick={() => setEditingOdeme({ odeme, islem })}
                                    className="px-2 py-1 bg-accent-blue hover:bg-accent-blue/90 text-white rounded text-xs"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => setIptalOdemeConfirm({ odeme, islem })}
                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs flex items-center gap-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    İptal
                                  </button>
                                </div>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 text-xs font-semibold text-payment-green pt-1 border-t border-payment-green/20">
                              <span>Toplam Ödenen:</span>
                              <span className="font-mono">
                                {formatCurrency(
                                  islem.odemeler!.filter(o => o.islem_durumu === 'AKTIF').reduce((sum, o) => sum + o.tutar, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold text-lg ${isIptal || (isPaid && isDebt) ? 'line-through text-ink-black/40' : textColor}`}>
                      {isDebt ? '+' : '-'}{formatCurrency(islem.tutar)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-lg">
                      {isDebt && !isIptal ? (
                        <span className={kalanBorc > 0 ? 'text-debt-red' : 'text-payment-green flex items-center justify-end gap-1'}>
                          {formatCurrency(kalanBorc)}
                          {kalanBorc === 0 && <CheckCircle2 className="w-4 h-4" />}
                        </span>
                      ) : isIptal ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <span className="text-ink-black/40">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!isIptal && (
                        <>
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
                            onClick={() => setEditingIslem(islem)}
                            className="ml-2 px-3 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg font-semibold text-sm transition-colors"
                            title="İşlemi Düzenle"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => setIptalConfirm(islem)}
                            className="ml-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-semibold text-sm transition-colors inline-flex items-center gap-1"
                            title="İşlemi İptal Et"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {isIptal && (
                        <span className="text-xs text-gray-500">
                          İptal edildi
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

      {editingIslem && (
        <EditTransactionModal
          islem={editingIslem}
          tamirciId={tamirciId}
          onClose={() => setEditingIslem(null)}
        />
      )}

      {editingOdeme && (
        <EditPaymentModal
          odeme={editingOdeme.odeme}
          isId={editingOdeme.islem.id}
          tamirciId={tamirciId}
          maxTutar={(editingOdeme.islem.kalan_borc || 0) + editingOdeme.odeme.tutar}
          onClose={() => setEditingOdeme(null)}
        />
      )}

      {/* İptal Onay Modalı */}
      {iptalConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border-2 border-gray-300 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-gray-600" />
              </div>
              <h2 className="text-2xl font-mono font-bold text-ink-black">
                İşlemi İptal Et
              </h2>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-ink-black">
                Bu işlemi <strong>iptal etmek</strong> istediğinize emin misiniz?
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ İptal edilen işlemler silinmez, sadece &quot;iptal edildi&quot; olarak işaretlenir ve bakiye hesaplamalarından çıkarılır.
                </p>
              </div>

              <div className="bg-gray-50 border-2 border-grid-line rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${iptalConfirm.islem_tipi === 'IS' ? 'text-debt-red' : 'text-payment-green'
                    }`}>
                    {iptalConfirm.islem_tipi === 'IS' ? (
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
                    {formatDate(iptalConfirm.created_at)}
                  </span>
                </div>
                <p className="text-sm text-ink-black">{iptalConfirm.aciklama}</p>
                <p className="text-lg font-mono font-bold text-ink-black">
                  {iptalConfirm.islem_tipi === 'IS' ? '+' : '-'}{formatCurrency(iptalConfirm.tutar)}
                </p>
                {iptalConfirm.islem_tipi === 'IS' && iptalConfirm.odemeler && iptalConfirm.odemeler.filter(o => o.islem_durumu === 'AKTIF').length > 0 && (
                  <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                    ⚠️ Bu işe ait {iptalConfirm.odemeler.filter(o => o.islem_durumu === 'AKTIF').length} ödeme kaydı da iptal edilecek
                  </p>
                )}
              </div>

              {/* İptal Nedeni - OPSİYONEL */}
              <div>
                <label className="block text-sm font-semibold text-ink-black mb-2">
                  İptal Nedeni <span className="text-ink-black/40 text-xs font-normal">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  value={iptalNedeni}
                  onChange={(e) => setIptalNedeni(e.target.value)}
                  placeholder="Örn: Hatalı giriş, Müşteri vazgeçti..."
                  className="w-full px-4 py-3 border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIptalConfirm(null)
                  setIptalNedeni('')
                }}
                disabled={isIptalEtme}
                className="flex-1 px-4 py-3 border-2 border-grid-line text-ink-black rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleIptal(iptalConfirm)}
                disabled={isIptalEtme}
                className="flex-1 px-4 py-3 bg-debt-red hover:bg-debt-red/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isIptalEtme ? (
                  'İptal Ediliyor...'
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    İptal Et
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme İptal Onay Modalı */}
      {iptalOdemeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border-2 border-gray-300 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-gray-600" />
              </div>
              <h2 className="text-2xl font-mono font-bold text-ink-black">
                Ödemeyi İptal Et
              </h2>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-ink-black">
                Bu ödemeyi <strong>iptal etmek</strong> istediğinize emin misiniz?
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ İptal edilen ödemeler silinmez, sadece &quot;iptal edildi&quot; olarak işaretlenir ve işin kalan borcuna geri eklenir.
                </p>
              </div>

              <div className="bg-gray-50 border-2 border-grid-line rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-payment-green">
                    <TrendingDown className="w-3 h-3" />
                    Ödeme
                  </span>
                  <span className="text-xs text-ink-black/60 font-mono">
                    {formatDate(iptalOdemeConfirm.odeme.created_at)}
                  </span>
                </div>
                {iptalOdemeConfirm.odeme.aciklama && (
                  <p className="text-sm text-ink-black">{iptalOdemeConfirm.odeme.aciklama}</p>
                )}
                <p className="text-lg font-mono font-bold text-ink-black">
                  {formatCurrency(iptalOdemeConfirm.odeme.tutar)}
                </p>
                <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                  ⚠️ Bu tutar işin kalan borcuna geri eklenecek
                </p>
              </div>

              {/* İptal Nedeni - OPSİYONEL */}
              <div>
                <label className="block text-sm font-semibold text-ink-black mb-2">
                  İptal Nedeni <span className="text-ink-black/40 text-xs font-normal">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  value={iptalNedeni}
                  onChange={(e) => setIptalNedeni(e.target.value)}
                  placeholder="Örn: Hatalı giriş, Yanlış tutar..."
                  className="w-full px-4 py-3 border-2 border-grid-line rounded-lg focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIptalOdemeConfirm(null)
                  setIptalNedeni('')
                }}
                disabled={isIptalEtme}
                className="flex-1 px-4 py-3 border-2 border-grid-line text-ink-black rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleIptalOdeme(iptalOdemeConfirm.odeme, iptalOdemeConfirm.islem)}
                disabled={isIptalEtme}
                className="flex-1 px-4 py-3 bg-debt-red hover:bg-debt-red/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isIptalEtme ? (
                  'İptal Ediliyor...'
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    İptal Et
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
