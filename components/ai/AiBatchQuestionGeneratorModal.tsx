'use client'

import React, { useState, useRef } from 'react'
import {
  Sparkles,
  Loader2,
  RefreshCw,
  X,
  UploadCloud,
  Trash2,
  FileCheck,
  BookOpen,
  Save,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import 'katex/dist/katex.min.css'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { sanitizeSchema } from '@/lib/markdown'
import { markdownComponents } from '@/components/ui/markdown-components'
import { normalizeKatexDelimiters } from '@/lib/utils'
import {
  aiBatchQuestionService,
  BatchGenerateQuestionsResponseDTO,
} from '@/services/aiBatchQuestionService'
import { assignmentService } from '@/services/assignmentService'

export interface IndividualAssignmentItem {
  id: string
  title: string
  content: string
}

interface AiBatchQuestionGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AiBatchQuestionGeneratorModal({
  isOpen,
  onClose,
  onSuccess,
}: AiBatchQuestionGeneratorModalProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [batchResponse, setBatchResponse] = useState<BatchGenerateQuestionsResponseDTO | null>(null)

  // Danh sách các bài tập lẻ đã được tách ra
  const [assignmentsList, setAssignmentsList] = useState<IndividualAssignmentItem[]>([])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('Dung lượng file tối đa là 15MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setTextContent('')
    setBatchResponse(null)
    setAssignmentsList([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile && !textContent.trim()) {
      toast.error('Vui lòng tải lên file đề thi (.docx, .pdf) hoặc nhập nội dung đề bài')
      return
    }

    setIsLoading(true)

    try {
      const result = await aiBatchQuestionService.batchGenerateQuestions({
        file: selectedFile || undefined,
        textContent: textContent.trim() || undefined,
        includeExplanation: false,
      })

      const separatedAssignments: IndividualAssignmentItem[] = (result.questions || []).map((q, idx) => ({
        id: q.id || `item_${idx + 1}`,
        title: q.title?.trim() || `Bài tập ${idx + 1}`,
        content: normalizeKatexDelimiters(q.content || ''),
      }))

      setBatchResponse(result)
      setAssignmentsList(separatedAssignments)
      toast.success(`AI đã đọc file và tách thành công ${separatedAssignments.length} bài tập!`)
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.message || ''
      const lower = serverMsg.toLowerCase()
      if (
        !serverMsg ||
        lower.includes('key') ||
        lower.includes('quota') ||
        lower.includes('429') ||
        lower.includes('resource_exhausted') ||
        lower.includes('exceeded') ||
        lower.includes('gemini') ||
        lower.includes('openai')
      ) {
        toast.error('Hệ thống AI đang bảo trì hoặc hết hạn ngạch. Vui lòng thử lại sau!')
      } else {
        toast.error(serverMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAssignment = (index: number) => {
    const updated = [...assignmentsList]
    updated.splice(index, 1)
    setAssignmentsList(updated)
    toast.info('Đã xóa bài tập khỏi danh sách tạo')
  }

  const handleUpdateTitle = (index: number, newTitle: string) => {
    const updated = [...assignmentsList]
    updated[index] = {
      ...updated[index],
      title: newTitle,
    }
    setAssignmentsList(updated)
  }

  const handleSaveAllAssignments = async () => {
    if (assignmentsList.length === 0) {
      toast.error('Danh sách bài tập đang trống')
      return
    }

    setIsSaving(true)

    try {
      const payload = assignmentsList.map((item) => {
        const itemContent = item.content.trim()
        const attachedImages = (batchResponse?.extractedImages || []).filter(
          (img) => img.imageCode && itemContent.includes(img.imageCode)
        )
        return {
          title: item.title.trim() || 'Bài tập mới',
          content: itemContent,
          allowResubmit: true,
          images: attachedImages.map((img) => ({
            imageCode: img.imageCode,
            imageUrl: img.imageUrl,
          })),
        }
      })

      await assignmentService.createBatchAssignments(payload)

      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['ai-credits'] })

      toast.success(`Đã tạo thành công ${assignmentsList.length} bài tập vào Kho bài tập!`)
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error: any) {
      console.error('Failed to create batch assignments:', error)
      const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo bài tập'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Tạo Hàng Loạt Bài Tập Từ File (AI Tách Đề)
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                  2 Credits / lượt
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tải lên file đề thi Word/PDF, AI sẽ tự động tách từng câu thành các bài tập bản nháp riêng biệt trong Kho bài tập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: UPLOAD FILE */}
          {!batchResponse && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-850/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc,.pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                      <FileCheck className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {selectedFile.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Nhấp để đổi file khác
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3.5 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                      <UploadCloud className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Kéo thả hoặc Nhấp để chọn file Word / PDF đề thi
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Hỗ trợ file Microsoft Word (.docx), PDF (.pdf), hoặc tài liệu văn bản (.txt)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Or manual text input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  Hoặc Dán nội dung đề thi trực tiếp vào đây:
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Dán toàn bộ nội dung đề bài gồm Bài 1, Bài 2, Bài 3... để AI tự động phân tách thành các bài tập độc lập..."
                  rows={4}
                  className="w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isLoading || (!selectedFile && !textContent.trim())}
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-indigo-500/25 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang đọc file & tách bài tập...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Tách bài tập bằng AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW SEPARATED INDIVIDUAL ASSIGNMENTS */}
          {batchResponse && (
            <div className="space-y-5">
              
              {/* Header Info Bar */}
              <div className="bg-slate-50 dark:bg-slate-850/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
                    Kết Quả Tách Đề Bài Tập Bằng AI
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Đã tách thành {assignmentsList.length} bài tập độc lập (Lưu dưới dạng bản nháp DRAFT)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Đổi file khác
                </button>
              </div>

              {/* Assignments List */}
              <div className="space-y-4">
                {assignmentsList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all p-4 space-y-3"
                  >
                    {/* Top Meta: Title & Delete */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="px-2.5 py-1 text-xs font-extrabold bg-indigo-600 text-white rounded-lg shrink-0">
                          Bài {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateTitle(idx, e.target.value)}
                          placeholder="Nhập tiêu đề bài tập..."
                          className="flex-1 text-sm font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 pb-0.5 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(idx)}
                        className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                        title="Xóa bài tập này khỏi danh sách tạo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase text-slate-400">
                        Nội dung đề bài:
                      </span>
                      <div className="prose prose-slate dark:prose-invert prose-xs max-w-none bg-slate-50/50 dark:bg-slate-850/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
                          components={markdownComponents}
                        >
                          {item.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {batchResponse && assignmentsList.length > 0 && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAllAssignments}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-indigo-500/25 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu {assignmentsList.length} bài tập vào Kho...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu tất cả ({assignmentsList.length} bài tập nháp) vào Kho
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
