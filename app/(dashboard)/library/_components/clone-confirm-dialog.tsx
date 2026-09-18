'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { GitFork, Loader2 } from 'lucide-react'
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
import { useCloneAssignment, useCloneSheet } from '@/hooks/useLibrary'

export interface CloneTarget {
  id: number
  title: string
  isSheet: boolean
  authorName?: string
}

interface CloneConfirmDialogProps {
  target: CloneTarget
  onClose: () => void
}

/**
 * Dialog cho phép người dùng đặt tên bài clone trước khi lưu về kho cá nhân.
 * Pre-fill tên gốc, cho phép sửa tùy ý.
 */
export function CloneConfirmDialog({ target, onClose }: CloneConfirmDialogProps) {
  const [title, setTitle] = useState(target.title)

  const cloneAssignment = useCloneAssignment()
  const cloneSheet = useCloneSheet()

  const isPending = cloneAssignment.isPending || cloneSheet.isPending

  const handleClone = async () => {
    if (!title.trim()) return

    try {
      if (target.isSheet) {
        await cloneSheet.mutateAsync({ id: target.id, title: title.trim() })
      } else {
        await cloneAssignment.mutateAsync({ id: target.id, title: title.trim() })
      }

      toast.success('Sao chép thành công! Bài tập đã được thêm vào Kho bài của bạn.', {
        description: 'Truy cập trang Kho bài tập để xem và chỉnh sửa bản sao.',
        duration: 4000,
      })
      onClose()
    } catch {
      toast.error('Sao chép thất bại. Vui lòng thử lại.')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-violet-500" />
            Sao chép về kho cá nhân
          </DialogTitle>
          <DialogDescription>
            Đặt tên cho bản sao của bạn. Bài tập sẽ được lưu ở trạng thái{' '}
            <strong>Bản nháp</strong> và <strong>Riêng tư</strong>.
            {target.authorName && (
              <span className="block mt-1 text-muted-foreground">
                Nguồn gốc: <strong>{target.authorName}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="clone-title">Tên bài tập</Label>
          <Input
            id="clone-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tên bài tập..."
            onKeyDown={(e) => e.key === 'Enter' && !isPending && handleClone()}
            disabled={isPending}
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            onClick={handleClone}
            disabled={!title.trim() || isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang sao chép...
              </>
            ) : (
              <>
                <GitFork className="h-4 w-4" />
                Sao chép về
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
