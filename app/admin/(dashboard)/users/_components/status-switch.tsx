'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface StatusSwitchProps {
  userId: number
  isActive: boolean
  isCurrentUser: boolean
  isPending: boolean
  onToggle: (userId: number, currentIsActive: boolean) => void
}

export function StatusSwitch({
  userId,
  isActive,
  isCurrentUser,
  isPending,
  onToggle,
}: StatusSwitchProps) {
  /*
   * DIALOG XÁC NHẬN KHÓA:
   * Mở dialog xác nhận trước khi thực hiện hành động Khóa tài khoản người dùng
   * để tránh vô tình bấm nhầm làm đứt quãng phiên học của người dùng.
   */
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSwitchChange = () => {
    if (isCurrentUser || isPending) return

    if (isActive) {
      // Đang hoạt động -> Muốn khóa -> Yêu cầu xác nhận
      setShowConfirm(true)
    } else {
      // Đang khóa -> Muốn mở khóa -> Thực hiện ngay
      onToggle(userId, isActive)
    }
  }

  const handleConfirmLock = () => {
    setShowConfirm(false)
    onToggle(userId, isActive)
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          id={`status-switch-${userId}`}
          checked={isActive}
          disabled={isPending || isCurrentUser}
          onCheckedChange={handleSwitchChange}
          aria-label={isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          title={isCurrentUser ? 'Bạn không thể tự khóa tài khoản quản trị của chính mình' : undefined}
        />
        <span className="text-sm text-muted-foreground select-none font-medium">
          {isActive ? 'Hoạt động' : 'Bị khóa'}
        </span>
      </div>

      {/* Modal Xác nhận trước khi Khóa tài khoản */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Xác nhận khóa tài khoản?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Tài khoản này sẽ lập tức bị hủy toàn bộ phiên làm việc (Refresh Token)
              và bị đăng xuất khỏi hệ thống ngay khi thực hiện bất kỳ thao tác nào.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLock}
              className="bg-red-600 text-white hover:bg-red-700 font-semibold border-none"
            >
              Xác nhận khóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
