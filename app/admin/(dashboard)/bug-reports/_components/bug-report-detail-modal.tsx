'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BugReportResponse,
  BugReportStatus,
} from '@/services/bugReportService'
import { useUpdateBugReportStatus } from '@/hooks/useBugReports'
import { toast } from 'sonner'
import { Loader2, Mail, Calendar, User, CheckCircle2, AlertTriangle, ZoomIn, CreditCard, Copy } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { getBankInfo } from '@/lib/constants/vietnam-banks'

import { useI18n } from '@/lib/i18n/i18n-context'

interface BugReportDetailModalProps {
  open: boolean
  onClose: () => void
  report: BugReportResponse | null
  onStatusUpdated: () => void
}

const ERROR_TYPE_KEYS: Record<string, string> = {
  LOGIN_ACCOUNT: 'Lỗi đăng nhập / tài khoản',
  UI_KATEX: 'Lỗi hiển thị giao diện / KaTeX',
  SUBMISSION_PROBLEM: 'Lỗi không nộp bài / không tải đề',
  PERFORMANCE: 'Lỗi tốc độ / không phản hồi',
  PAYMENT_REFUND: 'Sự cố hoàn tiền nạp xu (Credit)',
  AI_ASSISTANT: 'Lỗi trợ lý AI',
  CREDIT_TRANSACTION: 'Lỗi giao dịch Credit',
  OTHER: 'Lỗi khác',
}

export function BugReportDetailModal({
  open,
  onClose,
  report,
  onStatusUpdated,
}: BugReportDetailModalProps) {
  const { t } = useI18n()
  const [currentStatus, setCurrentStatus] = useState<BugReportStatus>('PENDING')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const statusBadges: Record<
    BugReportStatus,
    { label: string; className: string }
  > = {
    PENDING: { label: t('Chờ xử lý'), className: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold' },
    IN_PROGRESS: { label: t('Đang xử lý'), className: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold' },
    RESOLVED: { label: t('Đã giải quyết'), className: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' },
  }

  const updateMutation = useUpdateBugReportStatus()

  useEffect(() => {
    if (report) {
      setCurrentStatus(report.status)
    }
  }, [report])

  if (!report) return null

  const handleUpdateStatus = () => {
    if (currentStatus === report.status) {
      toast.info(t('Trạng thái không có thay đổi'))
      return
    }

    updateMutation.mutate(
      { id: report.id, status: currentStatus },
      {
        onSuccess: () => {
          toast.success(t('Cập nhật trạng thái báo cáo thành công!'))
          onStatusUpdated()
          onClose()
        },
        onError: (error: any) => {
          console.error('Update status error:', error)
          toast.error(error?.response?.data?.message || t('Có lỗi xảy ra khi cập nhật trạng thái'))
        }
      }
    )
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('Đã sao chép {label}!', { label }))
  }

  const bankInfo = report ? getBankInfo(report.bankCode) : undefined

  const errorTypeLabel = report.errorType && ERROR_TYPE_KEYS[report.errorType]
    ? t(ERROR_TYPE_KEYS[report.errorType])
    : report.errorType


  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {t('Chi tiết Báo cáo lỗi')}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {t('Loại lỗi:')} <span className="font-semibold text-foreground">{errorTypeLabel}</span>
                  </DialogDescription>
                </div>
              </div>
              <Badge className={statusBadges[report.status]?.className || ''}>
                {statusBadges[report.status]?.label || report.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Người gửi & Thời gian */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3.5 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Mail className="h-3.5 w-3.5" /> {t('Email người gửi')}
                </div>
                <div className="font-semibold text-foreground break-all">{report.reporterEmail}</div>
                {report.reporterName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" /> {report.reporterName}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-3.5 w-3.5" /> {t('Thời gian gửi')}
                </div>
                <div className="font-semibold text-foreground">{formatDateTime(report.createdAt)}</div>
                <div className="text-xs text-muted-foreground">
                  {t('Múi giờ: Vietnam Standard Time (ICT)')}
                </div>
              </div>
            </div>

            {/* Thông tin tài khoản nhận hoàn tiền (nếu có) */}
            {(report.errorType === 'PAYMENT_REFUND' || report.bankCode || report.accountNumber) && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                        Thông tin tài khoản nhận hoàn tiền
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Thông tin thụ hưởng do người dùng cung cấp
                      </p>
                    </div>
                  </div>
                  {report.orderCode && (
                    <Badge variant="outline" className="font-mono text-xs border-emerald-300 text-emerald-800 bg-white dark:bg-slate-900 shadow-sm">
                      Mã đơn: {report.orderCode}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Ngân hàng */}
                  <div className="rounded-lg border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-slate-900 p-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground block">Ngân hàng thụ hưởng</span>
                    <div className="flex items-center gap-2 mt-1">
                      {bankInfo?.logo && (
                        <img
                          src={bankInfo.logo}
                          alt={bankInfo.shortName}
                          className="h-5 w-auto object-contain max-w-[60px]"
                        />
                      )}
                      <span className="text-xs font-bold text-foreground">
                        {bankInfo ? `${bankInfo.shortName} - ${bankInfo.name}` : report.bankCode || 'Chưa cung cấp'}
                      </span>
                    </div>
                  </div>

                  {/* Tên chủ tài khoản */}
                  <div className="rounded-lg border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-slate-900 p-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground block">Tên chủ tài khoản</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold tracking-wide uppercase text-foreground truncate mr-1">
                        {report.accountHolderName || 'Chưa cung cấp'}
                      </span>
                      {report.accountHolderName && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => copyToClipboard(report.accountHolderName!, 'Tên chủ tài khoản')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Số tài khoản */}
                  <div className="sm:col-span-2 rounded-lg border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-slate-900 p-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground block">Số tài khoản (STK)</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        {report.accountNumber || 'Chưa cung cấp'}
                      </span>
                      {report.accountNumber && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                          onClick={() => copyToClipboard(report.accountNumber!, 'Số tài khoản')}
                        >
                          <Copy className="h-3.5 w-3.5" /> Sao chép STK
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nội dung Mô tả sự cố */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Nội dung mô tả sự cố')}
              </label>
              <div className="rounded-lg border border-border bg-background p-3.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {report.description ? report.description : <span className="italic text-muted-foreground">{t('(Không có nội dung mô tả đính kèm)')}</span>}
              </div>
            </div>

            {/* Danh sách Ảnh đính kèm */}
            {report.imageUrls && report.imageUrls.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Hình ảnh đính kèm ({count} ảnh)', { count: report.imageUrls.length })}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {report.imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(url)}
                      className="group relative aspect-video rounded-lg border border-border bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    >
                      <img
                        src={url}
                        alt={`${t('Ảnh đính kèm')} ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ZoomIn className="h-5 w-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cập nhật Trạng thái */}
            <div className="rounded-lg border border-border p-4 space-y-3 bg-card">
              <label className="text-sm font-bold text-foreground block">
                {t('Cập nhật trạng thái xử lý')}
              </label>
              <div className="flex items-center gap-3">
                <Select
                  value={currentStatus}
                  onValueChange={(val) => setCurrentStatus(val as BugReportStatus)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('Chọn trạng thái')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">{t('1. PENDING (Chờ xử lý)')}</SelectItem>
                    <SelectItem value="IN_PROGRESS">{t('2. IN_PROGRESS (Đang xử lý)')}</SelectItem>
                    <SelectItem value="RESOLVED">{t('3. RESOLVED (Đã giải quyết)')}</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleUpdateStatus} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> {t('Lưu trạng thái')}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Phóng to Ảnh đính kèm */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent
            className="sm:max-w-[85vw] max-h-[90vh] p-2 bg-black/95 border-none"
            closeButtonClassName="top-3 right-3 bg-zinc-800/90 text-white border-2 border-white/80 hover:bg-white hover:text-black shadow-2xl opacity-100 backdrop-blur-md rounded-full p-2 [&_svg:not([class*='size-'])]:size-5 transition-all duration-200"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{t('Xem ảnh đính kèm chi tiết')}</DialogTitle>
              <DialogDescription>{t('Hình ảnh đính kèm từ báo cáo sự cố của người dùng')}</DialogDescription>
            </DialogHeader>
            <div className="relative flex items-center justify-center w-full h-full min-h-[50vh]">
              <img
                src={previewImage}
                alt={t('Phóng to ảnh đính kèm')}
                className="max-h-[82vh] max-w-full object-contain rounded-md"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
