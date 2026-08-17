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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Spinner } from '@/components/ui/spinner'
import { ApiKeyCreateRequest } from '@/services/aiConfigService'

interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerName?: string
  onSubmit: (data: ApiKeyCreateRequest) => Promise<void>
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  providerName,
  onSubmit,
}: ApiKeyDialogProps) {
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [priority, setPriority] = useState<number>(10)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        name,
        apiKey,
        priority,
      })
      setName('')
      setApiKey('')
      setPriority(10)
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
            <DialogTitle className="text-lg sm:text-xl">Thêm API Key cho {providerName || 'Provider'}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Nhập API Key dạng plaintext. Hệ thống sẽ tự động mã hóa AES-256-GCM trước khi lưu xuống CSDL.
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
              <Label htmlFor="api-key">Chuỗi API Key (Plaintext)</Label>
              <PasswordInput
                id="api-key"
                placeholder="Nhập API Key tại đây..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                API Key sẽ được che mờ hoàn toàn trên giao diện sau khi tạo.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Mức ưu tiên (Priority)</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={100}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Số càng lớn độ ưu tiên càng cao (áp dụng cho chiến lược PRIORITY).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="mr-2 h-4 w-4" />}
              Lưu Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
