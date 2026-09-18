'use client'

import { useState } from 'react'
import {
  BugReportResponse,
  BugReportStatus,
} from '@/services/bugReportService'
import { useBugReports } from '@/hooks/useBugReports'
import { BugReportDetailModal } from './bug-report-detail-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { AlertTriangle, Eye, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const ERROR_TYPE_LABELS: Record<string, string> = {
  LOGIN_ACCOUNT: '1. Lỗi đăng nhập/tài khoản',
  UI_KATEX: '2. Lỗi giao diện/KaTeX',
  SUBMISSION_PROBLEM: '3. Lỗi nộp bài/tải đề',
  PERFORMANCE: '4. Lỗi tốc độ/phản hồi',
  OTHER: '5. Khác',
}

const STATUS_BADGES: Record<
  BugReportStatus,
  { label: string; className: string }
> = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold' },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold' },
  RESOLVED: { label: 'Đã giải quyết', className: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' },
}

export function BugReportsListClient() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [selectedReport, setSelectedReport] = useState<BugReportResponse | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const filterStatus = statusFilter !== 'ALL' ? (statusFilter as BugReportStatus) : undefined
  const { data, isLoading, refetch } = useBugReports({
    status: filterStatus,
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
                Quản lý Báo cáo lỗi Hệ thống
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Danh sách các sự cố do người dùng phản hồi. Theo dõi và cập nhật trạng thái xử lý kịp thời.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="rounded-xl bg-white gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 space-y-4 w-full">
          {/* Filter & Stats Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val)
                  setPage(0)
                }}
              >
                <SelectTrigger id="bug-report-status-filter" className="h-10 w-[200px] bg-white rounded-xl border border-border text-xs font-semibold">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả ({totalElements})</SelectItem>
                  <SelectItem value="PENDING">Chờ xử lý (PENDING)</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</SelectItem>
                  <SelectItem value="RESOLVED">Đã giải quyết (RESOLVED)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground font-medium shrink-0 self-end sm:self-auto">
              Múi giờ thời gian hiển thị: <span className="font-bold text-foreground">UTC+7 (Việt Nam)</span>
            </div>
          </div>

          {/* Table Data */}
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[70px] font-bold text-foreground text-center">STT</TableHead>
                  <TableHead className="font-bold text-foreground">Người gửi</TableHead>
                  <TableHead className="font-bold text-foreground">Loại lỗi sự cố</TableHead>
                  <TableHead className="font-bold text-foreground">Thời gian gửi (UTC+7)</TableHead>
                  <TableHead className="font-bold text-foreground text-center">Trạng thái</TableHead>
                  <TableHead className="w-[110px] font-bold text-foreground text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm font-medium">Đang tải dữ liệu báo cáo...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center text-muted-foreground">
                      Chưa có báo cáo sự cố nào phù hợp.
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
                            {ERROR_TYPE_LABELS[item.errorType] || item.errorType}
                          </span>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {formatDateTime(item.createdAt)}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge className={STATUS_BADGES[item.status]?.className || ''}>
                            {STATUS_BADGES[item.status]?.label || item.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(item)}
                            className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" /> Chi tiết
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
                    Hiển thị Trang <span className="font-bold text-foreground">{page + 1}</span> / {Math.max(1, totalPages)} (Tổng số <span className="font-bold text-foreground">{totalElements}</span> báo cáo)
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Số dòng/trang:</span>
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
                    <ChevronLeft className="h-4 w-4" /> Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || totalPages <= 1}
                    className="gap-1 text-xs bg-white rounded-xl"
                  >
                    Trang sau <ChevronRight className="h-4 w-4" />
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
