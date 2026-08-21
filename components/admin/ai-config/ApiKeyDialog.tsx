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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Spinner } from '@/components/ui/spinner'
import { ApiKeyCreateRequest, ApiKeyItem, ApiKeyUpdateRequest } from '@/services/aiConfigService'

interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerName?: string
  initialData?: ApiKeyItem | null
  onSubmit: (data: ApiKeyCreateRequest | ApiKeyUpdateRequest) => Promise<void>
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  providerName,
  initialData,
  onSubmit,
}: ApiKeyDialogProps) {
  const isEdit = !!initialData
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [priority, setPriority] = useState<number>(10)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name || '')
        setPriority(initialData.priority ?? 0)
        setApiKey('')
      } else {
        setName('')
        setApiKey('')
        setPriority(10)
      }
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isEdit) {
        await onSubmit({
          name: name.trim() || undefined,
          priority,
          apiKey: apiKey.trim() || undefined,
        } as ApiKeyUpdateRequest)
      } else {
        await onSubmit({
          name: name.trim() || undefined,
          apiKey: apiKey.trim(),
          priority,
        } as ApiKeyCreateRequest)
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isEdit ? `Chỉnh sửa API Key: ${initialData?.name || `Key #${initialData?.id}`}` : `Thêm API Key cho ${providerName || 'Provider'}`}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEdit
                ? 'Cập nhật tên gợi nhớ, độ ưu tiên hoặc nhập chuỗi Key mới để thay thế.'
                : 'Nhập API Key dạng plaintext. Hệ thống sẽ tự động mã hóa AES-256-GCM trước khi lưu xuống CSDL.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key-name">Tên gợi nhớ (Tùy chọn)</Label>
              <Input
                id="key-name"
                placeholder="VD: Key Gemini Chấm bài 01"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api-key">
                {isEdit ? 'Chuỗi API Key mới (Để trống nếu giữ nguyên)' : 'Chuỗi API Key (Plaintext)'}
              </Label>
              <PasswordInput
                id="api-key"
                placeholder={isEdit ? 'Nhập nếu muốn đổi Key mới...' : 'Nhập API Key tại đây...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required={!isEdit}
              />
              <p className="text-[11px] text-muted-foreground">
                {isEdit
                  ? `Key hiện tại: ${initialData?.maskedApiKey || 'Đã mã hóa'}`
                  : 'API Key sẽ được che mờ hoàn toàn trên giao diện sau khi tạo.'}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Mức ưu tiên (Priority)</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={1000}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Số càng lớn độ ưu tiên càng cao (áp dụng khi Provider dùng chiến lược PRIORITY).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="mr-2 h-4 w-4" />}
              {isEdit ? 'Lưu thay đổi' : 'Lưu Key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
