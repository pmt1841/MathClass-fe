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
import { useI18n } from '@/lib/i18n/i18n-context'

interface EditSheetModalProps {
  open: boolean
  sheetId: number | null
  initialTitle?: string
  initialDescription?: string
  items?: { id: number; title: string; maxScore?: number }[]
  onClose: () => void
  onSuccess: () => void
}

export function EditSheetModal({
  open,
  sheetId,
  initialTitle = '',
  initialDescription = '',
  items = [],
  onClose,
  onSuccess,
}: EditSheetModalProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [scoresMap, setScoresMap] = useState<{ [id: number]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(initialTitle || '')
      setDescription(initialDescription || '')
      if (items && items.length > 0) {
        const defaultPerItem = (Math.floor((10 / items.length) * 10) / 10).toString()
        const initialMap: { [id: number]: string } = {}
        items.forEach((item) => {
          initialMap[item.id] = item.maxScore !== undefined && item.maxScore !== null
            ? item.maxScore.toString()
            : defaultPerItem
        })
        setScoresMap(initialMap)
      } else {
        setScoresMap({})
      }
    }
  }, [open, initialTitle, initialDescription, items])

  const autoSplitScores = () => {
    if (!items || items.length === 0) return
    const defaultPerItem = (Math.floor((10 / items.length) * 10) / 10).toString()
    const newMap: { [id: number]: string } = {}
    items.forEach((item) => {
      newMap[item.id] = defaultPerItem
    })
    setScoresMap(newMap)
  }

  const currentTotalScore = items.reduce((sum, item) => {
    const val = parseFloat(scoresMap[item.id] || '0')
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  const hasNegativeScore = items.some((item) => {
    const val = parseFloat(scoresMap[item.id] || '0')
    return !isNaN(val) && val < 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sheetId) return
    if (!title.trim()) {
      toast.error(t('Tiêu đề phiếu bài tập không được để trống'))
      return
    }

    if (hasNegativeScore) {
      toast.error(t('Điểm tối đa từng câu không được là số âm'))
      return
    }

    if (currentTotalScore > 10.0001) {
      toast.error(`${t("Tổng điểm các câu")} (${currentTotalScore.toFixed(1)} ${t("điểm")}) ${t("không được vượt quá 10 điểm")}`)
      return
    }

    const itemScores = items.map((item) => ({
      assignmentId: item.id,
      maxScore: parseFloat(scoresMap[item.id] || '0')
    }))

    try {
      setIsSubmitting(true)
      await assignmentService.updateAssignmentSheet(sheetId, {
        title: title.trim(),
        description: description.trim(),
        itemScores,
      })
      toast.success(t('Cập nhật phiếu bài tập thành công'))
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(handleApiError(error, t('Cập nhật phiếu bài tập thất bại')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent 
        className="!max-w-[500px] !w-[90vw] max-h-[85vh] overflow-y-auto p-6 rounded-2xl border border-slate-100 shadow-2xl" 
        style={{ maxWidth: '500px', width: '90vw' }}
      >
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">{t("Chỉnh sửa phiếu bài tập")}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {t("Cập nhật tiêu đề đề mục, mô tả và điểm tối đa của phiếu bài tập")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("Tiêu đề phiếu bài tập")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("Nhập tiêu đề phiếu bài tập...")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("Mô tả phiếu bài tập")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("Nhập mô tả ngắn cho phiếu bài tập...")}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {items && items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t("Điểm tối đa từng câu")}
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${hasNegativeScore || currentTotalScore > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {t("Tổng điểm:")} {currentTotalScore.toFixed(1)} / 10
                  </span>
                  <button
                    type="button"
                    onClick={autoSplitScores}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Chia đều
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1.5 max-h-40 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700 truncate pr-2 flex-1">
                      {index + 1}. {item.title}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={scoresMap[item.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setScoresMap(prev => ({ ...prev, [item.id]: val }))
                        }}
                        className="w-16 h-7 px-2 text-center rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary"
                      />
                      <span className="text-slate-400 font-medium">{t("điểm")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              disabled={isSubmitting || hasNegativeScore || currentTotalScore > 10}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Đang lưu...")}
                </>
              ) : (
                t('Lưu thay đổi')
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
