'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

interface PermissionRevokedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message?: string
}

export function PermissionRevokedModal({
  open,
  onOpenChange,
  message = 'Quyền truy cập tính năng này của bạn đã bị thu hồi hoặc không khả dụng.',
}: PermissionRevokedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md border-amber-200 dark:border-amber-900/50">
        <DialogHeader className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 ring-8 ring-amber-50 dark:ring-amber-950/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Tính năng không khả dụng
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto min-w-[160px] bg-amber-600 hover:bg-amber-700 text-white font-medium">
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
