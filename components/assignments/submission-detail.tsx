'use client'

import React, { useRef, useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionService } from '@/services/submissionService'
import { assignmentService } from '@/services/assignmentService'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ChevronLeft, ChevronRight, ArrowLeft, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { parseDateSafe } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
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
  classCode?: string
  sheetId?: number
}

export function SubmissionDetail({ submissionId, assignmentId, classCode, sheetId }: SubmissionDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null)
  const [navigatingSibling, setNavigatingSibling] = useState<number | null>(null)
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
    queryFn: () => submissionService.getSubmissionById(submissionId),
    enabled: !!submissionId,
  })

  const { data: assignment, isLoading: isAssignLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentService.getAssignmentById(assignmentId),
    enabled: !!assignmentId,
  })

  // Tự động kiểm tra trạng thái nộp bài của học sinh này trên tất cả các câu trong sheet
  const { data: siblingStatuses = {} } = useQuery<Record<number, string>>({
    queryKey: ['sheet-sibling-statuses', assignment?.sheetId, submission?.studentId, assignmentId],
    queryFn: async () => {
      if (!assignment?.sheetSiblings || !submission?.studentName) return {}
      const statuses: Record<number, string> = {}

      await Promise.all(
        assignment.sheetSiblings.map(async (sibling) => {
          if (sibling.id === assignmentId) {
            if (submission?.status) statuses[sibling.id] = submission.status
            return
          }
          try {
            const res = await submissionService.getSubmissionsByAssignment({
              assignmentId: sibling.id,
              keyword: submission.studentName,
              size: 10
            })
            if (res.content && res.content.length > 0) {
              const match = res.content.find(s => s.studentId === submission.studentId || s.studentName === submission.studentName)
              if (match) {
                statuses[sibling.id] = match.status
              }
            }
          } catch {
            // bỏ qua lỗi
          }
        })
      )
      return statuses
    },
    enabled: !!assignment?.sheetSiblings && assignment.sheetSiblings.length > 0 && !!submission?.studentName,
    staleTime: 60000,
  })

  const gradeMutation = useMutation({
    mutationFn: (values: GradeFormValues) =>
      submissionService.gradeSubmission(submissionId, values.score, values.teacherFeedback || ''),
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Đã lưu điểm và nhận xét.',
      })
      queryClient.setQueryData(['sheet-sibling-statuses', assignment?.sheetId, submission?.studentId, assignmentId], (old: Record<number, string> | undefined) => ({
        ...old,
        [assignmentId]: 'GRADED'
      }))
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-sibling-statuses'] })
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
    ...markdownComponents,
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
                  {comment.createdAt && parseDateSafe(comment.createdAt) ? format(parseDateSafe(comment.createdAt)!, 'HH:mm dd/MM/yyyy') : ''}
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
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}>
                {comment.content}
              </ReactMarkdown>
            </div>
          </PopoverContent>
        </Popover>
      )
    }
  }), [comments, isTeacher, user?.id, isDeleting, handleDeleteComment])

  const handleNavigateSibling = async (siblingId: number) => {
    if (!submission?.studentName) return
    setNavigatingSibling(siblingId)
    try {
      const res = await submissionService.getSubmissionsByAssignment({
        assignmentId: siblingId,
        keyword: submission.studentName,
        size: 10
      })
      if (res.content && res.content.length > 0) {
        // Tìm chính xác tên học sinh
        const exactMatch = res.content.find(s => s.studentName === submission.studentName)
        if (exactMatch) {
          router.push(`/assignments/${siblingId}/submissions/${exactMatch.id}?${sheetId ? `sheetId=${sheetId}&` : ''}${classCode ? `classCode=${classCode}` : ''}`)
        } else {
          toast({ title: 'Thông báo', description: 'Học sinh chưa mở câu này.' })
        }
      } else {
        toast({ title: 'Thông báo', description: 'Học sinh chưa mở câu này.' })
      }
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể tìm thấy bài làm', variant: 'destructive' })
    } finally {
      setNavigatingSibling(null)
    }
  }

  const memoizedRehypePlugins = useMemo(() => [
    rehypeRaw,
    [rehypeSanitize, sanitizeSchema],
    rehypeKatex,
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
    const parts = cleanContent.split(/(\[SHAPE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\]|\[IMAGE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\])/g)

    return parts.map((part, index) => {
      const match = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
      if (match) {
        const shapeCode = match[1]
        const drawing = extractedDrawings.find((d: any) => d.shapeCode === shapeCode)
        if (drawing) {
          let width: string | number = '100%'
          let height: string | number = 300
          if (match[2]) {
            const [w, h] = match[2].split('x')
            if (w) width = isNaN(Number(w)) ? w : Number(w)
            if (h) height = isNaN(Number(h)) ? h : Number(h)
          }
          return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} width={width} height={height} />
        }
      }

      const imageMatch = part.match(/^\[(IMAGE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
      if (imageMatch) {
        const imageCode = imageMatch[1]
        const image = assignment?.images?.find((img: any) => img.imageCode === `[${imageCode}]`)
        if (image) {
          let width: string | number = 'auto'
          let height: string | number = 'auto'
          if (imageMatch[2]) {
            const [w, h] = imageMatch[2].split('x')
            if (w) width = isNaN(Number(w)) ? w : Number(w)
            if (h) height = isNaN(Number(h)) ? h : Number(h)
          }
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={index} src={image.imageUrl} alt="Assignment image" className="max-w-full rounded-lg my-4 shadow-sm border border-slate-200" style={{ width, height }} />
        }
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
          <Link href={sheetId ? `/assignments/sheets/${sheetId}/submissions${classCode ? `?classCode=${classCode}` : ''}` : `/assignments/${assignmentId}/submissions${classCode ? `?classCode=${classCode}` : ''}`} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg text-slate-800">{submission.studentName}</span>
            {getStatusBadge(submission.status)}

            {/* Sheet Siblings Navigation */}
            {assignment?.sheetSiblings && assignment.sheetSiblings.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-4">
                {assignment.sheetSiblings.map((sibling, idx: number) => {
                  const isActive = sibling.id === assignmentId
                  const currentStatus = isActive
                    ? submission?.status
                    : (siblingStatuses[sibling.id] || sibling.submissionStatus)
                  const isGraded = currentStatus === 'GRADED'

                  return (
                    <button
                      key={sibling.id}
                      onClick={() => !isActive && handleNavigateSibling(sibling.id)}
                      disabled={navigatingSibling !== null}
                      className={`
                        w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all shadow-sm
                        ${isActive
                          ? isGraded
                            ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-600 text-white'
                            : 'ring-2 ring-primary ring-offset-1 bg-primary text-white'
                          : isGraded
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border border-slate-200'}
                        ${navigatingSibling === sibling.id ? 'opacity-50 cursor-wait' : ''}
                      `}
                      title={sibling.title}
                    >
                      {navigatingSibling === sibling.id ? <Loader2 className="w-3 h-3 animate-spin" /> : idx + 1}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {isTeacher && (
            <SubmissionGradeForm
              initialScore={submission.score ?? 0}
              initialFeedback={submission.teacherFeedback ?? ''}
              isSubmitting={gradeMutation.isPending}
              isDraft={submission.status === 'DRAFT'}
              maxScore={assignment?.maxScore || 10}
              onSubmit={handleGradeSubmit}
            />
          )}
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
                Nộp lúc: {submission.submittedAt && parseDateSafe(submission.submittedAt) ? format(parseDateSafe(submission.submittedAt)!, 'dd/MM/yyyy HH:mm') : 'Chưa rõ'}
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
