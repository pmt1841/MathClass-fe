'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { toast } from 'sonner'
import {
  UploadCloud,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useUploadAvatar } from '@/hooks/useProfile'
import { getCroppedImg, PixelCrop } from '@/lib/utils/cropImage'

interface AvatarUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: (url: string) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function AvatarUploadModal({
  open,
  onOpenChange,
  onUploadSuccess
}: AvatarUploadModalProps) {
  const [step, setStep] = useState<'SELECT' | 'CROP'>('SELECT')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isCropping, setIsCropping] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatarMutation = useUploadAvatar()

  const isUploading = uploadAvatarMutation.isPending || isCropping

  // Clean up Object URL when imageSrc changes or component unmounts
  const cleanupImageSrc = useCallback(() => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc)
      setImageSrc(null)
    }
  }, [imageSrc])

  const handleReset = useCallback(() => {
    cleanupImageSrc()
    setStep('SELECT')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    setIsDragging(false)
    setIsCropping(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [cleanupImageSrc])

  const handleOpenChange = (newOpen: boolean) => {
    if (isUploading) return // Prevent closing while uploading
    if (!newOpen) {
      handleReset()
    }
    onOpenChange(newOpen)
  }

  const validateAndProcessFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Định dạng file không hợp lệ! Chỉ chấp nhận JPG, PNG, WEBP.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.')
      return
    }

    cleanupImageSrc()
    const objectUrl = URL.createObjectURL(file)
    setImageSrc(objectUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setStep('CROP')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndProcessFile(file)
    }
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndProcessFile(file)
    }
  }

  const onCropComplete = useCallback(
    (_croppedArea: unknown, croppedAreaPixels: PixelCrop) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setIsCropping(true)
    let croppedFile: File

    // 1. Xử lý cắt ảnh Canvas
    try {
      croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        `avatar-${Date.now()}.jpg`
      )
    } catch (cropError) {
      console.error('Lỗi cắt ảnh:', cropError)
      toast.error('Không thể xử lý cắt ảnh. Vui lòng thử lại!')
      setIsCropping(false)
      return
    }

    // 2. Gửi file lên API
    try {
      const newAvatarUrl = await uploadAvatarMutation.mutateAsync(croppedFile)
      if (onUploadSuccess) {
        onUploadSuccess(newAvatarUrl)
      }
      handleOpenChange(false)
    } catch {
      // Toast lỗi từ server đã được xử lý tự động trong useUploadAvatar()
    } finally {
      setIsCropping(false)
    }
  }

  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [imageSrc])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isUploading} className="sm:max-w-md p-6 rounded-2xl overflow-hidden">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
            <span>Cập nhật ảnh đại diện</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === 'SELECT'
              ? 'Tải lên ảnh mới bằng cách chọn tệp hoặc kéo thả trực tiếp vào ô bên dưới.'
              : 'Thu phóng, xoay và điều chỉnh vị trí để có bức ảnh hoàn hảo nhất.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'SELECT' ? (
          <div className="py-3">
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 text-center ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50/80 bg-slate-50/40'
              }`}
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110 pointer-events-none">
                <UploadCloud className="h-7 w-7" />
              </div>

              <div className="space-y-1.5 pointer-events-none">
                <p className="text-sm font-semibold text-slate-800">
                  Kéo và thả ảnh vào đây, hoặc{' '}
                  <span className="text-primary underline underline-offset-2">Duyệt tìm tệp</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ các định dạng PNG, JPG, WEBP (Tối đa 5MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Cropper Container */}
            <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            {/* Controls */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={(val) => setZoom(val[0])}
                  className="flex-1 cursor-pointer"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <span className="text-muted-foreground font-medium">Thu phóng: {Math.round(zoom * 100)}%</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="h-8 gap-1.5 text-xs font-semibold hover:bg-white"
                >
                  <RotateCw className="h-3.5 w-3.5 text-slate-600" />
                  Xoay 90°
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 gap-2">
          {step === 'CROP' ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading}
                onClick={handleReset}
                className="gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Chọn ảnh khác
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => handleOpenChange(false)}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isUploading}
                  onClick={handleSave}
                  className="text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="text-xs"
              >
                Đóng
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
