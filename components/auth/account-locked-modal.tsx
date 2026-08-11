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
import { ShieldAlert, AlertTriangle, Clock, Info } from 'lucide-react'

interface AccountLockedModalProps {
  open: boolean
  onClose: () => void
  lockReason?: string
  lockedAt?: string
}

/**
 * Component Modal Cảnh Báo Tài Khoản Bị Khóa (Account Locked Modal)
 * Hiển thị thông báo khi người dùng bị Quản trị viên vô hiệu hóa khỏi hệ thống Math Class kèm lý do bị khóa và thời điểm khóa.
 */
export function AccountLockedModal({ open, onClose, lockReason, lockedAt }: AccountLockedModalProps) {
  const formattedLockedAt = lockedAt
    ? new Date(lockedAt).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null

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

        {/* Khối hiển thị Lý do bị khóa chi tiết */}
        <div className="space-y-2.5 my-1">
          <div className="rounded-lg bg-red-50/80 border border-red-200 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-red-800 font-semibold text-xs uppercase tracking-wider">
              <Info className="h-4 w-4 text-red-600 shrink-0" />
              <span>Lý do khóa tài khoản:</span>
            </div>
            <p className="text-sm text-red-950 font-medium leading-relaxed pl-6">
              {lockReason || 'Vi phạm tiêu chuẩn sử dụng và quy định của hệ thống.'}
            </p>

            {formattedLockedAt && (
              <div className="flex items-center gap-1.5 text-xs text-red-700/80 pt-1 border-t border-red-100">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Thời điểm khóa: {formattedLockedAt}</span>
              </div>
            )}
          </div>

          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Nếu bạn tin rằng đây là sự nhầm lẫn hoặc cần hỗ trợ mở lại tài khoản, vui lòng liên hệ trực tiếp với bộ phận Quản trị viên qua email support@mathclass.edu.vn.
            </span>
          </div>
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
