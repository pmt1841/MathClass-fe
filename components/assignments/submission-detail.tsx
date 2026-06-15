'use client'

import { useQuery } from '@tanstack/react-query'
import { submissionApi } from '@/lib/api/submission'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface SubmissionDetailProps {
  submissionId: number
}

export function SubmissionDetail({ submissionId }: SubmissionDetailProps) {
  const { data: submission, isLoading, isError, error } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionApi.getSubmissionById(submissionId),
    enabled: !!submissionId,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !submission) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-red-600 text-center">
          Lỗi khi tải chi tiết bài nộp: {(error as Error)?.message || 'Không tìm thấy bài nộp.'}
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-blue-500">Đã nộp</Badge>
      case 'GRADED':
        return <Badge className="bg-green-500">Đã chấm</Badge>
      case 'LATE':
        return <Badge className="bg-red-500">Trễ</Badge>
      case 'DRAFT':
        return <Badge variant="secondary">Bản nháp</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{submission.studentName}</CardTitle>
              <CardDescription className="mt-1">
                Đã nộp lúc:{' '}
                {submission.submittedAt
                  ? format(new Date(submission.submittedAt), 'dd/MM/yyyy HH:mm')
                  : 'Chưa có thông tin'}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(submission.status)}
              {submission.score !== null && (
                <div className="text-lg font-semibold text-green-600">
                  Điểm: {submission.score}/10
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white min-h-[300px]">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {submission.content || '*Bài nộp trống*'}
              </ReactMarkdown>
            </div>
          </div>

          {/* Hiển thị nhận xét của giáo viên nếu có */}
          {submission.teacherFeedback && (
            <div className="mt-6 border rounded-lg p-6 bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-4">Nhận xét của giáo viên:</h4>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {submission.teacherFeedback}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
