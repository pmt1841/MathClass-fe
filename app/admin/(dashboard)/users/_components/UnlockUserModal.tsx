'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Unlock } from 'lucide-react'

export const UNLOCK_REASON_PRESETS = [
  'NONE',
  'Đã xác minh tài khoản an toàn',
  'Đã xử lý vi phạm / Giải trình nhầm lẫn',
  'Hết thời hạn tạm khóa tài khoản',
  'Theo yêu cầu từ người dùng / Phụ huynh',
  'OTHER',
]

interface UnlockUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  userFullName?: string
  userEmail?: string
  isPending?: boolean
}

export function UnlockUserModal({
  isOpen,
  onClose,
  onConfirm,
  userFullName,
  userEmail,
  isPending = false,
}: UnlockUserModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(UNLOCK_REASON_PRESETS[0])
  const [customReason, setCustomReason] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Reset state mỗi khi mở Modal để tránh lưu vết dữ liệu của tài khoản cũ
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(UNLOCK_REASON_PRESETS[0])
      setCustomReason('')
      setError('')
    }
  }, [isOpen])

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value)
    setError('')
    if (value !== 'OTHER') {
      setCustomReason('')
    }
  }

  const handleConfirm = () => {
    let finalReason: string | undefined = undefined

    if (selectedPreset === 'OTHER') {
      finalReason = customReason.trim()
    } else if (selectedPreset !== 'NONE') {
      finalReason = selectedPreset
    }

    if (finalReason && finalReason.length > 500) {
      setError('Lý do không được vượt quá 500 ký tự.')
      return
    }

    setError('')
    onConfirm(finalReason)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <DialogTitle>Xác nhận Mở Khóa Tài Khoản</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-slate-600">
            Bạn đang mở khóa lại tài khoản của <strong>{userFullName}</strong> ({userEmail}). Người dùng sẽ có thể truy cập lại hệ thống và nhận email thông báo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <Label className="text-sm font-medium text-slate-800">
            Lý do / Ghi chú mở khóa <span className="text-xs text-slate-400 font-normal">(Tùy chọn)</span>
          </Label>

          <RadioGroup value={selectedPreset} onValueChange={handlePresetChange} className="space-y-2">
            {UNLOCK_REASON_PRESETS.map((preset, index) => (
              <div key={preset} className="flex items-center space-x-2">
                <RadioGroupItem value={preset} id={`unlock-reason-${index}`} />
                <Label htmlFor={`unlock-reason-${index}`} className="text-sm font-normal text-slate-700 cursor-pointer">
                  {preset === 'NONE'
                    ? 'Không đính kèm lý do (Gửi email thông báo khôi phục cơ bản)'
                    : preset === 'OTHER'
                    ? 'Khác (Tự nhập lý do / Ghi chú)'
                    : preset}
                </Label>
              </div>
            ))}
          </RadioGroup>


          {selectedPreset === 'OTHER' && (
            <div className="space-y-1 pt-1">
              <Textarea
                placeholder="Nhập ghi chú hoặc lý do mở tài khoản..."
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value)
                  if (error) setError('')
                }}
                className="min-h-[90px] text-sm"
                maxLength={500}
              />
              <p className="text-xs text-slate-400 text-right">{customReason.length}/500 ký tự</p>
            </div>
          )}

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Hủy bỏ
          </Button>
          <Button onClick={handleConfirm} disabled={isPending} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Unlock className="h-4 w-4" />
            {isPending ? 'Đang xử lý...' : 'Xác nhận Mở khóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
