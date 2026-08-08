'use client'

import React from 'react'
import { Loader2, Sparkles, X, Check, AlertTriangle, Wand2, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AiGradingResult } from '@/services/submissionAiGradingService'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
import 'katex/dist/katex.min.css'

interface AiGradingPanelProps {
  open: boolean
  isGrading: boolean
  error: string | null
  insufficientCredit?: boolean
  result: AiGradingResult | null
  studentName: string
  maxScore: number
  onClose: () => void
  onRetry: () => void
  onUseDraft: (result: AiGradingResult) => void
}

/**
 * MAT-250: Panel hiển thị kết quả AI chấm sơ bộ.
 *
 * Hiển thị 3 khối thông tin:
 *   1. Đối chiếu hình vẽ Canvas (danh sách lỗi so với hình mẫu)
 *   2. Điểm số dự kiến của AI
 *   3. Dự thảo lời nhận xét (Markdown + LaTeX)
 *
 * Giáo viên bấm "Dùng điểm & nhận xét này" để pre-fill form chấm điểm,
 * sau đó vẫn toàn quyền chỉnh sửa trước khi nhấn "Lưu điểm".
 */
export function AiGradingPanel({
  open,
  isGrading,
  error,
  insufficientCredit = false,
  result,
  studentName,
  maxScore,
  onClose,
  onRetry,
  onUseDraft,
}: AiGradingPanelProps) {
  if (!open) return null

  const drawingIssues = result?.drawingIssues || []

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-500 via-purple-600 to-blue-600 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-violet-200" />
            <h3 className="text-lg font-bold">AI chấm sơ bộ - {studentName}</h3>
          </div>
          <div className="flex items-center gap-3">
            {!isGrading && result && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-white/20 text-white backdrop-blur-md">
                Điểm đề xuất: {result.suggestedScore}/{maxScore}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {isGrading && (
            <div className="p-6 bg-violet-50/60 border border-violet-200 rounded-xl flex items-center gap-3 text-violet-800 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600 shrink-0" />
              <div className="text-sm font-medium">
                AI đang đối chiếu hình vẽ Canvas với hình mẫu và chấm sơ bộ bài tự luận...
              </div>
            </div>
          )}

          {error && !isGrading && insufficientCredit && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">
                  Bạn đã hết credit AI. Vui lòng mua thêm credit để sử dụng tính năng AI chấm sơ bộ.
                </p>
              </div>
              <Link href="/credits" passHref>
                <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Mua thêm credit
                </Button>
              </Link>
            </div>
          )}

          {error && !isGrading && !insufficientCredit && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {result && !isGrading && (
            <>
              {/* 1. Đối chiếu hình vẽ Canvas */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-violet-600" />
                  Đối chiếu hình vẽ Canvas với hình mẫu
                </h4>
                {result.hasCanvasComparison === false ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    Bài tập này không có hình vẽ Canvas mẫu để đối chiếu — AI chỉ chấm phần tự luận.
                  </p>
                ) : drawingIssues.length === 0 ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                    <Check className="w-4 h-4 shrink-0" />
                    Hình vẽ khớp với hình mẫu, không phát hiện lỗi.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {drawingIssues.map((issue, idx) => (
                      <li key={idx} className="bg-rose-50/60 border border-rose-200 rounded-lg p-3 text-sm">
                        <span className="font-semibold text-rose-800 block">{issue.issue}</span>
                        {issue.detail && (
                          <span className="text-rose-600 text-xs mt-0.5 block">{issue.detail}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 2. Điểm số dự kiến */}
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div>
                  <p className="text-sm font-bold text-blue-900">Điểm số dự kiến</p>
                  <p className="text-xs text-blue-600">Bạn có thể chỉnh sửa trước khi lưu.</p>
                </div>
                <div className="text-3xl font-extrabold text-blue-700">
                  {result.suggestedScore}
                  <span className="text-base font-semibold text-blue-400"> / {maxScore}</span>
                </div>
              </div>

              {/* 3. Dự thảo lời nhận xét */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-violet-600" />
                  Dự thảo lời nhận xét
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 prose prose-slate prose-sm max-w-none text-slate-800 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
                    components={markdownComponents}
                  >
                    {result.draftFeedback}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200 shrink-0 text-xs text-slate-500">
          <span>Kết quả là gợi ý của AI — giáo viên có toàn quyền chỉnh sửa trước khi gửi cho học sinh.</span>
          <div className="flex items-center gap-2">
            {error && !isGrading && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Thử lại
              </Button>
            )}
            {result && !isGrading && (
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => onUseDraft(result)}>
                <Check className="w-4 h-4 mr-1.5" />
                Dùng điểm & nhận xét này
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

