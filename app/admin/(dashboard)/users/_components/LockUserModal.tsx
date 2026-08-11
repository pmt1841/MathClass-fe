'use client'

import { useState } from 'react'
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
import { AlertTriangle, Lock } from 'lucide-react'

export const LOCK_REASON_PRESETS = [
  'Vi phạm tiêu chuẩn cộng đồng / Ngôn từ không phù hợp',
  'Nghi vấn gian lận bài tập / Bài thi',
  'Chia sẻ / Sử dụng chung tài khoản trái phép',
  'Tài khoản vi phạm an toàn & bảo mật',
  'Yêu cầu tạm khóa từ người dùng / Phụ huynh',
  'OTHER',
]

interface LockUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  userFullName?: string
  userEmail?: string
  isPending?: boolean
}

export function LockUserModal({
  isOpen,
  onClose,
  onConfirm,
  userFullName,
  userEmail,
  isPending = false,
}: LockUserModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(LOCK_REASON_PRESETS[0])
  const [customReason, setCustomReason] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value)
    setError('')
    if (value !== 'OTHER') {
      setCustomReason('')
    }
  }

  const handleConfirm = () => {
    let finalReason = selectedPreset
    if (selectedPreset === 'OTHER') {
      finalReason = customReason.trim()
    }

    if (!finalReason || finalReason.length < 5) {
      setError('Vui lòng nhập lý do khóa cụ thể (tối thiểu 5 ký tự).')
      return
    }

    if (finalReason.length > 500) {
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
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Xác nhận Khóa Tài Khoản</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-slate-600">
            Bạn đang thực hiện khóa tài khoản của <strong>{userFullName}</strong> ({userEmail}). Người dùng sẽ bị ngắt toàn bộ phiên làm việc và nhận email thông báo lý do.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <Label className="text-sm font-medium text-slate-800">
            Chọn lý do khóa tài khoản <span className="text-red-500">*</span>
          </Label>

          <RadioGroup value={selectedPreset} onValueChange={handlePresetChange} className="space-y-2">
            {LOCK_REASON_PRESETS.map((preset) => (
              <div key={preset} className="flex items-center space-x-2">
                <RadioGroupItem value={preset} id={`reason-${preset}`} />
                <Label htmlFor={`reason-${preset}`} className="text-sm font-normal text-slate-700 cursor-pointer">
                  {preset === 'OTHER' ? 'Khác (Tự nhập lý do chi tiết)' : preset}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedPreset === 'OTHER' && (
            <div className="space-y-1 pt-1">
              <Textarea
                placeholder="Nhập lý do chi tiết (tối thiểu 5 ký tự)..."
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
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending} className="gap-1.5 bg-red-600 hover:bg-red-700">
            <Lock className="h-4 w-4" />
            {isPending ? 'Đang xử lý...' : 'Xác nhận Khóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
