'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, UploadCloud, Link as LinkIcon, Image as ImageIcon, FileText, Check, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export type UploadModalMode = 'image' | 'file' | 'link'

export interface UploadItem {
  id: string
  file: File
  previewUrl?: string
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  errorMessage?: string
  uploadedUrl?: string
}

interface MediaUploadModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: UploadModalMode
  onUploadImage?: (file: File, onProgress?: (percent: number) => void) => void | Promise<void>
  onUploadImages?: (files: File[], onProgress: (fileId: string, percent: number) => void) => Promise<{ fileId: string; url: string }[]>
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
  onUploadImages,
  onUploadFile,
  onInsertLink,
  isUploading = false,
  initialLinkUrl = ''
}: MediaUploadModalProps) {
  const [activeMode, setActiveMode] = useState<UploadModalMode>(initialMode)
  const [isDragging, setIsDragging] = useState(false)
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl)
  const [linkText, setLinkText] = useState('')
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up Object URLs on unmount or items change
  useEffect(() => {
    return () => {
      uploadItems.forEach(item => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode)
      setLinkUrl(initialLinkUrl)
      setLinkText('')
      setUploadItems([])
      setIsProcessing(false)
    }
  }, [isOpen, initialMode, initialLinkUrl])

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isProcessing) {
      setIsDragging(true)
    }
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
    if (isProcessing) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processSelectedFiles(Array.from(files))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processSelectedFiles(Array.from(files))
    }
    e.target.value = ''
  }

  const processSelectedFiles = (newFiles: File[]) => {
    if (activeMode === 'image') {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const validFiles: File[] = []

      for (const file of newFiles) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Ảnh "${file.name}" vượt quá dung lượng 5MB.`)
          continue
        }
        if (!validTypes.includes(file.type)) {
          toast.error(`Ảnh "${file.name}" không hợp lệ. Vui lòng chọn .jpg, .png, .webp`)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) return

      // Limit max 10 files
      if (uploadItems.length + validFiles.length > 10) {
        toast.error('Chỉ được chọn tối đa 10 ảnh trong 1 lượt upload.')
      }

      const availableSlot = 10 - uploadItems.length
      const filesToAdd = validFiles.slice(0, availableSlot)

      // Filter duplicates by name & size
      const existingKeys = new Set(uploadItems.map(i => `${i.file.name}_${i.file.size}`))
      const uniqueItems: UploadItem[] = []

      for (const file of filesToAdd) {
        const key = `${file.name}_${file.size}`
        if (existingKeys.has(key)) continue

        const item: UploadItem = {
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          status: 'idle'
        }
        uniqueItems.push(item)
      }

      setUploadItems(prev => [...prev, ...uniqueItems])
    } else if (activeMode === 'file') {
      const file = newFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Dung lượng file vượt quá 10MB.')
        return
      }
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.docx') && !fileName.endsWith('.txt') && !fileName.endsWith('.pdf')) {
        toast.error('Định dạng file không hợp lệ. Vui lòng chọn .docx, .txt hoặc .pdf')
        return
      }

      const item: UploadItem = {
        id: Math.random().toString(36).substring(2, 9),
        file,
        progress: 0,
        status: 'idle'
      }
      setUploadItems([item])
    }
  }

  const removeItem = (id: string) => {
    if (isProcessing) return
    setUploadItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return prev.filter(i => i.id !== id)
    })
  }

  const handleStartUpload = async () => {
    if (uploadItems.length === 0) return

    setIsProcessing(true)

    if (activeMode === 'image') {
      if (onUploadImages) {
        // Multi-image custom upload handler with progress callback
        setUploadItems(prev => prev.map(item => ({
          ...item,
          status: item.status === 'success' ? 'success' : 'uploading',
          progress: item.status === 'success' ? 100 : 0
        })))

        try {
          const filesToUpload = uploadItems.filter(i => i.status !== 'success').map(item => item.file)
          await onUploadImages(filesToUpload, (fileId, percent) => {
            setUploadItems(prev => prev.map(item => item.id === fileId ? { ...item, progress: percent } : item))
          })
          toast.success(`Đã tải lên thành công ${uploadItems.length} ảnh!`)
          onClose()
        } catch (err: any) {
          toast.error('Có lỗi xảy ra trong quá trình tải ảnh.')
          setUploadItems(prev => prev.map(item => item.status === 'uploading' ? { ...item, status: 'error', errorMessage: 'Tải lên thất bại' } : item))
        } finally {
          setIsProcessing(false)
        }
      } else if (onUploadImage) {
        // Sequentially upload item by item with real-time progress tracking per file
        let hasError = false
        const totalItems = uploadItems.length

        for (const item of uploadItems) {
          if (item.status === 'success') continue

          setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i))

          try {
            await onUploadImage(item.file, (percent) => {
              setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: percent } : i))
            })
            setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success', progress: 100 } : i))
          } catch (err) {
            hasError = true
            setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: 'Lỗi tải lên' } : i))
          }
        }

        setIsProcessing(false)
        if (!hasError) {
          toast.success(`Đã tải lên thành công ${totalItems} ảnh!`)
          onClose()
        } else {
          toast.error('Có ảnh tải lên bị lỗi, vui lòng kiểm tra lại.')
        }
      }
    } else if (activeMode === 'file') {
      const item = uploadItems[0]
      if (item && onUploadFile) {
        setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 50 } : i))
        try {
          await onUploadFile(item.file)
          setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success', progress: 100 } : i))
          toast.success('Đã tải lên tập tin!')
          onClose()
        } catch (err) {
          setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: 'Lỗi tải lên' } : i))
        } finally {
          setIsProcessing(false)
        }
      }
    }
  }

  const handleRetryItem = async (item: UploadItem) => {
    if (isProcessing) return

    if (activeMode === 'image' && onUploadImage) {
      setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 0, errorMessage: undefined } : i))
      try {
        await onUploadImage(item.file, (percent) => {
          setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: percent } : i))
        })
        setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success', progress: 100 } : i))
        toast.success(`Đã tải lên ${item.file.name}`)
      } catch (err) {
        setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: 'Lỗi tải lên' } : i))
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

  const handleBackdropClick = () => {
    if (!isProcessing && !isUploading) {
      onClose()
    }
  }

  return (
    <div 
      onClick={handleBackdropClick} 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
      >

        {/* Header with Mode Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
            {(onUploadImage || onUploadImages) && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setActiveMode('image')
                  setUploadItems([])
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${activeMode === 'image'
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
                disabled={isProcessing}
                onClick={() => {
                  setActiveMode('file')
                  setUploadItems([])
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${activeMode === 'file'
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
                disabled={isProcessing}
                onClick={() => setActiveMode('link')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${activeMode === 'link'
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
            disabled={isProcessing}
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
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
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple={activeMode === 'image'}
                accept={activeMode === 'image' ? 'image/jpeg,image/png,image/webp' : '.docx,.txt,.pdf'}
                onChange={handleFileChange}
              />

              {uploadItems.length === 0 ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
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
                    Kéo & thả {activeMode === 'image' ? 'các hình ảnh' : 'tập tin'} vào đây
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    hoặc <span className="text-primary font-bold hover:underline">chọn từ thiết bị của bạn</span>
                  </p>

                  <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {activeMode === 'image' ? (
                      <>Hỗ trợ chọn <strong className="text-slate-600 dark:text-slate-300">nhiều ảnh</strong> (.jpg, .png, .webp - Tối đa 5MB/ảnh)</>
                    ) : (
                      <>Định dạng hỗ trợ: <strong className="text-slate-600 dark:text-slate-300">.docx, .txt, .pdf</strong> (Tối đa 10MB)</>
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Items Preview & Upload Progress List */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Đã chọn {uploadItems.length} {activeMode === 'image' ? 'ảnh' : 'tập tin'}
                    </span>
                    {!isProcessing && uploadItems.length < 10 && activeMode === 'image' && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        + Thêm ảnh khác
                      </button>
                    )}
                  </div>

                  {activeMode === 'image' ? (
                    /* Image Grid Preview */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                      {uploadItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 aspect-square flex flex-col justify-between p-1.5"
                        >
                          {/* Image background thumbnail */}
                          {item.previewUrl && (
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}

                          {/* Top Action / Status Overlay */}
                          <div className="relative z-10 flex items-center justify-between w-full">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900/70 text-white font-medium truncate max-w-[70%] backdrop-blur-xs">
                              {item.file.name}
                            </span>
                            {!isProcessing && (
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Progress Overlay */}
                          {item.status === 'uploading' && (
                            <div className="relative z-10 inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center rounded-lg p-2 text-white">
                              <span className="text-xs font-bold mb-1">{item.progress}%</span>
                              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Success Overlay */}
                          {item.status === 'success' && (
                            <div className="relative z-10 flex items-center justify-center bg-emerald-600/80 text-white rounded-lg p-1">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              <span className="text-[10px] font-bold">Xong</span>
                            </div>
                          )}

                          {/* Error Overlay */}
                          {item.status === 'error' && (
                            <div className="relative z-10 flex flex-col items-center justify-center bg-rose-600/85 text-white rounded-lg p-2 text-center">
                              <AlertCircle className="w-4 h-4 mb-1" />
                              <span className="text-[10px] font-bold mb-1">Thất bại</span>
                              {!isProcessing && (
                                <button
                                  type="button"
                                  onClick={() => handleRetryItem(item)}
                                  className="px-2 py-0.5 bg-white text-rose-700 text-[10px] font-bold rounded-md flex items-center gap-1 hover:bg-slate-100"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" /> Thử lại
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Document File Preview Item */
                    <div className="space-y-2">
                      {uploadItems.map(item => (
                        <div key={item.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-6 h-6 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.file.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{(item.file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          {!isProcessing && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || uploadItems.length === 0}
                      onClick={handleStartUpload}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Đang tải lên...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          Tải lên {uploadItems.length} {activeMode === 'image' ? 'ảnh' : 'file'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(isUploading && uploadItems.length === 0) && (
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
