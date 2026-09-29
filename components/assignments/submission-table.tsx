'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { submissionService } from '@/services/submissionService'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

interface SubmissionTableProps {
  assignmentId: number
  classCode?: string
}

export function SubmissionTable({ assignmentId, classCode }: SubmissionTableProps) {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [status, setStatus] = useState<string>('ALL')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchInput)
      setPage(0) // Reset to first page when search changes
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['submissions', assignmentId, page, debouncedKeyword, status],
    queryFn: () =>
      submissionService.getSubmissionsByAssignment({
        assignmentId,
        page,
        size: 10,
        keyword: debouncedKeyword || undefined,
        status: status !== 'ALL' ? status : undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-blue-500 hover:bg-blue-600">{t('Đã nộp')}</Badge>
      case 'GRADED':
        return <Badge className="bg-green-500 hover:bg-green-600">{t('Đã chấm')}</Badge>
      case 'LATE':
        return <Badge className="bg-red-500 hover:bg-red-600">{t('Trễ')}</Badge>
      case 'DRAFT':
        return <Badge variant="secondary">{t('Bản nháp')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Input
          placeholder={t('Tìm kiếm tên học sinh...')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val)
            setPage(0) // Reset page when filter changes
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('Chọn trạng thái')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('Tất cả')}</SelectItem>
            <SelectItem value="SUBMITTED">{t('Đã nộp')}</SelectItem>
            <SelectItem value="GRADED">{t('Đã chấm')}</SelectItem>
            <SelectItem value="LATE">{t('Trễ')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Tên học sinh')}</TableHead>
              <TableHead>{t('Thời gian nộp')}</TableHead>
              <TableHead>{t('Trạng thái')}</TableHead>
              <TableHead>{t('Điểm')}</TableHead>
              <TableHead className="text-right">{t('Hành động')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-red-500">
                  {t('Lỗi khi tải dữ liệu:')} {(error as Error).message}
                </TableCell>
              </TableRow>
            ) : data?.content && data.content.length > 0 ? (
              data.content.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.studentName}</TableCell>
                  <TableCell>
                    {formatDateTime(sub.submittedAt) || 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>{sub.score !== null ? sub.score : '-'}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/assignments/${assignmentId}/submissions/${sub.id}${classCode ? `?classCode=${classCode}` : ''}`}>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                        {t('Xem chi tiết')}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t('Không tìm thấy bài nộp nào.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => Math.max(old - 1, 0))}
            disabled={page === 0}
          >
            {t('Trang trước')}
          </Button>
          <div className="text-sm text-muted-foreground">
            {t('Trang')} {page + 1} / {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => (data.last ? old : old + 1))}
            disabled={data.last}
          >
            {t('Trang sau')}
          </Button>
        </div>
      )}
    </div>
  )
}
