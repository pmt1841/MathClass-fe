import { useState, useEffect } from 'react'
import { Send, Check, Clock, X, CalendarDays, Loader2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMyClassrooms } from '@/hooks/useClassrooms'
import { usePublishAssignmentSheet } from '@/hooks/usePublishAssignmentSheet'
import { handleApiError } from '@/lib/utils/error-handler'

interface TargetClassEntry {
  classCode: string
  className: string
  deadline: string
  selected: boolean
}

interface PublishSheetModalProps {
  open: boolean
  assignmentIds: number[]
  assignments?: { id: number, title: string }[]
  publishedClassCodes?: string[]
  defaultTitle?: string
  defaultDescription?: string
  masterSheetId?: number
  onClose: () => void
  onSuccess: () => void
}

const EMPTY_CLASS_CODES: string[] = []

export function PublishSheetModal({
  open,
  assignmentIds,
  assignments = [],
  publishedClassCodes = EMPTY_CLASS_CODES,
  defaultTitle = '',
  defaultDescription = '',
  masterSheetId,
  onClose,
  onSuccess,
}: PublishSheetModalProps) {
  const { data: myClasses = [], isLoading: loadingClasses } = useMyClassrooms()
  const publishMutation = usePublishAssignmentSheet()
  
  const [targets, setTargets] = useState<TargetClassEntry[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scoresMap, setScoresMap] = useState<{ [id: number]: string }>({})

  const publishedKey = publishedClassCodes ? publishedClassCodes.join(',') : ''

  useEffect(() => {
    if (!open || loadingClasses) return
    
    const availableClasses = publishedClassCodes && publishedClassCodes.length > 0
      ? myClasses.filter((c) => !publishedClassCodes.includes(c.classCode))
      : myClasses

    setTargets(
      availableClasses.map((c) => ({
        classCode: c.classCode,
        className: c.className,
        deadline: '',
        selected: false,
      }))
    )
    setTitle(defaultTitle)
    setDescription(defaultDescription)

    // Default score split equally among items
    if (assignmentIds && assignmentIds.length > 0) {
      const defaultPerItem = (Math.floor((10 / assignmentIds.length) * 10) / 10).toString()
      const initialMap: { [id: number]: string } = {}
      assignmentIds.forEach(id => {
        initialMap[id] = defaultPerItem
      })
      setScoresMap(initialMap)
    }
  }, [open, myClasses, publishedKey, defaultTitle, defaultDescription, loadingClasses, assignmentIds])

  const getDefaultDeadline = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const toggleClass = (classCode: string) => {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.classCode !== classCode) return t
        const newSelected = !t.selected
        return {
          ...t,
          selected: newSelected,
          deadline: newSelected && !t.deadline ? getDefaultDeadline() : t.deadline,
        }
      })
    )
  }

  const setDeadline = (classCode: string, value: string) => {
    setTargets((prev) =>
      prev.map((t) => (t.classCode === classCode ? { ...t, deadline: value } : t))
    )
  }

  const autoSplitScores = () => {
    if (!assignmentIds || assignmentIds.length === 0) return
    const defaultPerItem = (Math.floor((10 / assignmentIds.length) * 10) / 10).toString()
    const newMap: { [id: number]: string } = {}
    assignmentIds.forEach(id => {
      newMap[id] = defaultPerItem
    })
    setScoresMap(newMap)
  }

  const currentTotalScore = assignmentIds.reduce((sum, id) => {
    const val = parseFloat(scoresMap[id] || '0')
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  const hasNegativeScore = assignmentIds.some(id => {
    const val = parseFloat(scoresMap[id] || '0')
    return !isNaN(val) && val < 0
  })

  const selectedTargets = targets.filter((t) => t.selected)

  const handlePublish = () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên phiếu bài tập')
      return
    }
    const missing = selectedTargets.filter((t) => !t.deadline)
    if (missing.length > 0) {
      toast.error(`Vui lòng chọn hạn nộp cho: ${missing.map((t) => t.className).join(', ')}`)
      return
    }
    if (selectedTargets.length === 0) {
      toast.error('Vui lòng chọn ít nhất một lớp để giao bài')
      return
    }

    if (hasNegativeScore) {
      toast.error('Điểm tối đa từng câu không được là số âm')
      return
    }

    if (currentTotalScore > 10.0001) {
      toast.error(`Tổng điểm các câu (${currentTotalScore.toFixed(1)} điểm) không được vượt quá 10 điểm`)
      return
    }

    const payloadTargets = selectedTargets.map((t) => ({ classCode: t.classCode, deadline: t.deadline }))
    const itemScores = assignmentIds.map((id) => ({
      assignmentId: id,
      maxScore: parseFloat(scoresMap[id] || '0')
    }))

    publishMutation.mutate(
      { masterSheetId, title, description, assignmentIds, itemScores, targets: payloadTargets },
      {
        onSuccess: () => {
          toast.success(`Đã giao phiếu bài tập "${title}" thành công!`)
          onSuccess()
        },
        onError: (err) => {
          toast.error(handleApiError(err, 'Không thể giao phiếu bài tập'))
        }
      }
    )
  }

  const isPublishing = publishMutation.isPending
  const isReadOnlyTitleDescription = Boolean(defaultTitle)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent 
        className="!max-w-[560px] !w-[90vw] max-h-[85vh] flex flex-col p-5 rounded-2xl border border-slate-100 shadow-2xl !z-[9999]"
        style={{ maxWidth: '560px', width: '90vw' }}
      >
        <DialogHeader className="gap-1">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Layers className="h-4.5 w-4.5 text-primary flex-shrink-0" />
            Giao Phiếu Bài Tập
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isReadOnlyTitleDescription 
              ? `Giao phiếu "${defaultTitle}" cho các lớp học.`
              : `Bạn đã chọn ${assignmentIds.length} bài tập. Nhập thông tin phiếu và chọn lớp để giao.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 overflow-y-auto">
          <div className="space-y-3">
             <div>
               <label className="text-xs font-semibold text-slate-700 mb-1 block">Tên phiếu bài tập <span className="text-rose-500">*</span></label>
               <input
                 type="text"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 readOnly={isReadOnlyTitleDescription}
                 disabled={isReadOnlyTitleDescription}
                 placeholder="VD: Phiếu bài tập cuối tuần 1..."
                 className={`w-full h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none transition-all ${
                   isReadOnlyTitleDescription
                     ? 'bg-slate-100 text-slate-600 cursor-not-allowed font-medium'
                     : 'bg-white text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20'
                 }`}
               />
             </div>
             <div>
               <label className="text-xs font-semibold text-slate-700 mb-1 block">Mô tả (Tùy chọn)</label>
               <textarea
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 readOnly={isReadOnlyTitleDescription}
                 disabled={isReadOnlyTitleDescription}
                 placeholder="Hướng dẫn chung cho học sinh..."
                 rows={2}
                 className={`w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none transition-all resize-none ${
                   isReadOnlyTitleDescription
                     ? 'bg-slate-100 text-slate-600 cursor-not-allowed font-medium'
                     : 'bg-white text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20'
                 }`}
               />
             </div>

             <div>
               <div className="flex items-center justify-between mb-1.5">
                 <label className="text-xs font-semibold text-slate-700">
                   Điểm tối đa từng câu
                 </label>
                 <div className="flex items-center gap-2">
                   <span className={`text-xs font-bold ${hasNegativeScore || currentTotalScore > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                     Tổng điểm: {currentTotalScore.toFixed(1)} / 10
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
                 {assignmentIds.map((id, index) => {
                   const assignment = assignments?.find(a => a.id === id)
                   const title = assignment ? assignment.title : `Câu ${index + 1}`
                   return (
                     <div key={id} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                       <span className="font-semibold text-slate-700 truncate pr-2 flex-1">
                         {index + 1}. {title}
                       </span>
                       <div className="flex items-center gap-1 flex-shrink-0">
                         <input
                           type="number"
                           step="0.5"
                           min="0"
                           max="10"
                           value={scoresMap[id] || ''}
                           onChange={(e) => {
                             const val = e.target.value
                             setScoresMap(prev => ({ ...prev, [id]: val }))
                           }}
                           className="w-16 h-7 px-2 text-center rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary"
                         />
                         <span className="text-slate-400 font-medium">điểm</span>
                       </div>
                     </div>
                   )
                 })}
               </div>
             </div>
          </div>

          <div className="flex gap-3 h-[210px] border border-slate-200 rounded-xl overflow-hidden mt-1">
            {loadingClasses ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Left: Class checkboxes */}
                <div className="w-44 flex-shrink-0 flex flex-col gap-1 overflow-y-auto p-2 bg-slate-50">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                    Chọn lớp
                  </p>
                  {myClasses.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1">Không có lớp học nào.</p>
                  ) : (
                    targets.map((t) => (
                      <button
                        key={t.classCode}
                        id={`publish-class-${t.classCode}`}
                        onClick={() => toggleClass(t.classCode)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all duration-150 w-full ${
                          t.selected
                            ? 'border-primary/40 bg-primary/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-100'
                        }`}
                      >
                        <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${t.selected ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                          {t.selected && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{t.className}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{t.classCode}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Right: Deadline config for selected classes */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2.5 bg-white">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Hạn nộp
                  </p>
                  {selectedTargets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center space-y-1">
                      <CalendarDays className="h-7 w-7 text-slate-300" />
                      <p className="text-xs text-slate-400">Chọn lớp bên trái để chọn hạn nộp</p>
                    </div>
                  ) : (
                    selectedTargets.map((t) => (
                      <div
                        key={t.classCode}
                        className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 animate-in slide-in-from-left-2 duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{t.className}</p>
                          </div>
                          <button
                            onClick={() => toggleClass(t.classCode)}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                            title="Bỏ chọn lớp này"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <input
                            id={`deadline-${t.classCode}`}
                            type="datetime-local"
                            value={t.deadline}
                            onChange={(e) => setDeadline(t.classCode, e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="h-8 w-full px-2 text-xs rounded-md border border-slate-200 bg-white text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="mt-1 pt-3 border-t border-slate-100 flex-row items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            {selectedTargets.length > 0
              ? `Giao cho ${selectedTargets.length} lớp`
              : 'Chưa chọn lớp'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPublishing}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              id="confirm-publish-sheet-btn"
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || selectedTargets.length === 0 || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-colors shadow-sm disabled:opacity-50"
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Giao Phiếu
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
