'use client'

import { Trash2 } from 'lucide-react'

interface DeleteAssignmentModalProps {
  open: boolean
  assignmentTitle: string
  isDraft: boolean
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteAssignmentModal({
  open,
  assignmentTitle,
  isDraft,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteAssignmentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 mx-auto">
          <Trash2 className="h-6 w-6 text-destructive" />
        </div>

        {/* Content */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-foreground">Xác nhận xóa bài tập</h2>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa bài tập
            <span className="font-semibold text-foreground"> &ldquo;{assignmentTitle}&rdquo;</span>?
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            {isDraft
              ? 'Bản nháp sẽ bị xóa vĩnh viễn và không thể khôi phục.'
              : 'Bài tập sẽ bị ẩn. Các bản đã giao cho lớp sẽ không bị ảnh hưởng.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl bg-destructive text-sm font-semibold text-white hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Xác nhận xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
