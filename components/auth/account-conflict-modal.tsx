'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, LogOut, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AccountConflictModalProps {
  open: boolean
  currentUser: {
    name?: string
    fullName?: string
    email?: string
    role?: string
  } | null
  attemptedEmail: string
  onContinueAsCurrent: () => void
  onSwitchAccount: () => void
}

export function AccountConflictModal({
  open,
  currentUser,
  attemptedEmail,
  onContinueAsCurrent,
  onSwitchAccount,
}: AccountConflictModalProps) {
  const [countdown, setCountdown] = useState<number>(5)

  const displayName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'Tài khoản đang mở'

  const onContinueRef = React.useRef(onContinueAsCurrent)
  useEffect(() => {
    onContinueRef.current = onContinueAsCurrent
  }, [onContinueAsCurrent])

  useEffect(() => {
    if (!open) {
      setCountdown(5)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Đưa callback vào setTimeout(0) / queueMicrotask để đảm bảo state update của countdown hoàn tất trước khi gọi callback
          setTimeout(() => {
            onContinueRef.current()
          }, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-amber-500/30 bg-background/95 backdrop-blur-md">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Phát hiện phiên đăng nhập tồn tại
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
            Trình duyệt của bạn hiện đang đăng nhập với tài khoản{' '}
            <strong className="text-foreground font-semibold">{displayName}</strong>.
            <br />
            Bạn đang yêu cầu đăng nhập tài khoản khác (<span className="text-amber-600 dark:text-amber-400 font-mono">{attemptedEmail}</span>).
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
          Tự động điều hướng về Trang chủ với tài khoản <strong>{displayName}</strong> sau{' '}
          <span className="font-bold text-sm px-1.5 py-0.5 rounded bg-amber-500/20">{countdown}s</span>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          <Button
            onClick={onContinueAsCurrent}
            className="w-full justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5"
          >
            <span>Tiếp tục với {displayName}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            onClick={onSwitchAccount}
            variant="outline"
            className="w-full justify-center gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive py-5"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất {displayName} để đổi tài khoản</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
