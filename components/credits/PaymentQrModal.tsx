'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, QrCode, Clock, AlertCircle, CheckCircle2, Sparkles, Building2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditPurchaseOrder } from '@/services/creditService'
import { useCreditOrderStatus } from '@/hooks/useCredits'
import { formatVnd } from '@/components/credits/credit-packages-section'
import { ReportBugModal } from '@/components/bug-report/ReportBugModal'

interface PaymentQrModalProps {
  order: CreditPurchaseOrder | null
  open: boolean
  onClose: () => void
  onNewOrder?: () => void
}

export function PaymentQrModal({ order, open, onClose, onNewOrder }: PaymentQrModalProps) {
  const queryClient = useQueryClient()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(900) // 15 phút
  const [isReportBugOpen, setIsReportBugOpen] = useState(false)

  const isPending = order?.status === 'PENDING'
  const { data: statusData } = useCreditOrderStatus(
    order?.orderId ?? null,
    open && isPending
  )

  const isSuccess = statusData?.status === 'SUCCESS' || order?.status === 'SUCCESS'
  const isExpiredPaid = statusData?.status === 'EXPIRED_PAID' || order?.status === 'EXPIRED_PAID'

  // Đếm ngược 15 phút tính từ thời điểm tạo đơn
  useEffect(() => {
    if (!open || !isPending || isSuccess) return

    const calculateRemainingSeconds = () => {
      if (!order?.createdAt) return 900
      const elapsedSeconds = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)
      return Math.max(0, 900 - elapsedSeconds)
    }

    setTimeLeftSeconds(calculateRemainingSeconds())
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, isPending, isSuccess, order?.createdAt])

  // Invalidate queries khi thanh toán thành công
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['credits', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['credits', 'me', 'transactions'] })
    }
  }, [isSuccess, queryClient])

  const copyToClipboard = async (text: string, fieldName: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success(`Đã sao chép ${label}`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Không thể sao chép tự động')
    }
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (!order) return null

  // Xác định cú pháp và thông tin thanh toán an toàn (Fail-Safe & Fail-Fast)
  const syntax = order.transferSyntax?.trim() || order.orderCode?.trim() || ''
  const bank = order.bankCode?.trim() || ''
  const account = order.accountNumber?.trim() || ''
  const holder = order.accountHolderName?.trim() || ''
  const qrUrl =
    order.qrUrl?.trim() ||
    (bank && account && syntax
      ? `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${order.price}&addInfo=${encodeURIComponent(
          syntax
        )}&accountName=${encodeURIComponent(holder)}`
      : '')

  const isPaymentInfoValid = Boolean(syntax && (qrUrl || (bank && account)))

  return (
    <>
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0 sm:rounded-2xl">
        {isSuccess ? (
          /* Màn hình thông báo thanh toán thành công */
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-12 w-12 animate-in zoom-in-50 duration-300" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-6 w-6 text-amber-500 animate-bounce" />
              </div>
            </div>

            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Thanh toán thành công!
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Đã cộng <span className="font-semibold text-violet-600 dark:text-violet-400">+{order.credits} Credit</span> vào tài khoản của bạn.
              </DialogDescription>
            </DialogHeader>

            {statusData?.newBalance !== undefined && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 px-5 py-3 dark:border-violet-800/40 dark:bg-violet-950/20">
                <span className="text-xs text-slate-500 dark:text-slate-400">Số dư Credit mới:</span>
                <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                  {statusData.newBalance} Credit
                </p>
              </div>
            )}

            <Button onClick={onClose} className="mt-6 w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              Hoàn tất
            </Button>
          </div>
        ) : isExpiredPaid ? (
          /* Màn hình thông báo giao dịch quá hạn EXPIRED_PAID */
          <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertCircle className="h-10 w-10 animate-in zoom-in-50 duration-300" />
            </div>

            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Đơn thanh toán đã quá hạn 15 phút
              </DialogTitle>
              <DialogDescription className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Hệ thống ghi nhận bạn đã chuyển khoản khi mã thanh toán đã quá hạn 15 phút. Vì lý do an toàn, Credit chưa thể tự động cộng vào tài khoản.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 w-full max-w-xs rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-left dark:border-amber-800/40 dark:bg-amber-950/20 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{order.orderCode || syntax || order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền đã chuyển:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatVnd(order.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 text-[10px]">Quá hạn thanh toán</Badge>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              <Button
                onClick={() => setIsReportBugOpen(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-9"
              >
                Báo cáo sự cố để nhận hoàn tiền
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full text-xs h-9"
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : !isPaymentInfoValid ? (
          /* Màn hình thông báo không thể tạo thông tin thanh toán (Fail-Fast) */
          <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <AlertCircle className="h-10 w-10 animate-in zoom-in-50 duration-300" />
            </div>

            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Không thể tạo thông tin thanh toán
              </DialogTitle>
              <DialogDescription className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Hệ thống chưa thể lấy đầy đủ thông tin tài khoản hoặc cú pháp chuyển khoản cho đơn hàng này. Vui lòng thử lại hoặc liên hệ quản trị viên.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              <Button
                onClick={() => {
                  if (onNewOrder) {
                    onNewOrder()
                  } else {
                    onClose()
                  }
                }}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs h-9"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Thử tạo đơn lại
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full text-xs h-9"
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          /* Màn hình quét mã QR & thông tin chuyển tiền */
          <div>
            <DialogHeader className="border-b border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold">Nạp {order.credits} Credit</DialogTitle>
                    <DialogDescription className="text-xs">
                      Quét mã VietQR bằng App Ngân hàng bất kỳ
                    </DialogDescription>
                  </div>
                </div>

                {timeLeftSeconds === 0 ? (
                  <Badge variant="destructive" className="flex items-center gap-1.5">
                    <span>Mã đã hết hạn</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>{formatTimer(timeLeftSeconds)}</span>
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              {/* Ảnh VietQR & Overlay khi hết hạn */}
              <div className="relative flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="Mã QR chuyển khoản VietQR"
                  className={`h-56 w-56 object-contain transition-all duration-300 ${
                    timeLeftSeconds === 0 ? 'blur-md opacity-30 pointer-events-none' : ''
                  }`}
                />
                <span className="mt-2 text-[11px] text-slate-400">
                  Tự động điền 100% Số tài khoản, Số tiền & Nội dung
                </span>

                {timeLeftSeconds === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 p-4 text-center text-white backdrop-blur-xs animate-in fade-in-50">
                    <AlertCircle className="h-10 w-10 text-rose-400 mb-2" />
                    <span className="text-base font-bold text-rose-300">Mã thanh toán đã quá hạn</span>
                    <p className="mt-1 text-xs text-slate-300 max-w-xs">
                      Mã VietQR này đã hết hiệu lực sau 15 phút. Nếu chuyển khoản vào mã này, hệ thống sẽ không tự động cộng credit.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white w-full font-medium"
                        onClick={() => {
                          if (onNewOrder) {
                            onNewOrder()
                          } else {
                            onClose()
                          }
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Tạo giao dịch mới
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chi tiết chuyển khoản & nút sao chép */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Ngân hàng:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{bank}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                  <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">{holder}</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{account}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => copyToClipboard(account, 'account', 'Số tài khoản')}
                    >
                      {copiedField === 'account' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatVnd(order.price)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => copyToClipboard(String(order.price), 'price', 'Số tiền')}
                    >
                      {copiedField === 'price' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Nội dung chuyển:</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className="font-mono text-xs bg-violet-100 text-violet-800 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300">
                      {syntax}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => copyToClipboard(syntax, 'syntax', 'Nội dung chuyển khoản')}
                    >
                      {copiedField === 'syntax' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hướng dẫn khi quá hạn hoặc lưu ý */}
              {timeLeftSeconds === 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <strong>Bạn đã chuyển khoản sau khi mã hết hạn?</strong>
                    <p className="mt-1">
                      Đừng lo lắng! Vui lòng vào mục <strong>Báo cáo sự cố</strong>, chọn <strong>Nạp Credit / Yêu cầu hoàn tiền</strong>, nhập mã đơn <span className="font-mono font-bold">{order.orderCode || syntax}</span> và thông tin tài khoản ngân hàng để Admin hỗ trợ hoàn tiền nhanh chóng.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    <strong>Quan trọng:</strong> Vui lòng giữ nguyên nội dung chuyển khoản{' '}
                    <strong className="font-mono">{syntax}</strong> để hệ thống tự động cộng credit ngay sau khi chuyển.
                  </span>
                </div>
              )}

              {/* Trạng thái lắng nghe thời gian thực */}
              {timeLeftSeconds > 0 && (
                <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span>Đang chờ nhận biến động số dư từ ngân hàng...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {isReportBugOpen && (
      <ReportBugModal
        open={isReportBugOpen}
        onClose={() => setIsReportBugOpen(false)}
      />
    )}
    </>
  )
}
