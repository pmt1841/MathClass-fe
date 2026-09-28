'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Check,
  RotateCcw,
  Building2,
  Copy,
  AlertCircle,
  Undo2,
  X,
  QrCode,
  Radio,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAdminCreditOrders, useApproveCreditOrder, useRefundCreditOrder } from '@/hooks/usePaymentConfig'
import { formatVnd } from '@/components/credits/credit-packages-section'
import { CreditOrderAdminResponse } from '@/types/payment'
import { creditService } from '@/services/creditService'
import { handleApiError } from '@/lib/utils/error-handler'
import { getBankInfo } from '@/lib/constants/vietnam-banks'
import { formatVnDateTime } from '@/lib/utils'

const PAGE_SIZE = 15

export function CreditOrdersTab() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState(0)
  const [approvingOrder, setApprovingOrder] = useState<CreditOrderAdminResponse | null>(null)
  const [refundingOrder, setRefundingOrder] = useState<CreditOrderAdminResponse | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isAutoRefunded, setIsAutoRefunded] = useState<boolean>(false)

  const statusParam = selectedStatus === 'ALL' ? undefined : selectedStatus
  const { data, isLoading, isFetching, refetch } = useAdminCreditOrders({
    status: statusParam,
    search: searchQuery.trim() || undefined,
    page,
    size: PAGE_SIZE,
  })

  const approveMutation = useApproveCreditOrder()
  const refundMutation = useRefundCreditOrder()

  const handleManualRefund = async () => {
    if (!refundingOrder) return
    try {
      await refundMutation.mutateAsync({
        orderId: refundingOrder.orderId,
        refundReason: 'Xác nhận hoàn tiền thủ công bởi Admin',
      })
      toast.success('Đã xác nhận hoàn tiền thành công!')
      setIsAutoRefunded(true)
      setTimeout(() => {
        setRefundingOrder(null)
      }, 1500)
    } catch (error) {
      handleApiError(error)
    }
  }

  useEffect(() => {
    if (refundingOrder) {
      setIsAutoRefunded(false)
    }
  }, [refundingOrder])

  // Lắng nghe biến động số dư tiền ra (Outbound Webhook từ SePay) qua polling riêng trạng thái đơn mỗi 2.0s
  useEffect(() => {
    if (!refundingOrder || isAutoRefunded) return

    const interval = setInterval(async () => {
      try {
        const orderStatus = await creditService.getOrderStatus(refundingOrder.orderId)
        if (orderStatus && orderStatus.status === 'REFUNDED') {
          setIsAutoRefunded(true)
          toast.success(
            `Hệ thống đã nhận diện biến động số dư tiền ra cho đơn #${refundingOrder.orderCode || refundingOrder.orderId}!`
          )
          refetch()
        }
      } catch {
        // im lặng bỏ qua lỗi kết nối trong khi poll
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [refundingOrder, isAutoRefunded, refetch])

  const copyToClipboard = async (text: string, fieldKey: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldKey)
      toast.success(`Đã sao chép ${label}`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Không thể sao chép tự động')
    }
  }

  const handleApprove = async () => {
    if (!approvingOrder) return
    try {
      await approveMutation.mutateAsync(approvingOrder.orderId)
      toast.success(`Đã duyệt nạp thành công đơn #${approvingOrder.orderId}!`)
      setApprovingOrder(null)
    } catch (e) {
      toast.error(handleApiError(e, 'Không thể duyệt đơn nạp lúc này.'))
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
            Thành công
          </Badge>
        )
      case 'REFUNDED':
        return (
          <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300">
            Đã hoàn tiền
          </Badge>
        )
      case 'EXPIRED_PAID':
      case 'DUPLICATE_PAYMENT':
        return (
          <Badge className="border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            Chờ hoàn
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className="border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Đang chờ
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300">
            Thất bại
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderReasonBadge = (order: CreditOrderAdminResponse) => {
    const isDuplicate =
      order.status === 'DUPLICATE_PAYMENT' ||
      order.orderCode?.includes('DUP') ||
      order.refundReason?.toLowerCase().includes('trùng') ||
      order.refundReason?.toLowerCase().includes('duplicate')

    const isExpired =
      order.status === 'EXPIRED_PAID' ||
      order.refundReason?.toLowerCase().includes('quá hạn') ||
      order.refundReason?.toLowerCase().includes('expired')

    if (isDuplicate) {
      return (
        <Badge
          variant="outline"
          className="border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 text-[11px] font-semibold"
        >
          Trùng mã
        </Badge>
      )
    }

    if (isExpired) {
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 text-[11px] font-semibold"
        >
          Quá hạn
        </Badge>
      )
    }

    if (order.status === 'REFUNDED' && order.refundReason) {
      return (
        <span className="text-xs text-slate-500 truncate max-w-[120px] block" title={order.refundReason}>
          {order.refundReason}
        </span>
      )
    }

    // Đơn thành công hoặc không có lý do lỗi -> không cần ghi gì
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-violet-600" />
                Lịch sử Đơn nạp Credit & Đối soát Giao dịch
              </CardTitle>
              <CardDescription>
                Theo dõi các giao dịch nạp thành công và đơn chuyển khoản lỗi (quá hạn 15p, chuyển trùng mã) cần hoàn tiền.
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
              {/* Ô tìm kiếm theo mã đơn */}
              <div className="relative w-full sm:w-44 md:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm theo mã đơn..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(0)
                  }}
                  className="h-9 pl-8 pr-8 text-xs font-mono uppercase"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setPage(0)
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Nhóm lọc trạng thái và nút reset đồng bộ */}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => {
                    setSelectedStatus(val)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
                    <Filter className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả giao dịch xử lý</SelectItem>
                    <SelectItem value="SUCCESS">Thành công (SUCCESS)</SelectItem>
                    <SelectItem value="REFUNDED">Đã hoàn tiền (REFUNDED)</SelectItem>
                    <SelectItem value="EXPIRED_PAID">Quá hạn (EXPIRED_PAID)</SelectItem>
                    <SelectItem value="DUPLICATE_PAYMENT">Trùng mã (DUPLICATE)</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  title="Tải lại danh sách"
                >
                  <RefreshCw className={`h-4 w-4 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75 dark:bg-slate-900/50">
                  <TableHead className="w-24">Mã đơn</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Gói Credit</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Nguyên nhân</TableHead>
                  <TableHead>Mã GD</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !data || data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-slate-400">
                      Không có đơn nạp credit nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((order, index) => {
                    const total = data.totalElements || 0
                    const stt = Math.max(1, total - (page * PAGE_SIZE + index))
                    const isRefundable =
                      order.status === 'EXPIRED_PAID' || order.status === 'DUPLICATE_PAYMENT'

                    return (
                      <TableRow key={order.orderId}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {order.orderCode || `#${order.orderId}`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">STT: #{stt}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {order.userFullName || `User #${order.userId}`}
                            </span>
                            <span className="text-xs text-slate-400">{order.userEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-violet-600 dark:text-violet-400">
                          +{order.credits} Credit
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                          {formatVnd(order.price)}
                        </TableCell>
                        <TableCell>{renderStatusBadge(order.status)}</TableCell>
                        <TableCell>{renderReasonBadge(order)}</TableCell>
                        <TableCell className="max-w-[180px]">
                          {order.transactionRef ? (
                            <span
                              className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 truncate block"
                              title={order.transactionRef}
                            >
                              {order.transactionRef}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {order.paidAt ? (
                            <div>
                              <span className="text-emerald-600 font-medium">Đã thanh toán:</span>{' '}
                              {formatVnDateTime(order.paidAt)}
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-400">Tạo lúc:</span>{' '}
                              {formatVnDateTime(order.createdAt)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isRefundable ? (
                            /* Chỉ duy nhất 1 nút Hoàn tiền cho đơn lỗi */
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs h-7 font-medium"
                              onClick={() => {
                                setRefundingOrder(order)
                              }}
                            >
                              <RotateCcw className="h-3 w-3 mr-1 text-amber-600" />
                              Hoàn tiền
                            </Button>
                          ) : order.status === 'PENDING' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs h-7"
                              onClick={() => setApprovingOrder(order)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Duyệt nạp
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
              <span>
                Hiển thị trang {data.number + 1} / {data.totalPages} ({data.totalElements} đơn)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.first}
                >
                  Trang trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.last}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hộp thoại HOÀN TIỀN QUA VIETQR & THEO DÕI BIẾN ĐỘNG SỐ DƯ */}
      <Dialog open={!!refundingOrder} onOpenChange={(val) => !val && setRefundingOrder(null)}>
        <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              <QrCode className="h-5 w-5 text-violet-600" />
              Hoàn tiền qua VietQR & Biến động số dư
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Quét mã QR từ App ngân hàng để chuyển khoản hoàn tiền. Hệ thống tự động xác nhận khi có biến động số dư tiền ra.
            </DialogDescription>
          </DialogHeader>

          {isAutoRefunded ? (
            /* Màn hình thông báo thành công khi Webhook tiền ra kích hoạt */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  ĐÃ HOÀN TIỀN THÀNH CÔNG!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
                  Hệ thống đã nhận diện biến động số dư tiền ra từ tài khoản ngân hàng của bạn. Đơn hàng{' '}
                  <strong className="font-mono text-slate-900 dark:text-slate-100">{refundingOrder?.orderCode || `#${refundingOrder?.orderId}`}</strong>{' '}
                  đã được chuyển sang trạng thái <strong>ĐÃ HOÀN TIỀN</strong> và phiếu sự cố đã được đóng tự động.
                </p>
              </div>
              <Button
                onClick={() => setRefundingOrder(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Đóng hộp thoại
              </Button>
            </div>
          ) : (
            /* Màn hình quét mã VietQR và kiểm soát biến động */
            <div className="space-y-4 pt-1 text-xs">
              {/* Thông tin đơn hàng & số tiền cần hoàn */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã đơn nạp:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {refundingOrder?.orderCode || `#${refundingOrder?.orderId}`}
                  </span>
                  <span className="text-slate-400 block text-[10px] truncate">{refundingOrder?.userEmail}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Số tiền hoàn:</span>
                  <span className="font-bold text-rose-600 text-base">
                    {refundingOrder && formatVnd(refundingOrder.price)}
                  </span>
                </div>
              </div>

              {/* Thông tin tài khoản nhận tiền hoàn (Chỉ đọc từ thông tin khách hàng cung cấp) */}
              {refundingOrder?.refundBankCode && refundingOrder?.refundAccountNumber ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3.5 dark:border-violet-900/50 dark:bg-violet-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-violet-950 dark:text-violet-200 flex items-center gap-1.5 text-xs">
                      <Building2 className="h-4 w-4 text-violet-600" />
                      Tài khoản thụ hưởng của khách hàng:
                    </span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                      ✓ Thông tin do khách cung cấp
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Ngân hàng nhận */}
                    <div className="rounded-lg border border-violet-100 dark:border-violet-900/50 bg-white dark:bg-slate-900 p-2.5">
                      <span className="text-[11px] font-medium text-slate-400 block">Ngân hàng thụ hưởng:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getBankInfo(refundingOrder.refundBankCode)?.logo && (
                          <img
                            src={getBankInfo(refundingOrder.refundBankCode)!.logo}
                            alt={getBankInfo(refundingOrder.refundBankCode)!.shortName}
                            className="h-4 w-auto object-contain max-w-[55px]"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        )}
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {getBankInfo(refundingOrder.refundBankCode)
                            ? `${getBankInfo(refundingOrder.refundBankCode)!.shortName} - ${getBankInfo(refundingOrder.refundBankCode)!.name}`
                            : refundingOrder.refundBankCode}
                        </span>
                      </div>
                    </div>

                    {/* Tên chủ tài khoản */}
                    <div className="rounded-lg border border-violet-100 dark:border-violet-900/50 bg-white dark:bg-slate-900 p-2.5">
                      <span className="text-[11px] font-medium text-slate-400 block">Tên chủ tài khoản:</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold uppercase text-slate-800 dark:text-slate-200 text-xs truncate">
                          {refundingOrder.refundAccountName || 'Chưa cung cấp'}
                        </span>
                        {refundingOrder.refundAccountName && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            onClick={() => copyToClipboard(refundingOrder.refundAccountName!, 'holderName', 'tên chủ tài khoản')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Số tài khoản */}
                    <div className="sm:col-span-2 rounded-lg border border-violet-100 dark:border-violet-900/50 bg-white dark:bg-slate-900 p-2.5">
                      <span className="text-[11px] font-medium text-slate-400 block">Số tài khoản (STK):</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono font-bold text-violet-700 dark:text-violet-300 text-sm">
                          {refundingOrder.refundAccountNumber}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] text-violet-700 border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 px-2 gap-1"
                          onClick={() => copyToClipboard(refundingOrder.refundAccountNumber!, 'accountNumber', 'số tài khoản')}
                        >
                          {copiedField === 'accountNumber' ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Sao chép STK
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Hiển thị cú pháp chuyển khoản hoàn tiền (bỏ dấu gạch nối để người dùng gõ tay không bị lỗi) */}
                  {(() => {
                    const cleanCode = (refundingOrder.orderCode || `${refundingOrder.orderId}`).replace(/[-_\s]/g, '')
                    const refundSyntax = `REFUND ${cleanCode}`
                    return (
                      <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 p-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 block font-normal">Nội dung chuyển khoản (bắt buộc để hệ thống tự động xác nhận):</span>
                          <span className="font-mono font-bold text-violet-700 dark:text-violet-300">
                            {refundSyntax}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] text-violet-700 px-2"
                          onClick={() =>
                            copyToClipboard(
                              refundSyntax,
                              'refundSyntax',
                              'cú pháp hoàn tiền'
                            )
                          }
                        >
                          {copiedField === 'refundSyntax' ? (
                            <Check className="h-3 w-3 mr-1 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Sao chép
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs text-center space-y-2">
                  <AlertCircle className="h-6 w-6 mx-auto text-amber-600" />
                  <p className="font-bold text-sm">Chưa có thông tin tài khoản nhận tiền</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 max-w-md mx-auto">
                    Khách hàng chưa gửi thông tin ngân hàng nhận hoàn tiền qua <strong>Báo cáo sự cố</strong>. Vui lòng yêu cầu khách hàng vào mục Báo cáo sự cố (chọn loại lỗi <em>Hoàn tiền nạp xu</em>) để cung cấp STK và Ngân hàng nhận tiền.
                  </p>
                </div>
              )}

              {/* KHỐI HIỂN THỊ ẢNH VIETQR */}
              {refundingOrder?.refundBankCode && refundingOrder?.refundAccountNumber ? (
                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Mã VietQR Chuyển khoản Hoàn tiền (Chuẩn Napas247)</span>
                  </div>

                  {(() => {
                    const cleanCode = (refundingOrder.orderCode || `${refundingOrder.orderId}`).replace(/[-_\s]/g, '')
                    const refundSyntax = `REFUND ${cleanCode}`
                    return (
                      <div className="p-2 bg-white rounded-lg border shadow-sm">
                        <img
                          src={`https://img.vietqr.io/image/${refundingOrder.refundBankCode}-${refundingOrder.refundAccountNumber}-compact2.png?amount=${refundingOrder.price}&addInfo=${encodeURIComponent(refundSyntax)}&accountName=${encodeURIComponent(refundingOrder.refundAccountName || '')}`}
                          alt="VietQR Hoàn tiền"
                          className="max-w-[250px] w-full object-contain mx-auto rounded"
                        />
                      </div>
                    )
                  })()}

                  {/* Lắng nghe biến động số dư trực tiếp */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">
                    <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
                    <span className="font-medium">Hệ thống đang tự động kiểm soát biến động số dư SePay...</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {!isAutoRefunded && (
            <DialogFooter className="pt-2 border-t flex flex-row items-center justify-between sm:justify-between w-full gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRefundingOrder(null)}
                className="text-xs h-8"
              >
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleManualRefund}
                disabled={refundMutation.isPending}
                className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {refundMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận đã hoàn tiền thủ công'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Hộp thoại xác nhận duyệt thủ công PENDING */}
      <AlertDialog open={!!approvingOrder} onOpenChange={(val) => !val && setApprovingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Xác nhận Duyệt nạp Credit thủ công
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  Bạn có chắc chắn muốn duyệt nạp cho đơn hàng{' '}
                  <strong className="text-slate-900 dark:text-slate-100 font-mono">
                    {approvingOrder?.orderCode || `#${approvingOrder?.orderId}`}
                  </strong>{' '}
                  không?
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
                  <div>
                    Người nhận: <strong>{approvingOrder?.userFullName}</strong> ({approvingOrder?.userEmail})
                  </div>
                  <div>
                    Số credit cộng thêm: <strong className="text-violet-600">+{approvingOrder?.credits} Credit</strong>
                  </div>
                  <div>
                    Số tiền đơn: <strong>{approvingOrder && formatVnd(approvingOrder.price)}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Lưu ý: Thao tác này sẽ cập nhật đơn sang THÀNH CÔNG và cộng credit vào tài khoản người dùng ngay lập tức.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {approveMutation.isPending ? 'Đang duyệt...' : 'Xác nhận duyệt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
