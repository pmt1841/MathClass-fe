'use client'

import React, { useMemo } from 'react'
import { User, GitFork, Loader2, BookOpen, AlertCircle } from 'lucide-react'
import { useLibraryAssignmentDetail } from '@/hooks/useLibrary'
import { AssignmentTagPills } from '@/components/assignments/assignment-tag-pills'
import { PermissionGuard } from '@/components/ui/with-permission'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
import 'katex/dist/katex.min.css'
import dynamic from 'next/dynamic'
import { extractDrawings } from '@/lib/editor-utils'
import type { AssignmentDrawingResponse, AssignmentImageResponse } from '@/services/assignmentService'

const JsxGraphBoard = dynamic(
  () => import('@/components/ui/jsxgraph-board').then((mod) => mod.JsxGraphBoard),
  { ssr: false }
)

interface LibraryAssignmentDetailModalProps {
  assignmentId: number | null
  onClose: () => void
  onClone: (id: number, title: string, isSheet: boolean, authorName?: string) => void
}

export function LibraryAssignmentDetailModal({
  assignmentId,
  onClose,
  onClone,
}: LibraryAssignmentDetailModalProps) {
  const { data: assignment, isLoading, isError } = useLibraryAssignmentDetail(assignmentId)

  const katexConfig = useMemo(
    () => ({
      throwOnError: false,
      errorColor: '#64748b',
      macros: { '\\placeholder': '\\square' },
    }),
    []
  )

  const baseRehypePlugins = useMemo(
    () => [rehypeRaw, [rehypeSanitize, sanitizeSchema], [rehypeKatex, katexConfig]],
    [katexConfig]
  )

  const renderedContent = useMemo(() => {
    if (!assignment?.content) return null

    const { content: pureContent, extractedDrawings } = extractDrawings(assignment.content)
    const drawings = assignment.drawings && assignment.drawings.length > 0 ? assignment.drawings : extractedDrawings

    const parts = pureContent.split(/(\[SHAPE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\]|\[IMAGE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\])/g)

    return parts.map((part, index) => {
      const match = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
      if (match) {
        const shapeCode = match[1]
        const drawing = drawings?.find((d: AssignmentDrawingResponse) => d.shapeCode === shapeCode)
        if (drawing) {
          let width: string | number = '100%'
          let height: string | number = 300
          if (match[2]) {
            const [w, h] = match[2].split('x')
            if (w) width = isNaN(Number(w)) ? w : Number(w)
            if (h) height = isNaN(Number(h)) ? h : Number(h)
          }
          return (
            <JsxGraphBoard
              key={index}
              shapeCode={shapeCode}
              jsxGraphData={drawing.jsxGraphData}
              width={width}
              height={height}
            />
          )
        }
      }

      const imageMatch = part.match(/^\[(IMAGE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
      if (imageMatch) {
        const imageCode = imageMatch[1]
        const image = assignment.images?.find((img: AssignmentImageResponse) => img.imageCode === `[${imageCode}]`)
        if (image) {
          let width: string | number = 'auto'
          let height: string | number = 'auto'
          if (imageMatch[2]) {
            const [w, h] = imageMatch[2].split('x')
            if (w) width = isNaN(Number(w)) ? w : Number(w)
            if (h) height = isNaN(Number(h)) ? h : Number(h)
          }
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              src={image.imageUrl}
              alt="Hình đính kèm bài tập"
              className="max-w-full rounded-xl my-4 shadow-sm border border-slate-200"
              style={{ width, height }}
            />
          )
        }
      }

      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={baseRehypePlugins as any}
          components={markdownComponents}
        >
          {part}
        </ReactMarkdown>
      )
    })
  }, [assignment, baseRehypePlugins])

  if (!assignmentId) return null

  return (
    <Dialog open={!!assignmentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Bài tập cộng đồng
                </span>
                {assignment?.teacherName && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>Tác giả: <strong>{assignment.teacherName}</strong></span>
                  </div>
                )}
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 leading-snug">
                {isLoading ? 'Đang tải chi tiết bài tập...' : assignment?.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Xem trước nội dung chi tiết bài tập từ thư viện cộng đồng
              </DialogDescription>
              {assignment?.tags && assignment.tags.length > 0 && (
                <div className="pt-1">
                  <AssignmentTagPills tags={assignment.tags} />
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Đang tải đề bài từ thư viện...</p>
            </div>
          ) : isError || !assignment ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-rose-50/50 border border-rose-100 rounded-xl p-6">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-sm font-semibold text-rose-800">Không thể tải nội dung bài tập này</p>
              <p className="text-xs text-muted-foreground">Có thể bài tập đã bị gỡ bỏ hoặc bạn không có quyền xem.</p>
            </div>
          ) : (
            <>
              {/* Mô tả */}
              {assignment.description && (
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả bài tập</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{assignment.description}</p>
                </div>
              )}

              {/* Nội dung đề bài */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-slate-800 text-base">Đề bài chi tiết</h3>
                </div>

                <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed">
                  {renderedContent}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-slate-100 bg-white flex items-center justify-between sm:justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            Đóng
          </button>

          {assignment && (
            <PermissionGuard permission="library:clone">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onClone(assignment.id, assignment.title, false, assignment.teacherName)
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <GitFork className="h-4 w-4" />
                Clone về kho cá nhân
              </button>
            </PermissionGuard>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
