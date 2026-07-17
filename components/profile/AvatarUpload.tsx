'use client'

import React, { useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'
import { useUploadAvatar } from '@/hooks/useProfile'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  fullName: string
  isGoogleUser?: boolean
  onUploadSuccess?: (url: string) => void
}

export function AvatarUpload({ currentAvatarUrl, fullName, isGoogleUser = false, onUploadSuccess }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatarMutation = useUploadAvatar()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const isGoogle = isGoogleUser

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGoogle) return
    const file = e.target.files?.[0]
    if (!file) return

    // Allow image preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      const newAvatarUrl = await uploadAvatarMutation.mutateAsync(file)
      if (onUploadSuccess) {
        onUploadSuccess(newAvatarUrl)
      }
    } catch (error) {
      // Error is handled by the hook (toast)
      setPreviewUrl(null)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const isUploading = uploadAvatarMutation.isPending

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group" title={isGoogle ? "Không thể thay đổi ảnh đại diện vì đăng nhập bằng tài khoản Google" : undefined}>
        <Avatar className="h-24 w-24 border-2 border-slate-200">
          <AvatarImage src={previewUrl || currentAvatarUrl} alt={fullName} className="object-cover" />
          <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        
        <div 
          className={`absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${isGoogle ? "cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => !isGoogle && !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <Camera className="h-8 w-8 text-white" />
          )}
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isGoogle || isUploading}
          onClick={() => !isGoogle && fileInputRef.current?.click()}
          title={isGoogle ? "Không thể thay đổi ảnh đại diện vì đăng nhập bằng tài khoản Google" : undefined}
          className={isGoogle ? "cursor-not-allowed opacity-50 bg-slate-50" : ""}
        >
          {isUploading ? 'Đang tải lên...' : 'Thay đổi ảnh'}
        </Button>
        <p className={`text-xs text-muted-foreground ${isGoogle ? "opacity-50" : ""}`}>
          Định dạng: JPEG, PNG, WEBP (Tối đa 5MB)
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/jpg, image/webp"
        onChange={handleFileChange}
        disabled={isGoogle}
      />
    </div>
  )
}
