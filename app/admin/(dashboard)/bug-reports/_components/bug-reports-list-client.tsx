'use client'

import { useState } from 'react'
import {
  BugReportResponse,
  BugReportStatus,
  BugErrorType,
} from '@/services/bugReportService'
import { useBugReports } from '@/hooks/useBugReports'
import { BugReportDetailModal } from './bug-report-detail-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { RefreshButton } from '@/components/ui/refresh-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, Eye, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

interface DateFilterInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function DateFilterInput({ label, value, onChange }: DateFilterInputProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  // Parse dd-MM-yyyy string to Date
  const selectedDate = (() => {
    if (!value) return undefined
    const parts = value.split('-')
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
      return !isNaN(d.getTime()) ? d : undefined
    }
    return undefined
  })()

  // Format input while typing dd-mm-yyyy
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9-]/g, '')
    // Auto-insert hyphen
    if (raw.length === 2 && !raw.includes('-') && !e.target.value.endsWith('-')) {
      raw = raw + '-'
    } else if (raw.length === 5 && raw.split('-').length === 2 && !e.target.value.endsWith('-')) {
      raw = raw + '-'
    }
    if (raw.length <= 10) {
      onChange(raw)
    }
  }

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const yyyy = date.getFullYear()
      onChange(`${dd}-${mm}-${yyyy}`)
    } else {
      onChange('')
    }
    setOpen(false)
  }

  return (
    <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-medium">
      <span>{label}:</span>
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="dd-mm-yyyy"
          value={value}
          onChange={handleInputChange}
          maxLength={10}
          className="w-[145px] h-10 bg-white rounded-xl text-xs font-mono pr-8 border-slate-200 hover:border-slate-300 focus-visible:ring-primary/20 placeholder:text-slate-400 text-slate-800"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute right-2 text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
              title={t('Chọn ngày từ lịch')}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 shadow-lg border-slate-200 bg-white" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
export function BugReportsListClient() {
  const { t } = useI18n()
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const errorTypeLabels: Record<string, string> = {
    LOGIN_ACCOUNT: t('1. Lỗi đăng nhập/tài khoản'),
    UI_KATEX: t('2. Lỗi giao diện/KaTeX'),
    SUBMISSION_PROBLEM: t('3. Lỗi nộp bài/tải đề'),
    PERFORMANCE: t('4. Lỗi tốc độ/phản hồi'),
    AI_ASSISTANT: t('5. Lỗi trợ lý AI'),
    CREDIT_TRANSACTION: t('6. Lỗi giao dịch Credit'),
    PAYMENT_REFUND: t('7. Sự cố hoàn tiền nạp xu'),
    OTHER: t('8. Khác'),
  }

  const statusBadges: Record<
    BugReportStatus,
    { label: string; className: string }
  > = {
    PENDING: { label: t('Chờ xử lý'), className: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold' },
    IN_PROGRESS: { label: t('Đang xử lý'), className: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold' },
    RESOLVED: { label: t('Đã giải quyết'), className: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' },
  }

  const [selectedReport, setSelectedReport] = useState<BugReportResponse | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const formatIsoDate = (dateString: string, isEnd: boolean = false) => {
    if (!dateString) return undefined
    let cleanDate = dateString.trim().replace(/\//g, '-')
    const parts = cleanDate.split('-')
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        // DD-MM-YYYY -> YYYY-MM-DD
        const day = parts[0]
        const month = parts[1]
        const year = parts[2]
        cleanDate = `${year}-${month}-${day}`
      } else if (parts[0].length === 4 && parts[2].length === 2) {
        // YYYY-MM-DD
        cleanDate = `${parts[0]}-${parts[1]}-${parts[2]}`
      } else {
        return undefined
      }
      return isEnd ? `${cleanDate}T23:59:59` : `${cleanDate}T00:00:00`
    }
    return undefined
  }

  const filterErrorType = errorTypeFilter !== 'ALL' ? (errorTypeFilter as BugErrorType) : undefined
  const filterStatus = statusFilter !== 'ALL' ? (statusFilter as BugReportStatus) : undefined
  const filterStartDate = formatIsoDate(startDate, false)
  const filterEndDate = formatIsoDate(endDate, true)

  const { data, isLoading, refetch } = useBugReports({
    errorType: filterErrorType,
    status: filterStatus,
    startDate: filterStartDate,
    endDate: filterEndDate,
    page,
    size: pageSize,
  })

  const reports = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const handleOpenDetail = (report: BugReportResponse) => {
    setSelectedReport(report)
    setShowDetailModal(true)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* ── Synchronized Header ── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <AlertTriangle className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('Quản lý Báo cáo lỗi')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('Danh sách các sự cố do người dùng phản hồi. Theo dõi và cập nhật trạng thái xử lý kịp thời.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={() => refetch()}
            />
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 space-y-4 w-full">
          {/* Filter & Stats Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
              {/* 1. Lọc theo Loại lỗi sự cố */}
              <Select
                value={errorTypeFilter}
                onValueChange={(val) => {
                  setErrorTypeFilter(val)
                  setPage(0)
                }}
              >
                <SelectTrigger id="bug-report-error-type-filter" className="h-10 w-[210px] bg-white rounded-xl border border-border text-xs font-semibold">
                  <SelectValue placeholder={t('Loại sự cố')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('Tất cả loại sự cố')}</SelectItem>
                  <SelectItem value="LOGIN_ACCOUNT">{t('1. Lỗi đăng nhập/tài khoản')}</SelectItem>
                  <SelectItem value="UI_KATEX">{t('2. Lỗi giao diện/KaTeX')}</SelectItem>
                  <SelectItem value="SUBMISSION_PROBLEM">{t('3. Lỗi nộp bài/tải đề')}</SelectItem>
                  <SelectItem value="PERFORMANCE">{t('4. Lỗi tốc độ/phản hồi')}</SelectItem>
                  <SelectItem value="AI_ASSISTANT">{t('5. Lỗi trợ lý AI')}</SelectItem>
                  <SelectItem value="CREDIT_TRANSACTION">{t('6. Lỗi giao dịch Credit')}</SelectItem>
                  <SelectItem value="OTHER">{t('7. Khác')}</SelectItem>
                </SelectContent>
              </Select>

              {/* 2. Lọc theo Trạng thái */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val)
                  setPage(0)
                }}
              >
                <SelectTrigger id="bug-report-status-filter" className="h-10 w-[180px] bg-white rounded-xl border border-border text-xs font-semibold">
                  <SelectValue placeholder={t('Trạng thái')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('Tất cả trạng thái')}</SelectItem>
                  <SelectItem value="PENDING">{t('Chờ xử lý')}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t('Đang xử lý')}</SelectItem>
                  <SelectItem value="RESOLVED">{t('Đã giải quyết')}</SelectItem>
                </SelectContent>
              </Select>

              {/* 3. Lọc theo Thời gian (dd-mm-yyyy) */}
              <DateFilterInput
                label={t('Từ')}
                value={startDate}
                onChange={(val) => {
                  setStartDate(val)
                  setPage(0)
                }}
              />

              <DateFilterInput
                label={t('Đến')}
                value={endDate}
                onChange={(val) => {
                  setEndDate(val)
                  setPage(0)
                }}
              />

              {/* 4. Nút Xóa bộ lọc */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setErrorTypeFilter('ALL')
                  setStatusFilter('ALL')
                  setStartDate('')
                  setEndDate('')
                  setPage(0)
                }}
                className="h-10 rounded-xl text-xs border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-xs font-medium"
              >
                {t('Xóa bộ lọc')}
              </Button>
            </div>
          </div>

          {/* Table Data */}
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[70px] font-bold text-foreground text-center">{t('STT')}</TableHead>
                  <TableHead className="font-bold text-foreground">{t('Người gửi')}</TableHead>
                  <TableHead className="font-bold text-foreground">{t('Loại lỗi sự cố')}</TableHead>
                  <TableHead className="font-bold text-foreground">{t('Thời gian gửi')}</TableHead>
                  <TableHead className="font-bold text-foreground text-center">{t('Trạng thái')}</TableHead>
                  <TableHead className="w-[110px] font-bold text-foreground text-center">{t('Thao tác')}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm font-medium">{t('Đang tải dữ liệu...')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center text-muted-foreground">
                      {t('Chưa có báo cáo sự cố nào.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((item, index) => {
                    const stt = page * pageSize + index + 1
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="text-center font-bold text-muted-foreground">
                          {stt}
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-foreground">{item.reporterEmail}</div>
                          {item.reporterName && (
                            <div className="text-xs text-muted-foreground">{item.reporterName}</div>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
                            {errorTypeLabels[item.errorType] || item.errorType}
                          </span>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {formatDateTime(item.createdAt)}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge className={statusBadges[item.status]?.className || ''}>
                            {statusBadges[item.status]?.label || item.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(item)}
                            className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" /> {t('Chi tiết')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Footer */}
            {!isLoading && totalElements > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-slate-50/60">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground font-medium">
                    {t('Hiển thị')} <span className="font-bold text-foreground">{page + 1}</span> / {Math.max(1, totalPages)} ({t('Tổng số')} <span className="font-bold text-foreground">{totalElements}</span> {t('báo cáo')})
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{t('Số dòng/trang:')}</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        setPageSize(Number(val))
                        setPage(0)
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px] text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="gap-1 text-xs bg-white rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4" /> {t('Trang trước')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || totalPages <= 1}
                    className="gap-1 text-xs bg-white rounded-xl"
                  >
                    {t('Trang sau')} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Chi Tiết Báo Cáo */}
          <BugReportDetailModal
            open={showDetailModal}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedReport(null)
            }}
            report={selectedReport}
            onStatusUpdated={() => refetch()}
          />
        </div>
      </div>
    </div>
  )
}

