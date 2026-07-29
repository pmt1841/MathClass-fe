'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ShieldAlert, AlertTriangle } from 'lucide-react'

interface AccountLockedModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Component Modal Cảnh Báo Tài Khoản Bị Khóa (Account Locked Modal)
 * Hiển thị thông báo khi người dùng bị Quản trị viên vô hiệu hóa khỏi hệ thống Math Class.
 */
export function AccountLockedModal({ open, onClose }: AccountLockedModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md border-destructive/30">
        <DialogHeader className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <DialogTitle className="text-xl font-bold text-destructive">
            Tài khoản của bạn đã bị khóa!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Tài khoản này đã bị Quản trị viên vô hiệu hóa khỏi hệ thống Math Class.
            Mọi phiên làm việc hiện tại của bạn đã bị dừng để đảm bảo an toàn.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2.5 my-1">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            Nếu bạn tin rằng đây là sự nhầm lẫn hoặc cần hỗ trợ mở lại tài khoản, vui lòng liên hệ trực tiếp với bộ phận Quản trị viên.
          </span>
        </div>

        <DialogFooter className="sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Đã hiểu
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
