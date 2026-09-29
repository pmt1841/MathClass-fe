'use client'

import React from 'react'
import { Sparkles, Eye, XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/lib/i18n/i18n-context'

interface AiGradingConfirmDialogProps {
  open: boolean
  studentName: string
  onMinimize: () => void
  onCancel: () => void
  onContinueViewing: () => void
}

/**
 * Hộp thoại xác nhận ẩn hoặc hủy tiến trình AI Chấm sơ bộ.
 */
export function AiGradingConfirmDialog({
  open,
  studentName,
  onMinimize,
  onCancel,
  onContinueViewing,
}: AiGradingConfirmDialogProps) {
  const { t } = useI18n()

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md rounded-2xl border-slate-100 p-6 shadow-2xl">
        <AlertDialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-slate-900">
                {t('Tiến trình AI đang chạy')}
              </AlertDialogTitle>
              <p className="text-xs text-slate-500">
                {t('Bài làm của')} {studentName || t('học sinh')}
              </p>
            </div>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed text-slate-600">
            {t('Hệ thống đang đối chiếu hình vẽ Canvas và chấm sơ bộ bài tự luận. Bạn muốn ẩn cửa sổ để tiếp tục thao tác hay hủy tiến trình này?')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-col sm:gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onContinueViewing}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t('Tiếp tục xem')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onCancel}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              {t('Hủy chấm bài')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onMinimize}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              {t('Ẩn & Chạy ngầm')}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
