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
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { AiJobStatus } from '@/types/aiJob'

interface AiJobCancelConfirmDialogProps {
  open: boolean
  status?: AiJobStatus | null
  hasResult?: boolean
  reservedCredits?: number
  isCancelling?: boolean
  onClose: () => void
  onConfirmCancel: (force?: boolean) => void
}

export function AiJobCancelConfirmDialog({
  open,
  status,
  hasResult = false,
  reservedCredits = 0,
  isCancelling = false,
  onClose,
  onConfirmCancel,
}: AiJobCancelConfirmDialogProps) {
  const isCompleted = status === 'COMPLETED' || hasResult
  const isProcessing = (status === 'PROCESSING' || status === 'RETRYING') && !isCompleted

  const [hasTransitionedToProcessing, setHasTransitionedToProcessing] = React.useState(false)
  const initialStatusRef = React.useRef<AiJobStatus | null>(null)

  React.useEffect(() => {
    if (open) {
      if (initialStatusRef.current === null) {
        initialStatusRef.current = status ?? null
      }
      if (initialStatusRef.current === 'QUEUED' && (status === 'PROCESSING' || status === 'RETRYING')) {
        setHasTransitionedToProcessing(true)
      }
    } else {
      initialStatusRef.current = null
      setHasTransitionedToProcessing(false)
    }
  }, [open, status])

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !isCancelling && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-6">
        {isCompleted ? (
          /* TRƯỜNG HỢP 1: Tác vụ đã hoàn thành xong */
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogHeader className="space-y-2 text-center">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Tác vụ đã hoàn thành!
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-300">
                Mô hình AI đã hoàn tất tạo câu hỏi thành công trước khi bạn kịp hủy. 
                Tác vụ đã hoàn tất nên không thể hủy.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="w-full sm:justify-center pt-2">
              <Button
                type="button"
                onClick={onClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                Đã hiểu &amp; Xem kết quả
              </Button>
            </DialogFooter>
          </div>
        ) : isProcessing ? (
          /* TRƯỜNG HỢP 2: Tác vụ đang được xử lý (PROCESSING / RETRYING) */
          <div className="flex flex-col space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogHeader className="space-y-1.5 text-left">
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {hasTransitionedToProcessing
                    ? 'AI vừa bắt đầu xử lý, hủy sẽ không được hoàn credit'
                    : 'Tác vụ AI đang được xử lý'}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 dark:text-slate-300">
                  Mô hình AI đã bắt đầu tạo bài tập cho bạn. Nếu dừng tác vụ lúc này, hệ thống{' '}
                  <strong className="text-rose-600 dark:text-rose-400 font-semibold">
                    sẽ không được hoàn lại credit
                  </strong>{' '}
                  đã tiêu thụ.
                </DialogDescription>
              </DialogHeader>
            </div>

            {hasTransitionedToProcessing && (
              <div className="p-3 bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-700 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-bold">⚡ AI vừa bắt đầu xử lý ngay lúc này!</p>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                    Tác vụ vừa được chuyển sang giai đoạn sinh đề. Bạn nên tiếp tục chờ để nhận kết quả thay vì mất credit vô ích.
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Chỉ còn vài giây nữa là tác vụ hoàn tất. Bạn có muốn tiếp tục chờ không?</span>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCancelling}
                className="w-full sm:w-auto"
              >
                Tiếp tục chờ
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => onConfirmCancel(true)}
                disabled={isCancelling}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang dừng...
                  </>
                ) : (
                  'Vẫn hủy (Mất credit)'
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* TRƯỜNG HỢP 3: Đang trong hàng chờ (QUEUED) */
          <div className="flex flex-col space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Xác nhận dừng tác vụ?
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-300">
                Tác vụ đang trong hàng chờ và chưa thực hiện. Khi bạn dừng,{' '}
                <strong className="text-emerald-600 font-semibold">
                  {reservedCredits > 0 ? `100% (${reservedCredits} credits)` : 'toàn bộ credit'}
                </strong>{' '}
                sẽ được hoàn lại vào ví ngay lập tức.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCancelling}
                className="w-full sm:w-auto"
              >
                Giữ lại
              </Button>
              <Button
                type="button"
                onClick={() => onConfirmCancel(false)}
                disabled={isCancelling}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-medium"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  'Dừng tác vụ & Hoàn credit'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
