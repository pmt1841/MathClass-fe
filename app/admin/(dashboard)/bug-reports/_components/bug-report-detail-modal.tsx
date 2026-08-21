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
  bugReportService,
} from '@/services/bugReportService'
import { toast } from 'sonner'
import { Loader2, Mail, Calendar, User, CheckCircle2, AlertTriangle, ZoomIn } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface BugReportDetailModalProps {
  open: boolean
  onClose: () => void
  report: BugReportResponse | null
  onStatusUpdated: () => void
}

const ERROR_TYPE_LABELS: Record<string, string> = {
  LOGIN_ACCOUNT: 'Lỗi đăng nhập / tài khoản',
  UI_KATEX: 'Lỗi hiển thị giao diện / KaTeX',
  SUBMISSION_PROBLEM: 'Lỗi không nộp bài / không tải đề',
  PERFORMANCE: 'Lỗi tốc độ / không phản hồi',
  OTHER: 'Lỗi khác',
}

const STATUS_BADGES: Record<
  BugReportStatus,
  { label: string; className: string }
> = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold' },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold' },
  RESOLVED: { label: 'Đã giải quyết', className: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' },
}

export function BugReportDetailModal({
  open,
  onClose,
  report,
  onStatusUpdated,
}: BugReportDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState<BugReportStatus>('PENDING')
  const [isUpdating, setIsUpdating] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (report) {
      setCurrentStatus(report.status)
    }
  }, [report])

  if (!report) return null

  const handleUpdateStatus = async () => {
    if (currentStatus === report.status) {
      toast.info('Trạng thái không có thay đổi')
      return
    }

    setIsUpdating(true)
    try {
      await bugReportService.updateReportStatus(report.id, currentStatus)
      toast.success('Cập nhật trạng thái báo cáo thành công!')
      onStatusUpdated()
      onClose()
    } catch (error: any) {
      console.error('Update status error:', error)
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setIsUpdating(false)
    }
  }

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
                    Chi tiết Báo cáo lỗi
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Loại lỗi: <span className="font-semibold text-foreground">{ERROR_TYPE_LABELS[report.errorType] || report.errorType}</span>
                  </DialogDescription>
                </div>
              </div>
              <Badge className={STATUS_BADGES[report.status]?.className || ''}>
                {STATUS_BADGES[report.status]?.label || report.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Người gửi & Thời gian */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3.5 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Mail className="h-3.5 w-3.5" /> Email người gửi
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
                  <Calendar className="h-3.5 w-3.5" /> Thời gian gửi (UTC+7)
                </div>
                <div className="font-semibold text-foreground">{formatDateTime(report.createdAt)}</div>
                <div className="text-xs text-muted-foreground">
                  Múi giờ: Vietnam Standard Time (ICT)
                </div>
              </div>
            </div>

            {/* Nội dung Mô tả sự cố */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nội dung mô tả sự cố
              </label>
              <div className="rounded-lg border border-border bg-background p-3.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {report.description ? report.description : <span className="italic text-muted-foreground">(Không có nội dung mô tả đính kèm)</span>}
              </div>
            </div>

            {/* Danh sách Ảnh đính kèm */}
            {report.imageUrls && report.imageUrls.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Hình ảnh đính kèm ({report.imageUrls.length} ảnh)
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
                        alt={`Ảnh đính kèm ${idx + 1}`}
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
                Cập nhật trạng thái xử lý
              </label>
              <div className="flex items-center gap-3">
                <Select
                  value={currentStatus}
                  onValueChange={(val) => setCurrentStatus(val as BugReportStatus)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">1. PENDING (Chờ xử lý)</SelectItem>
                    <SelectItem value="IN_PROGRESS">2. IN_PROGRESS (Đang xử lý)</SelectItem>
                    <SelectItem value="RESOLVED">3. RESOLVED (Đã giải quyết)</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Lưu trạng thái
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
              <DialogTitle>Xem ảnh đính kèm chi tiết</DialogTitle>
              <DialogDescription>Hình ảnh đính kèm từ báo cáo sự cố của người dùng</DialogDescription>
            </DialogHeader>
            <div className="relative flex items-center justify-center w-full h-full min-h-[50vh]">
              <img
                src={previewImage}
                alt="Phóng to ảnh đính kèm"
                className="max-h-[82vh] max-w-full object-contain rounded-md"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
