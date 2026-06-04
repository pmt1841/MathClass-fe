'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Save, Send, Eye, Edit3, Image as ImageIcon } from 'lucide-react'

const assignmentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bài tập không được để trống'),
  description: z.string().min(1, 'Mô tả bài tập không được để trống')
})

export type AssignmentFormValues = z.infer<typeof assignmentSchema>

interface AssignmentFormProps {
  onSubmitDraft: (data: AssignmentFormValues) => void
  onPublishClick: (data: AssignmentFormValues) => void
  isSubmitting?: boolean
}

export function AssignmentForm({ onSubmitDraft, onPublishClick, isSubmitting }: AssignmentFormProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: ''
    },
    mode: 'onChange'
  })

  const descriptionValue = watch('description')

  const handleDraft = (data: AssignmentFormValues) => {
    onSubmitDraft(data)
  }

  const handlePublish = (data: AssignmentFormValues) => {
    onPublishClick(data)
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6">
      <div className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Tiêu đề bài tập <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder="Nhập tiêu đề (VD: Bài tập giải tích cuối kỳ)"
            className={`w-full h-11 px-4 rounded-xl border bg-slate-50/50 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/15 ${
              errors.title ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
            }`}
          />
          {errors.title && (
            <p className="text-xs text-destructive mt-1.5 font-medium">{errors.title.message}</p>
          )}
        </div>

        {/* Description Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Nội dung mô tả <span className="text-destructive">*</span>
            </label>
            <div className="flex bg-slate-100/80 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'edit'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Xem trước
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Hỗ trợ Markdown và công thức Toán học LaTeX. Đặt công thức trong ký hiệu <code className="bg-slate-100 px-1 rounded text-primary">$...$</code> hoặc <code className="bg-slate-100 px-1 rounded text-primary">$$...$$</code>.
          </p>

          <div className="border border-border rounded-xl overflow-hidden bg-slate-50/50 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/15 transition-all">
            {activeTab === 'edit' ? (
              <textarea
                {...register('description')}
                placeholder="Nhập nội dung bài tập, có thể sử dụng công thức LaTeX..."
                className="w-full min-h-[300px] p-4 text-sm bg-transparent outline-none resize-y"
              />
            ) : (
              <div className="w-full min-h-[300px] p-4 bg-white prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-slate-800">
                {descriptionValue ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {descriptionValue}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Chưa có nội dung...</p>
                )}
              </div>
            )}
          </div>
          {errors.description && (
            <p className="text-xs text-destructive mt-1.5 font-medium">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit(handleDraft)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Lưu nháp
        </button>
        <button
          type="button"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit(handlePublish)}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          Đăng bài
        </button>
      </div>
    </div>
  )
}
