'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { assignmentService } from '@/services/assignmentService'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/utils'

interface SheetSubmissionTableProps {
  sheetId: number
  classCode?: string
}

export function SheetSubmissionTable({ sheetId, classCode }: SheetSubmissionTableProps) {
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['sheet-submissions', sheetId, classCode, page],
    queryFn: () =>
      assignmentService.getCompletedStudentsBySheet(sheetId, {
        classCode: classCode || undefined,
        page,
        size: 20
      }),
  })

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên học sinh</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Thời gian nộp gần nhất</TableHead>
              <TableHead>Tổng điểm</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-red-500">
                  Lỗi khi tải dữ liệu: {(error as Error).message}
                </TableCell>
              </TableRow>
            ) : data?.content && data.content.length > 0 ? (
              data.content.map((sub: any) => (
                <TableRow key={sub.studentId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{sub.studentName}</span>
                      <span className="text-xs text-muted-foreground">{sub.studentEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {sub.completedExercisesCount} / {sub.totalExercisesCount} bài
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(sub.latestSubmittedAt) || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">{sub.totalScore !== null ? `${sub.totalScore.toFixed(1)} đ` : '-'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/assignments/${sub.firstAssignmentId}/submissions/${sub.firstSubmissionId}?sheetId=${sheetId}${classCode ? `&classCode=${classCode}` : ''}`}>
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                        Chấm điểm
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground flex-col gap-2">
                  <p>Chưa có học sinh nào nộp toàn bộ bài tập trong phiếu.</p>
                  <p className="text-xs">Lưu ý: Học sinh làm thiếu câu sẽ không hiển thị ở đây.</p>
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
            Trang trước
          </Button>
          <div className="text-sm text-muted-foreground">
            Trang {page + 1} / {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => (data.last ? old : old + 1))}
            disabled={data.last}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  )
}
