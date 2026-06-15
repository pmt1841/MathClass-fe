'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionApi } from '@/lib/api/submission'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const gradeSchema = z.object({
  score: z.coerce.number().min(0, 'Điểm tối thiểu là 0').max(10, 'Điểm tối đa là 10'),
  teacherFeedback: z.string().optional(),
})

type GradeFormValues = z.infer<typeof gradeSchema>

interface SubmissionDetailProps {
  submissionId: number
}

export function SubmissionDetail({ submissionId }: SubmissionDetailProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: submission, isLoading, isError, error } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionApi.getSubmissionById(submissionId),
    enabled: !!submissionId,
  })

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      score: 0,
      teacherFeedback: '',
    },
    values: submission ? {
      score: submission.score ?? 0,
      teacherFeedback: submission.teacherFeedback ?? '',
    } : undefined
  })

  const gradeMutation = useMutation({
    mutationFn: (values: GradeFormValues) => 
      submissionApi.gradeSubmission(submissionId, values.score, values.teacherFeedback),
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Đã lưu điểm và nhận xét.',
      })
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] })
    },
    onError: (err: any) => {
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Có lỗi xảy ra khi lưu điểm.',
        variant: 'destructive',
      })
    }
  })

  const onSubmit = (data: GradeFormValues) => {
    gradeMutation.mutate(data)
  }

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
          <div className="border rounded-lg p-6 bg-white min-h-[300px] mb-6">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {submission.content || '*Bài nộp trống*'}
              </ReactMarkdown>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Chấm điểm & Nhận xét</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Điểm số (0-10)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0" max="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacherFeedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhận xét (Hỗ trợ Markdown & Toán học LaTeX)</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={5} 
                          placeholder="Nhập nhận xét của bạn..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {submission.teacherFeedback && form.watch('teacherFeedback') === submission.teacherFeedback && (
                   <div className="p-4 bg-slate-50 rounded-md border mt-2">
                     <p className="text-sm font-semibold mb-2 text-slate-500">Bản xem trước nhận xét hiện tại:</p>
                     <div className="prose prose-slate max-w-none text-sm">
                       <ReactMarkdown
                         remarkPlugins={[remarkMath]}
                         rehypePlugins={[rehypeKatex]}
                       >
                         {submission.teacherFeedback}
                       </ReactMarkdown>
                     </div>
                   </div>
                )}

                <Button type="submit" disabled={gradeMutation.isPending || submission.status === 'DRAFT'}>
                  {gradeMutation.isPending ? 'Đang lưu...' : 'Lưu điểm & Nhận xét'}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
