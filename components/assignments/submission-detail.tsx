'use client'

import React, { useRef, useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionApi } from '@/lib/api/submission'
import { assignmentApi } from '@/lib/api/assignment'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ChevronLeft, ChevronRight, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { extractDrawings } from '@/app/(dashboard)/assignments/[id]/_components/student-assignment-layout'
import { useSubmissionComments } from '@/hooks/useSubmissionComments'
import { InlineCommentPopover } from './inline-comment-popover'
import rehypeMarkComments from '@/lib/rehype-mark-comments'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/useAuth'

import { useTextSelection } from '@/hooks/useTextSelection'
import { SubmissionGradeForm, GradeFormValues } from './submission-grade-form'
import { handleApiError } from '@/lib/utils/error-handler'

const JsxGraphBoard = dynamic(() => import('@/components/ui/jsxgraph-board').then(mod => mod.JsxGraphBoard), { ssr: false })

interface SubmissionDetailProps {
  submissionId: number
  assignmentId: number
}

export function SubmissionDetail({ submissionId, assignmentId }: SubmissionDetailProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null)
  const { user } = useAuth()
  const isTeacher = user?.role === 'TEACHER'

  const {
    comments = [],
    addComment,
    isAdding,
    deleteComment,
    isDeleting
  } = useSubmissionComments(submissionId)

  const { selectionData, handleMouseUp, clearSelection } = useTextSelection(contentContainerRef)

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

  const gradeMutation = useMutation({
    mutationFn: (values: GradeFormValues) =>
      submissionApi.gradeSubmission(submissionId, values.score, values.teacherFeedback || ''),
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Đã lưu điểm và nhận xét.',
      })
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] })
    },
    onError: (err) => {
      toast({
        title: 'Lỗi',
        description: handleApiError(err, 'Có lỗi xảy ra khi lưu điểm.'),
        variant: 'destructive',
      })
    }
  })

  const handleGradeSubmit = (values: GradeFormValues) => {
    gradeMutation.mutate(values)
  }

  const handleAddInlineComment = async (content: string) => {
    if (!selectionData) return
    try {
      await addComment({
        quoteText: selectionData.quoteText,
        occurrenceIndex: selectionData.occurrenceIndex,
        content
      })
      toast({ title: 'Thành công', description: 'Đã thêm nhận xét.' })
      clearSelection()
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: handleApiError(err, 'Có lỗi xảy ra khi thêm nhận xét.'),
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      await deleteComment(commentId)
      toast({ title: 'Thành công', description: 'Đã xóa nhận xét.' })
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: handleApiError(err, 'Có lỗi xảy ra khi xóa.'),
        variant: 'destructive'
      })
    }
  }, [deleteComment, toast])

  const memoizedComponents = useMemo(() => ({
    mark: ({ node, ...props }: any) => {
      const id = Number(props['data-comment-id'])
      const comment = comments.find((c: any) => c.id === id)
      if (!comment) return <mark {...props} />
      
      return (
        <Popover>
          <PopoverTrigger asChild>
            <mark
              {...props}
              className="bg-yellow-200 hover:bg-yellow-300 cursor-pointer transition-colors"
            />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 shadow-xl z-[9999]">
            <div className="flex justify-between items-start mb-2 border-b pb-2">
              <div>
                <div className="font-semibold text-sm text-slate-800">{comment.teacherName}</div>
                <div className="text-[10px] text-slate-500">
                  {format(new Date(comment.createdAt), 'HH:mm dd/MM/yyyy')}
                </div>
              </div>
              {isTeacher && comment.teacherId === user?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa nhận xét này không? Hành động này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="prose prose-sm prose-slate max-w-none mt-2">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                {comment.content}
              </ReactMarkdown>
            </div>
          </PopoverContent>
        </Popover>
      )
    }
  }), [comments, isTeacher, user?.id, isDeleting, handleDeleteComment])

  const memoizedRehypePlugins = useMemo(() => [
    rehypeKatex,
    rehypeRaw,
    [rehypeMarkComments, { comments, activeCommentId }]
  ], [comments, activeCommentId])

  const memoizedRemarkPlugins = useMemo(() => [remarkMath, remarkGfm], [])

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
      case 'SUBMITTED': return <Badge className="bg-blue-500">Đã nộp</Badge>
      case 'GRADED': return <Badge className="bg-green-500">Đã chấm</Badge>
      case 'LATE': return <Badge className="bg-red-500">Trễ</Badge>
      case 'DRAFT': return <Badge variant="secondary">Bản nháp</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderContentWithDrawings = (rawContent: string) => {
    if (!rawContent) return null
    const { content: cleanContent, extractedDrawings } = extractDrawings(rawContent)
    const parts = cleanContent.split(/(\[SHAPE_[a-zA-Z0-9_]+\]|\[IMAGE_[a-zA-Z0-9_]+\])/g)

    return parts.map((part, index) => {
      const match = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)\]$/)
      if (match) {
        const shapeCode = match[1]
        const drawing = extractedDrawings.find((d: any) => d.shapeCode === shapeCode)
        if (drawing) return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} />
      }

      const imageMatch = part.match(/^(\[IMAGE_[a-zA-Z0-9_]+\])$/)
      if (imageMatch) {
        const imageCode = imageMatch[1]
        const image = assignment?.images?.find((img: any) => img.imageCode === imageCode)
        if (image) return <img key={index} src={image.imageUrl} alt="Assignment image" className="max-w-full h-auto rounded-lg my-4 shadow-sm border border-slate-200" />
      }

      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={memoizedRemarkPlugins}
          rehypePlugins={memoizedRehypePlugins as any}
          components={memoizedComponents}
        >
          {part}
        </ReactMarkdown>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-muted/30">
      {/* Header Điều Hướng & Thông tin chung */}
      <div className="flex items-center justify-between bg-white px-6 py-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-6">
          <Link href={`/assignments/${assignmentId}/submissions`} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg text-slate-800">{submission.studentName}</span>
            {getStatusBadge(submission.status)}
          </div>

          {isTeacher && (
            <SubmissionGradeForm 
              initialScore={submission.score ?? 0}
              initialFeedback={submission.teacherFeedback ?? ''}
              isSubmitting={gradeMutation.isPending}
              isDraft={submission.status === 'DRAFT'}
              onSubmit={handleGradeSubmit}
            />
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 bg-slate-50 rounded-lg px-2 py-1 border border-slate-200">
            <Button variant="ghost" size="icon" disabled className="h-7 w-7 text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium">-- / --</span>
            <Button variant="ghost" size="icon" disabled className="h-7 w-7 text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout using PanelGroup */}
      <div className="flex-1 min-h-0 p-4">
        <PanelGroup direction="horizontal" className="h-full w-full rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">

          {/* Trái: Bài làm */}
          <Panel defaultSize={60} minSize={30} className="flex flex-col h-full bg-slate-50/30">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                Bài làm của học sinh
              </h3>
              <div className="text-xs text-slate-500 font-medium">
                Nộp lúc: {submission.submittedAt ? format(new Date(submission.submittedAt), 'dd/MM/yyyy HH:mm') : 'Chưa rõ'}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div
                ref={contentContainerRef}
                className="relative prose prose-slate max-w-none min-h-full"
                onMouseUp={handleMouseUp}
              >
                <InlineCommentPopover
                  position={selectionData?.position || null}
                  isAdding={isAdding}
                  onAddComment={handleAddInlineComment}
                  onClose={clearSelection}
                />
                {submission.content
                  ? renderContentWithDrawings(submission.content)
                  : <p className="text-slate-400 italic">Bài nộp trống</p>
                }
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-slate-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize flex flex-col justify-center items-center">
            <div className="h-8 w-1 rounded-full bg-slate-400/50" />
          </PanelResizeHandle>

          {/* Phải: Đề bài gốc */}
          <Panel defaultSize={40} minSize={20} className="flex flex-col h-full bg-slate-50/50">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 shrink-0">
              <h3 className="font-semibold text-slate-700">Đề bài gốc</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {assignment ? (
                <div className="prose prose-slate max-w-none">
                  <h2 className="mt-0 text-xl text-slate-800">{assignment.title}</h2>
                  {assignment.content
                    ? renderContentWithDrawings(assignment.content)
                    : <p className="text-slate-400 italic">Không có nội dung đề bài</p>
                  }
                </div>
              ) : (
                <div className="text-center text-slate-500 py-10">Đang tải đề bài...</div>
              )}
            </div>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  )
}
