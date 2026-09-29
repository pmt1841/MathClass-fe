'use client'

import { useState } from 'react'
import { useAdminLogs } from '@/hooks/useAdmin'
import { SystemLog } from '@/services/adminService'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/ui/refresh-button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { ChevronLeft, ChevronRight, ScrollText, Calendar as CalendarIcon, ChevronDown, ChevronUp, Terminal, User as UserIcon, Activity } from 'lucide-react'
import { formatDateTime24h } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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

export default function AdminLogsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [level, setLevel] = useState<string>('ALL')
  const [resourceType, setResourceType] = useState<string>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)
  const [isTechOpen, setIsTechOpen] = useState(false)
  const [pageSize, setPageSize] = useState(10)

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

  const { data, isLoading, refetch } = useAdminLogs(
    page,
    level === 'ALL' ? undefined : level,
    resourceType === 'ALL' ? undefined : resourceType,
    formatIsoDate(startDate, false),
    formatIsoDate(endDate, true),
    pageSize
  )

  const LEVEL_LABELS: Record<string, string> = {
    INFO: 'Thông tin',
    WARNING: 'Cảnh báo',
    ERROR: 'Lỗi',
  }

  const RESOURCE_TYPE_LABELS: Record<string, string> = {
    AI_CONFIG: 'Cấu hình AI',
    USER: 'Người dùng',
    ROLE: 'Phân quyền',
    COMMUNITY_REPO: 'Kho tài nguyên',
    SYSTEM: 'Hệ thống',
    STORAGE: 'Lưu trữ Đám mây',
    CREDIT: 'Giao dịch Credit',
    BUG_REPORT: 'Báo cáo sự cố',
  }

  const ACTION_LABELS: Record<string, string> = {
    CREATE_AI_PROVIDER: 'Thêm mới Nhà cung cấp AI',
    UPDATE_AI_PROVIDER: 'Cập nhật thông tin Nhà cung cấp AI',
    DELETE_AI_PROVIDER: 'Xóa Nhà cung cấp AI',
    ADD_AI_API_KEY: 'Thêm mới API Key AI',
    DELETE_AI_API_KEY: 'Xóa API Key AI',
    PATCH_AI_API_KEY_STATUS: 'Thay đổi trạng thái API Key AI',
    UPDATE_AI_API_KEY: 'Cập nhật thông tin API Key AI',
    UPDATE_AI_TASK_CONFIG: 'Cập nhật cấu hình tác vụ AI',
    UPDATE_PROMPT: 'Cập nhật System Prompt',
    RESET_PROMPT: 'Khôi phục System Prompt về mặc định',
    ROLLBACK_PROMPT: 'Hoàn tác System Prompt về phiên bản trước',
  }

  const formatActionDescription = (action?: string) => {
    if (!action) return '---'
    const label = ACTION_LABELS[action] || action
    return t(label)
  }

  const renderStatusBadge = (status?: string) => {
    if (!status) return <span className="text-muted-foreground">---</span>
    const isSuccess = status === 'SUCCESS'
    return (
      <Badge
        variant={isSuccess ? 'outline' : 'destructive'}
        className={isSuccess ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''}
      >
        {isSuccess ? t('Thành công') : t('Thất bại')}
      </Badge>
    )
  }

  const renderResourceTypeBadge = (resType?: string) => {
    if (!resType) return <span className="text-muted-foreground">---</span>
    const label = RESOURCE_TYPE_LABELS[resType] || resType
    return (
      <Badge variant="secondary" className="font-medium text-xs">
        {t(label)}
      </Badge>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* ── Synchronized Header ── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ScrollText className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('Nhật ký Hệ thống')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('Theo dõi vết thao tác quản trị dữ liệu và nhật ký sự cố hệ thống.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={() => refetch()}
              title={t('Cập nhật danh sách nhật ký mới nhất')}
            />
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 space-y-4 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <Select
                value={level}
                onValueChange={(val) => {
                  setLevel(val)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[150px] h-10 bg-white rounded-xl text-xs font-semibold">
                  <SelectValue placeholder={t('Cấp độ')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('Tất cả cấp độ')}</SelectItem>
                  <SelectItem value="INFO">{t('Thông tin (INFO)')}</SelectItem>
                  <SelectItem value="WARNING">{t('Cảnh báo (WARNING)')}</SelectItem>
                  <SelectItem value="ERROR">{t('Lỗi (ERROR)')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={resourceType}
                onValueChange={(val) => {
                  setResourceType(val)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[180px] h-10 bg-white rounded-xl text-xs font-semibold">
                  <SelectValue placeholder={t('Danh mục')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('Tất cả danh mục')}</SelectItem>
                  <SelectItem value="AI_CONFIG">{t('Cấu hình AI')}</SelectItem>
                  <SelectItem value="STORAGE">{t('Lưu trữ Đám mây')}</SelectItem>
                  <SelectItem value="CREDIT">{t('Giao dịch Credit')}</SelectItem>
                  <SelectItem value="BUG_REPORT">{t('Báo cáo sự cố')}</SelectItem>
                  <SelectItem value="USER">{t('Người dùng')}</SelectItem>
                  <SelectItem value="ROLE">{t('Phân quyền')}</SelectItem>
                  <SelectItem value="COMMUNITY_REPO">{t('Kho tài nguyên')}</SelectItem>
                  <SelectItem value="SYSTEM">{t('Hệ thống')}</SelectItem>
                </SelectContent>
              </Select>

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

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setLevel('ALL')
                  setResourceType('ALL')
                  setPage(0)
                }}
                className="h-10 rounded-xl text-xs border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-xs font-medium"
              >
                {t('Xóa bộ lọc')}
              </Button>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium shrink-0 self-end sm:self-auto">
              <span>{t('Hiển thị:')}</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setPage(0)
                }}
              >
                <SelectTrigger id="log-page-size-select" className="h-10 w-[75px] text-xs font-bold bg-white rounded-xl border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span>/ {t('trang')}</span>
            </div>
          </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-[80px]">{t('STT')}</TableHead>
              <TableHead className="w-[170px]">{t('Thời gian')}</TableHead>
              <TableHead className="w-[100px]">{t('Cấp độ')}</TableHead>
              <TableHead className="w-[140px]">{t('Danh mục')}</TableHead>
              <TableHead className="w-[200px]">{t('Người thực hiện (Email)')}</TableHead>
              <TableHead>{t('Mô tả hành động')}</TableHead>

              <TableHead className="w-[140px]">{t('Địa chỉ IP')}</TableHead>
              <TableHead className="w-[110px] text-right">{t('Trạng thái')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.content && data.content.length > 0 ? (
              data.content.map((log, index) => {
                const stt = page * (data.size || 10) + index + 1
                return (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{stt}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-700">{formatDateTime24h(log.timestamp) || '---'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.level === 'ERROR'
                            ? 'destructive'
                            : log.level === 'WARNING'
                            ? 'secondary'
                            : 'default'
                        }
                        className={
                          log.level === 'INFO'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : log.level === 'WARNING'
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : ''
                        }
                      >
                        {(log.level && t(LEVEL_LABELS[log.level] || log.level)) || log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-slate-700">
                      {(log.resourceType && t(RESOURCE_TYPE_LABELS[log.resourceType] || log.resourceType)) || log.resourceType || '---'}
                    </TableCell>
                    <TableCell className="text-xs">{log.actor || t('Hệ thống')}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">
                      {formatActionDescription(log.action)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress || '---'}
                    </TableCell>
                    <TableCell className="text-right">{renderStatusBadge(log.status)}</TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {t('Không tìm thấy dữ liệu nhật ký nào.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            {t('Hiển thị {count} / {total} bản ghi log', { count: data.content.length, total: data.totalElements })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('Trang trước')}
            </Button>
            <div className="text-xs font-medium text-slate-600 px-2">
              {t('Trang')} {page + 1} / {data.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
              disabled={page >= data.totalPages - 1}
            >
              {t('Trang sau')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal Xem Chi tiết Log */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null)
            setIsTechOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Activity className="h-5 w-5 text-primary" />
              {t('Chi tiết Nhật ký Hệ thống #{id}', { id: selectedLog?.id })}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Thông tin chi tiết về ngữ cảnh thực thi thao tác và môi trường hệ thống.')}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-1 text-sm">
              {/* ── Khu vực Nghiệp vụ Quản trị viên (Mặc định hiển thị nổi bật) ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-1 font-medium">{t('Thời gian thực thi:')}</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatDateTime24h(selectedLog.timestamp) || '---'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1 font-medium">{t('Trạng thái:')}</span>
                    {renderStatusBadge(selectedLog.status)}
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1 font-medium">{t('Cấp độ:')}</span>
                    <Badge
                      variant={
                        selectedLog.level === 'ERROR'
                          ? 'destructive'
                          : selectedLog.level === 'WARNING'
                          ? 'secondary'
                          : 'default'
                      }
                      className={
                        selectedLog.level === 'INFO'
                          ? 'bg-blue-500'
                          : selectedLog.level === 'WARNING'
                          ? 'bg-amber-500 text-white'
                          : ''
                      }
                    >
                      {(selectedLog.level && t(LEVEL_LABELS[selectedLog.level] || selectedLog.level)) || selectedLog.level}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1 font-medium">{t('Danh mục phân hệ:')}</span>
                    {renderResourceTypeBadge(selectedLog.resourceType)}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                    {t('Người thực hiện:')}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.actor || t('Hệ thống')}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-1 text-xs font-medium">
                    {t('Mô tả hành động:')}
                  </span>
                  <div className="rounded-lg bg-white p-3 border border-slate-200 text-slate-800 text-xs leading-relaxed break-words shadow-2xs font-sans">
                    {formatActionDescription(selectedLog.action)}
                  </div>
                </div>
              </div>

              {/* ── Khu vực Thông tin Kỹ thuật (Thu gọn mặc định cho Dev & Kiểm toán) ── */}
              <Collapsible open={isTechOpen} onOpenChange={setIsTechOpen} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700 select-none cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-slate-500" />
                      {t('Thông tin kỹ thuật (Dành cho Kỹ thuật viên & Kiểm toán)')}
                    </span>
                    {isTechOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3.5 space-y-2.5 border-t border-slate-200 bg-slate-50/40 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-muted-foreground">{t('Mã tài nguyên (Resource ID):')}</span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {selectedLog.resourceId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-muted-foreground">{t('Địa chỉ IP:')}</span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {selectedLog.ipAddress || t('Không xác định')}
                    </span>
                  </div>
                  {selectedLog.userAgent && (
                    <div className="pt-1">
                      <span className="text-muted-foreground block mb-1">
                        {t('Thiết bị & Trình duyệt (User-Agent):')}
                      </span>
                      <div className="rounded bg-slate-100 p-2 text-slate-600 font-mono text-[11px] break-all leading-snug">
                        {selectedLog.userAgent}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  )
}


