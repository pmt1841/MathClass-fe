'use client'

import { useState } from 'react'
import { useAdminLogs } from '@/hooks/useAdmin'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminLogsPage() {
  const [page, setPage] = useState(0)
  const [level, setLevel] = useState<string>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // If a date is selected, we need to convert it to ISO format for Spring Boot (e.g. 2026-07-15T00:00:00)
  const formatIsoDate = (dateString: string, isEnd: boolean = false) => {
    if (!dateString) return undefined
    return isEnd ? `${dateString}T23:59:59` : `${dateString}T00:00:00`
  }

  const { data, isLoading } = useAdminLogs(
    page,
    level === 'ALL' ? undefined : level,
    formatIsoDate(startDate, false),
    formatIsoDate(endDate, true)
  )

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Nhật ký Hệ thống</h2>
      </div>

      <div className="flex items-center space-x-2">
        <Select
          value={level}
          onValueChange={(val) => {
            setLevel(val)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Mức độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả mức độ</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARNING">WARNING</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
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
            setPage(0)
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead className="w-[180px]">Thời gian</TableHead>
              <TableHead className="w-[120px]">Cấp độ</TableHead>
              <TableHead className="w-[200px]">Actor (Email)</TableHead>
              <TableHead>Mô tả hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.content && data.content.length > 0 ? (
              data.content.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={log.level === 'ERROR' ? 'destructive' : log.level === 'WARNING' ? 'secondary' : 'default'}
                      className={
                        log.level === 'INFO' ? 'bg-blue-500 hover:bg-blue-600' :
                        log.level === 'WARNING' ? 'bg-amber-500 text-white hover:bg-amber-600' : ''
                      }
                    >
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.actor}</TableCell>
                  <TableCell>{log.action}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Không tìm thấy dữ liệu nhật ký nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trang trước
          </Button>
          <div className="text-sm text-muted-foreground">
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
      )}
    </div>
  )
}
