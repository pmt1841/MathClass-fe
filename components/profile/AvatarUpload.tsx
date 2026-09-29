'use client'

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'
import { AvatarUploadModal } from './AvatarUploadModal'
import { useI18n } from '@/lib/i18n/i18n-context'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  fullName: string
  isGoogleUser?: boolean
  onUploadSuccess?: (url: string) => void
}

export function AvatarUpload({ currentAvatarUrl, fullName, isGoogleUser = false, onUploadSuccess }: AvatarUploadProps) {
  const { t } = useI18n()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isGoogle = isGoogleUser

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleOpenModal = () => {
    if (!isGoogle) {
      setIsModalOpen(true)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative group" 
        title={isGoogle ? t('Không thể thay đổi ảnh đại diện vì đăng nhập bằng tài khoản Google') : t('Bấm để thay đổi ảnh đại diện')}
      >
        <Avatar className="h-24 w-24 border-2 border-slate-200 shadow-xs">
          <AvatarImage src={currentAvatarUrl} alt={fullName} className="object-cover" />
          <AvatarFallback className="text-2xl bg-blue-100 text-blue-700 font-bold">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        
        <div 
          className={`absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${isGoogle ? "cursor-not-allowed" : "cursor-pointer"}`}
          onClick={handleOpenModal}
        >
          <Camera className="h-8 w-8 text-white drop-shadow-md transition-transform group-hover:scale-110" />
        </div>
      </div>
      
      <div className="text-center space-y-1.5">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isGoogle}
          onClick={handleOpenModal}
          title={isGoogle ? t('Không thể thay đổi ảnh đại diện vì đăng nhập bằng tài khoản Google') : undefined}
          className={`text-xs font-semibold rounded-xl ${isGoogle ? "cursor-not-allowed opacity-50 bg-slate-50" : "hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all"}`}
        >
          {t('Thay đổi ảnh')}
        </Button>
        <p className={`text-[11px] text-muted-foreground ${isGoogle ? "opacity-50" : ""}`}>
          {t('Định dạng: JPEG, PNG, WEBP (Tối đa 5MB)')}
        </p>
      </div>

      {!isGoogle && (
        <AvatarUploadModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUploadSuccess={onUploadSuccess}
        />
      )}
    </div>
  )
}
