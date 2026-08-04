'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, UploadCloud, Link as LinkIcon, Image as ImageIcon, FileText, Check } from 'lucide-react'
import { toast } from 'sonner'

export type UploadModalMode = 'image' | 'file' | 'link'

interface MediaUploadModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: UploadModalMode
  onUploadImage?: (file: File) => void | Promise<void>
  onUploadFile?: (file: File) => void | Promise<void>
  onInsertLink?: (url: string, text?: string) => void
  isUploading?: boolean
  initialLinkUrl?: string
}

export function MediaUploadModal({
  isOpen,
  onClose,
  initialMode = 'image',
  onUploadImage,
  onUploadFile,
  onInsertLink,
  isUploading = false,
  initialLinkUrl = ''
}: MediaUploadModalProps) {
  const [activeMode, setActiveMode] = useState<UploadModalMode>(initialMode)
  const [isDragging, setIsDragging] = useState(false)
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl)
  const [linkText, setLinkText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode)
      setLinkUrl(initialLinkUrl)
      setLinkText('')
    }
  }, [isOpen, initialMode, initialLinkUrl])

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processSelectedFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processSelectedFile(files[0])
    }
    e.target.value = ''
  }

  const processSelectedFile = async (file: File) => {
    if (activeMode === 'image') {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Dung lượng ảnh vượt quá 5MB.')
        return
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Định dạng ảnh không hợp lệ. Vui lòng chọn .jpg, .png, .webp')
        return
      }
      if (onUploadImage) {
        await onUploadImage(file)
        onClose()
      }
    } else if (activeMode === 'file') {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Dung lượng file vượt quá 10MB.')
        return
      }
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.docx') && !fileName.endsWith('.txt') && !fileName.endsWith('.pdf')) {
        toast.error('Định dạng file không hợp lệ. Vui lòng chọn .docx, .txt hoặc .pdf')
        return
      }
      if (onUploadFile) {
        await onUploadFile(file)
        onClose()
      }
    }
  }

  const handleSubmitLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkUrl.trim()) {
      toast.error('Vui lòng nhập địa chỉ liên kết (URL)')
      return
    }
    let formattedUrl = linkUrl.trim()
    if (!/^https?:\/\//i.test(formattedUrl) && !/^mailto:/i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl
    }
    if (onInsertLink) {
      onInsertLink(formattedUrl, linkText.trim())
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">

        {/* Header with Mode Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
            {onUploadImage && (
              <button
                type="button"
                onClick={() => setActiveMode('image')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeMode === 'image'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Tải ảnh
              </button>
            )}
            {onUploadFile && (
              <button
                type="button"
                onClick={() => setActiveMode('file')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeMode === 'file'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Tải file
              </button>
            )}
            {onInsertLink && (
              <button
                type="button"
                onClick={() => setActiveMode('link')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeMode === 'link'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Chèn Link
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeMode === 'link' ? (
            /* Link Insert Form */
            <form onSubmit={handleSubmitLink} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Địa chỉ liên kết (URL) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Văn bản hiển thị (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Ví dụ: Tham khảo bài viết"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Xác nhận
                </button>
              </div>
            </form>
          ) : (
            /* File / Image Dropzone Area */
            <div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={activeMode === 'image' ? 'image/jpeg,image/png,image/webp' : '.docx,.txt,.pdf'}
                onChange={handleFileChange}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging
                    ? 'border-primary bg-primary/5 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                  }`}
              >
                <div className={`p-3.5 rounded-full mb-3 ${activeMode === 'image'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                  }`}>
                  <UploadCloud className="w-8 h-8 animate-bounce" style={{ animationDuration: '2s' }} />
                </div>

                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Kéo & thả {activeMode === 'image' ? 'hình ảnh' : 'tập tin'} vào đây
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  hoặc <span className="text-primary font-bold hover:underline">chọn từ thiết bị của bạn</span>
                </p>

                <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {activeMode === 'image' ? (
                    <>Định dạng hỗ trợ: <strong className="text-slate-600 dark:text-slate-300">.jpg, .png, .webp</strong> (Tối đa 5MB)</>
                  ) : (
                    <>Định dạng hỗ trợ: <strong className="text-slate-600 dark:text-slate-300">.docx, .txt, .pdf</strong> (Tối đa 10MB)</>
                  )}
                </div>
              </div>

              {isUploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-primary">
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  Đang tải lên...
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
