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
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { format } from 'date-fns'
import { parseDateSafe } from '@/lib/utils'

export default function AdminLogsPage() {
  const [page, setPage] = useState(0)
  const [level, setLevel] = useState<string>('ALL')
  const [resourceType, setResourceType] = useState<string>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)

  const formatIsoDate = (dateString: string, isEnd: boolean = false) => {
    if (!dateString) return undefined
    let cleanDate = dateString.trim()
    if (cleanDate.includes('/')) {
      cleanDate = cleanDate.replace(/\//g, '-')
    }
    const parts = cleanDate.split('-')
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        // DD-MM-YYYY -> YYYY-MM-DD
        cleanDate = `${parts[2]}-${parts[1]}-${parts[0]}`
      }
    }
    return isEnd ? `${cleanDate}T23:59:59` : `${cleanDate}T00:00:00`
  }

  const { data, isLoading } = useAdminLogs(
    page,
    level === 'ALL' ? undefined : level,
    resourceType === 'ALL' ? undefined : resourceType,
    formatIsoDate(startDate, false),
    formatIsoDate(endDate, true)
  )

  const formatDateTime = (timestamp: string) => {
    if (!timestamp) return '---'
    const date = parseDateSafe(timestamp)
    if (!date) return '---'
    return format(date, 'HH:mm:ss dd/MM/yyyy')
  }

  const renderStatusBadge = (status?: string) => {
    if (!status) return <span className="text-muted-foreground">---</span>
    const isSuccess = status === 'SUCCESS'
    return (
      <Badge
        variant={isSuccess ? 'outline' : 'destructive'}
        className={isSuccess ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''}
      >
        {status}
      </Badge>
    )
  }

  const renderResourceTypeBadge = (resType?: string) => {
    if (!resType) return <span className="text-muted-foreground">---</span>
    return (
      <Badge variant="secondary" className="font-mono text-xs">
        {resType}
      </Badge>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nhật ký Hệ thống</h2>
          <p className="text-sm text-muted-foreground">
            Theo dõi vết thao tác quản trị dữ liệu và nhật ký sự cố hệ thống.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={level}
          onValueChange={(val) => {
            setLevel(val)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Cấp độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả cấp độ</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARNING">WARNING</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={resourceType}
          onValueChange={(val) => {
            setResourceType(val)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả danh mục</SelectItem>
            <SelectItem value="USER">USER (Người dùng)</SelectItem>
            <SelectItem value="ROLE">ROLE (Phân quyền)</SelectItem>
            <SelectItem value="COMMUNITY_REPO">COMMUNITY_REPO (Kho tài nguyên)</SelectItem>
            <SelectItem value="SYSTEM">SYSTEM (Hệ thống)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Từ ngày:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(0)
            }}
            className="w-[150px]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Đến ngày:</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(0)
            }}
            className="w-[150px]"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setStartDate('')
            setEndDate('')
            setLevel('ALL')
            setResourceType('ALL')
            setPage(0)
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-[80px]">STT</TableHead>
              <TableHead className="w-[170px]">Thời gian</TableHead>
              <TableHead className="w-[100px]">Cấp độ</TableHead>
              <TableHead className="w-[140px]">Danh mục</TableHead>
              <TableHead className="w-[200px]">Actor (Email)</TableHead>
              <TableHead>Mô tả hành động</TableHead>

              <TableHead className="w-[140px]">Địa chỉ IP</TableHead>
              <TableHead className="w-[110px] text-right">Trạng thái</TableHead>
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
                    <TableCell className="text-xs">{formatDateTime(log.timestamp)}</TableCell>
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
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-slate-700">
                      {log.resourceType}
                    </TableCell>
                    <TableCell className="text-xs">{log.actor || 'Hệ thống'}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">
                      {log.action}
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
                  Không tìm thấy dữ liệu nhật ký nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Hiển thị {data.content.length} / {data.totalElements} bản ghi log
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trang trước
            </Button>
            <div className="text-xs font-medium text-slate-600 px-2">
              Trang {page + 1} / {data.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
              disabled={page >= data.totalPages - 1}
            >
              Trang sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal Xem Chi tiết Log */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-blue-600" />
              Chi tiết Nhật ký Hệ thống #{selectedLog?.id}
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về ngữ cảnh thực thi thao tác và môi trường client.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2 text-sm">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border text-xs">
                <div>
                  <span className="text-muted-foreground block mb-1">Thời gian thực thi:</span>
                  <span className="font-semibold">{formatDateTime(selectedLog.timestamp)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Trạng thái:</span>
                  {renderStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Cấp độ (Level):</span>
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
                    {selectedLog.level}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Danh mục (Resource Type):</span>
                  {renderResourceTypeBadge(selectedLog.resourceType)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Actor (Email/User):</span>
                  <span className="font-medium">{selectedLog.actor}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Resource ID:</span>
                  <span className="font-mono">{selectedLog.resourceId || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Client IP Address:</span>
                  <span className="font-mono">{selectedLog.ipAddress || 'Unknown'}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block mb-1 font-medium">
                  Mô tả hành động:
                </span>
                <div className="rounded-md bg-slate-100 p-3 text-slate-800 font-mono text-xs whitespace-pre-wrap">
                  {selectedLog.action}
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <span className="text-muted-foreground block mb-1 font-medium">
                    User-Agent (Trình duyệt / Thiết bị):
                  </span>
                  <div className="rounded-md bg-slate-100 p-3 text-slate-700 font-mono text-[11px] break-all">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
