import { useState, useEffect } from 'react'
import { Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { assignmentService } from '@/services/assignmentService'
import { handleApiError } from '@/lib/utils/error-handler'

interface EditSheetModalProps {
  open: boolean
  sheetId: number | null
  initialTitle?: string
  initialDescription?: string
  onClose: () => void
  onSuccess: () => void
}

export function EditSheetModal({
  open,
  sheetId,
  initialTitle = '',
  initialDescription = '',
  onClose,
  onSuccess,
}: EditSheetModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(initialTitle || '')
      setDescription(initialDescription || '')
    }
  }, [open, initialTitle, initialDescription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sheetId) return
    if (!title.trim()) {
      toast.error('Tiêu đề phiếu bài tập không được để trống')
      return
    }

    try {
      setIsSubmitting(true)
      await assignmentService.updateAssignmentSheet(sheetId, {
        title: title.trim(),
        description: description.trim(),
      })
      toast.success('Cập nhật phiếu bài tập thành công')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(handleApiError(error, 'Cập nhật phiếu bài tập thất bại'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent 
        className="!max-w-[460px] !w-[90vw] p-6 rounded-2xl border border-slate-100 shadow-2xl" 
        style={{ maxWidth: '460px', width: '90vw' }}
      >
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">Chỉnh sửa phiếu bài tập</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Cập nhật tiêu đề đề mục và mô tả của phiếu bài tập
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tiêu đề phiếu bài tập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề phiếu bài tập..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mô tả phiếu bài tập
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả ngắn cho phiếu bài tập..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 flex-row justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
