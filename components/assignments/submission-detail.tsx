'use client'

import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionApi } from '@/lib/api/submission'
import { assignmentApi } from '@/lib/api/assignment'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LatexToolbar } from '@/components/ui/latex-toolbar'
import { ChevronLeft, ChevronRight, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { extractDrawings } from '@/app/(dashboard)/assignments/[id]/_components/student-assignment-layout'
import { useForm } from 'react-hook-form'

const JsxGraphBoard = dynamic(() => import('@/components/ui/jsxgraph-board').then(mod => mod.JsxGraphBoard), { ssr: false })
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const gradeSchema = z.object({
  score: z
    .string()
    .min(1, 'Vui lòng nhập điểm số')
    .refine((val) => !isNaN(Number(val)), { message: 'Điểm phải là một số hợp lệ' })
    .refine((val) => Number(val) >= 0, { message: 'Điểm tối thiểu là 0' })
    .refine((val) => Number(val) <= 10, { message: 'Điểm tối đa là 10' })
    .refine(
      (val) => {
        const num = Number(val)
        return Math.round(num * 10) / 10 === num
      },
      { message: 'Điểm chỉ được lẻ tối đa 1 chữ số thập phân (ví dụ: 8.5)' }
    )
    .transform((val) => Number(val)),
  teacherFeedback: z.string().optional(),
})

type GradeFormValues = z.infer<typeof gradeSchema>

interface SubmissionDetailProps {
  submissionId: number
  assignmentId: number
}

export function SubmissionDetail({ submissionId, assignmentId }: SubmissionDetailProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: submission, isLoading: isSubLoading, isError: isSubError } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionApi.getSubmissionById(submissionId),
    enabled: !!submissionId,
  })

  const { data: assignment, isLoading: isAssignLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentApi.getAssignmentById(assignmentId),
    enabled: !!assignmentId,
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

  const onSubmit = (data: any) => {
    gradeMutation.mutate(data as GradeFormValues)
  }

  const feedbackRef = useRef<HTMLTextAreaElement>(null)

  const handleInsertLatex = (latexCommand: string) => {
    const textarea = feedbackRef.current
    const current = form.getValues('teacherFeedback') || ''

    if (!textarea) {
      // Fallback: no ref, wrap in $$ and append
      const isMathBlock = latexCommand.includes('\\begin')
      const wrapped = isMathBlock ? `$$ \n${latexCommand} \n$$` : `$$ ${latexCommand} $$`
      form.setValue('teacherFeedback', current + wrapped, { shouldValidate: true })
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = current.substring(0, start)
    const after = current.substring(end)
    const selectedText = current.substring(start, end)

    // Check if cursor is already inside a math context
    const countDoubleDollar = (before.match(/\$\$/g) || []).length
    const countSingleDollar = (before.replace(/\$\$/g, '').match(/\$/g) || []).length
    const isInsideMath = (countDoubleDollar % 2 !== 0) || (countSingleDollar % 2 !== 0)

    let cmd = latexCommand
    if (selectedText && cmd.includes('{ }')) {
      cmd = cmd.replace('{ }', `{${selectedText}}`)
    }

    const isMathBlock = cmd.includes('\\begin')
    let insertText = cmd

    if (!isInsideMath) {
      insertText = isMathBlock ? `$$ \n${cmd} \n$$` : `$$ ${cmd} $$`
    }

    const newVal = before + insertText + after
    form.setValue('teacherFeedback', newVal, { shouldValidate: true })

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      let newCursorPos = start + insertText.length
      const emptyBrackets = insertText.indexOf('{ }')
      if (emptyBrackets !== -1) {
        newCursorPos = start + emptyBrackets + 1
      } else if (!isInsideMath && !selectedText) {
        newCursorPos = isMathBlock ? start + insertText.length - 4 : start + insertText.length - 3
      }
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  if (isSubLoading || isAssignLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Skeleton className="h-[600px] lg:col-span-3" />
          <Skeleton className="h-[400px] lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (isSubError || !submission) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-red-600 text-center">
          Lỗi khi tải chi tiết bài nộp.
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

  const renderContentWithDrawings = (rawContent: string) => {
    if (!rawContent) return null
    const { content: cleanContent, extractedDrawings } = extractDrawings(rawContent)
    const parts = cleanContent.split(/(\[SHAPE_[a-zA-Z0-9_]+\])/g)

    return parts.map((part, index) => {
      const match = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)\]$/)
      if (match) {
        const shapeCode = match[1]
        const drawing = extractedDrawings.find((d: any) => d.shapeCode === shapeCode)
        if (drawing) {
          return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} />
        }
      }
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
        >
          {part}
        </ReactMarkdown>
      )
    })
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-20">
      {/* Header Điều Hướng */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href={`/assignments/${assignmentId}/submissions`}>
            <Button variant="ghost" size="sm" className="hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled title="Tính năng đang được phát triển">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Học sinh trước
          </Button>
          <span className="text-sm font-medium text-slate-600">
            -- / --
          </span>
          <Button variant="outline" size="sm" disabled title="Tính năng đang được phát triển">
            Học sinh tiếp theo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div>
          <Button
            form="grade-form"
            type="submit"
            disabled={gradeMutation.isPending || submission.status === 'DRAFT'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {gradeMutation.isPending ? 'Đang lưu...' : 'Lưu điểm & Lời phê'}
          </Button>
        </div>
      </div>

      {/* Main Layout 60/40 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Khu vực bên trái (60%): Bài làm & Đề bài */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="flex-1 shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-slate-800">{submission.studentName}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <span>Đã nộp lúc: {submission.submittedAt ? format(new Date(submission.submittedAt), 'dd/MM/yyyy HH:mm') : 'Chưa có thông tin'}</span>
                    {getStatusBadge(submission.status)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="submission" className="w-full">
                <div className="px-6 border-b border-slate-100">
                  <TabsList className="w-full justify-start bg-transparent p-0 space-x-6">
                    <TabsTrigger
                      value="submission"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
                    >
                      Bài làm của học sinh
                    </TabsTrigger>
                    <TabsTrigger
                      value="assignment"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
                    >
                      Đề bài gốc
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="submission" className="p-6 m-0 min-h-[400px] bg-slate-50/50">
                  <div className="prose prose-slate max-w-none bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    {submission.content
                      ? renderContentWithDrawings(submission.content)
                      : <p className="text-slate-400 italic">Bài nộp trống</p>
                    }
                  </div>
                </TabsContent>

                <TabsContent value="assignment" className="p-6 m-0 min-h-[400px] bg-slate-50/50">
                  {assignment ? (
                    <div className="prose prose-slate max-w-none bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h3 className="mt-0">{assignment.title}</h3>
                      {assignment.content
                        ? renderContentWithDrawings(assignment.content)
                        : <p className="text-slate-400 italic">Không có nội dung đề bài</p>
                      }
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-10">Đang tải đề bài...</div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Khu vực bên phải (40%): Chấm điểm (Sticky) */}
        <div className="lg:col-span-2 sticky top-24">
          <Card className="shadow-md border-blue-100">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">              <CardTitle className="text-xl text-blue-900">Khu vực chấm điểm</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form id="grade-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem className="w-1/2">
                        <FormLabel className="text-slate-700 font-semibold">Điểm số</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              className="text-lg font-medium pr-10 border-slate-300 focus-visible:ring-blue-500"
                              {...field}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-medium">
                              / 10
                            </div>
                          </div>
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
                        <FormLabel className="text-slate-700 font-semibold">Lời phê của giáo viên</FormLabel>
                        <div className="border border-slate-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                          <LatexToolbar onInsert={handleInsertLatex} />
                          <FormControl>
                            <Textarea
                              rows={8}
                              placeholder="Nhập nhận xét của bạn... Có thể gõ LaTeX như $\Delta = b^2 - 4ac$"
                              className="border-0 focus-visible:ring-0 rounded-none resize-none p-3"
                              {...field}
                              ref={(el) => {
                                field.ref(el)
                                feedbackRef.current = el
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Realtime Preview */}
                  {form.watch('teacherFeedback') && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                        <span>Bản xem trước</span>
                      </p>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="prose prose-sm prose-slate max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {form.watch('teacherFeedback') || ''}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
