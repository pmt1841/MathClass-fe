'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  HardDrive,
  FileCheck,
  XCircle,
  Timer,
  Eye,
} from 'lucide-react'
import { StorageCleanupResponse } from '@/types/storage'
import { storageAdminService } from '@/services/storageAdminService'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

interface StorageCleanupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type ModalStep = 'CONFIRM' | 'EXECUTING' | 'RESULT'

export function StorageCleanupModal({
  open,
  onOpenChange,
  onSuccess,
}: StorageCleanupModalProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [step, setStep] = useState<ModalStep>('CONFIRM')
  const [gracePeriodHours, setGracePeriodHours] = useState<number>(24)
  const [dryRun, setDryRun] = useState<boolean>(false)
  const [result, setResult] = useState<StorageCleanupResponse | null>(null)
  const [isCleaning, setIsCleaning] = useState<boolean>(false)

  const handleStartCleanup = async () => {
    setIsCleaning(true)
    setStep('EXECUTING')

    try {
      const cleanupResult = await storageAdminService.triggerCleanup({
        gracePeriodHours,
        dryRun,
      })

      setResult(cleanupResult)
      setStep('RESULT')
      if (onSuccess) {
        onSuccess()
      }

      toast({
        title: dryRun ? t('Quét thử nghiệm hoàn tất') : t('Dọn dẹp thành công'),
        description: dryRun
          ? t('Phát hiện {count} file rác (chế độ chạy thử).', { count: cleanupResult.orphanFilesDetected })
          : t('Đã dọn dẹp thành công {count} file ảnh rác.', { count: cleanupResult.filesDeletedSuccessfully }),
      })
    } catch (error: any) {
      setStep('CONFIRM')
      toast({
        title: t('Lỗi dọn dẹp bộ nhớ'),
        description:
          error?.response?.data?.message ||
          t('Không thể kết nối đến máy chủ hoặc dịch vụ lưu trữ.'),
        variant: 'destructive',
      })
    } finally {
      setIsCleaning(false)
    }
  }

  const handleClose = () => {
    if (isCleaning) return
    onOpenChange(false)
    // Reset state sau khi đóng
    setTimeout(() => {
      setStep('CONFIRM')
      setResult(null)
      setDryRun(false)
      setGracePeriodHours(24)
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white border-slate-200">
        {step === 'CONFIRM' && (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    {t('Dọn dẹp Ảnh Rác trên Bộ nhớ Cloud')}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 text-sm mt-0.5">
                    {t('Quét và thu hồi dung lượng từ những ảnh không còn liên kết')}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-4 space-y-4">
              {/* Alert thông báo an toàn */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3 text-emerald-900 text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-800">
                    {t('Bảo vệ Dữ liệu Tuyệt đối')}
                  </p>
                  <p className="text-emerald-700/90 text-xs mt-1 leading-relaxed">
                    {t('Hệ thống sẽ đối soát với toàn bộ dữ liệu bài giảng, đề thi, bài tập và người dùng. Chỉ xóa những ảnh không được sử dụng ở bất kỳ đâu và đã qua thời gian bảo vệ.')}
                  </p>
                </div>
              </div>

              {/* Tùy chọn bảo vệ ảnh mới */}
              <div className="space-y-2">
                <Label
                  htmlFor="grace-period-input"
                  className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  {t('Thời gian bảo vệ ảnh đang soạn:')}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="grace-period-input"
                    type="number"
                    min={1}
                    max={168}
                    value={gracePeriodHours}
                    onChange={(e) =>
                      setGracePeriodHours(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-28 border-slate-200 focus-visible:ring-blue-500"
                  />
                  <span className="text-sm text-slate-500">
                    {t('giờ (Giữ an toàn các ảnh mới tải lên dưới {hours} giờ)', { hours: gracePeriodHours })}
                  </span>
                </div>
              </div>

              {/* Tùy chọn Quét thử nghiệm */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="dry-run-switch"
                    className="text-sm font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    {t('Chế độ quét thử nghiệm')}
                  </Label>
                  <p className="text-xs text-slate-500">
                    {t('Chỉ đếm và báo cáo số file rác phát hiện, không thực hiện xóa thật')}
                  </p>
                </div>
                <Switch
                  id="dry-run-switch"
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                {t('Hủy')}
              </Button>
              <Button
                onClick={handleStartCleanup}
                className={
                  dryRun
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-sm font-medium'
                }
              >
                {dryRun ? (
                  <>
                    <Eye className="w-4 h-4 mr-1.5" />
                    {t('Bắt đầu Quét thử')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    {t('Bắt đầu Dọn dẹp')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'EXECUTING' && (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-25" />
              <div className="w-14 h-14 rounded-full border-3 border-blue-500/20 border-t-blue-600 animate-spin flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {t('Đang quét và dọn dẹp bộ nhớ ảnh Cloud...')}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {t('Hệ thống đang kiểm tra danh sách file trên đám mây và đối soát an toàn với cơ sở dữ liệu.')}
              </p>
            </div>
          </div>
        )}

        {step === 'RESULT' && result && (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.dryRun
                      ? 'bg-blue-50 border border-blue-200 text-blue-600'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                    }`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    {result.dryRun
                      ? t('Kết quả Quét Thử Nghiệm')
                      : t('Dọn dẹp Bộ nhớ Hoàn tất')}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 text-sm mt-0.5">
                    {result.dryRun
                      ? t('Quét thử nghiệm hoàn tất (lúc {time}) - Chưa có ảnh nào bị xóa', { time: formatDateTime(result.completedAt) })
                      : t('Hoàn tất lúc {time} - Đã giải phóng thành công các ảnh rác', { time: formatDateTime(result.completedAt) })}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-4 space-y-4">
              {/* Thống kê dạng Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">
                    {t('Tổng file đã quét')}
                  </span>
                  <p className="text-2xl font-bold text-slate-900">
                    {result.totalFilesScanned.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {t('trong kho ảnh đại diện và bài tập')}
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 space-y-1">
                  <span className="text-xs text-amber-700 font-medium">
                    {t('Ảnh rác phát hiện')}
                  </span>
                  <p className="text-2xl font-bold text-amber-600">
                    {result.orphanFilesDetected.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-amber-600/80">
                    {t('đã lưu trên {hours} giờ', { hours: gracePeriodHours })}
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-xs text-emerald-700 font-medium">
                    {result.dryRun ? t('Sẽ được xóa (Dự kiến)') : t('Đã xóa thành công')}
                  </span>
                  <p className="text-2xl font-bold text-emerald-600">
                    {result.dryRun
                      ? result.orphanFilesDetected.toLocaleString()
                      : result.filesDeletedSuccessfully.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-emerald-600/80">
                    {t('ảnh trên kho lưu trữ đám mây')}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">
                    {t('Thời gian xử lý')}
                  </span>
                  <p className="text-2xl font-bold text-slate-900 flex items-center gap-1.5">
                    {(result.executionTimeMs / 1000).toFixed(2)}
                    <span className="text-sm font-normal text-slate-500">{t('giây')}</span>
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {t('tốc độ phản hồi tối ưu')}
                  </span>
                </div>
              </div>

              {result.orphanFilesDetected === 0 && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {t('Tuyệt vời! Không phát hiện bất kỳ ảnh rác nào. Hệ thống lưu trữ Cloud đang ở trạng thái tối ưu.')}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                onClick={handleClose}
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-medium px-6"
              >
                {t('Đóng')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
