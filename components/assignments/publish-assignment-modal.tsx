import { useState, useEffect } from 'react'
import { Send, Check, Clock, X, CalendarDays, Loader2 } from 'lucide-react'
import api from '@/lib/axios'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MyClassroom {
  id: number
  classCode: string
  className: string
}

interface TargetClassEntry {
  classCode: string
  className: string
  deadline: string
  selected: boolean
}

interface PublishAssignmentModalProps {
  open: boolean
  assignmentId: number | null
  assignmentTitle?: string
  defaultClassCode?: string
  onClose: () => void
  onSuccess: () => void
  onSubmit?: (targets: { classCode: string; deadline: string }[]) => void
  isSubmitting?: boolean
}

export function PublishAssignmentModal({
  open,
  assignmentId,
  assignmentTitle,
  defaultClassCode = '',
  onClose,
  onSuccess,
  onSubmit,
  isSubmitting = false,
}: PublishAssignmentModalProps) {
  const [myClasses, setMyClasses] = useState<MyClassroom[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [targets, setTargets] = useState<TargetClassEntry[]>([])

  useEffect(() => {
    if (!open) return
    const load = async () => {
      try {
        setLoadingClasses(true)
        const res = await api.get('/classrooms/my-classroom')
        const list: MyClassroom[] = Array.isArray(res.data) ? res.data : []
        setMyClasses(list)
        
        const defaultDeadline = getDefaultDeadline()
        setTargets(
          list.map((c) => ({
            classCode: c.classCode,
            className: c.className,
            deadline: c.classCode === defaultClassCode ? defaultDeadline : '',
            selected: c.classCode === defaultClassCode,
          }))
        )
      } catch {
        toast.error('Không thể tải danh sách lớp học')
      } finally {
        setLoadingClasses(false)
      }
    }
    load()
  }, [open, defaultClassCode])

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

  const selectedTargets = targets.filter((t) => t.selected)

  const handlePublish = async () => {
    if (!assignmentId && !onSubmit) return
    
    const missing = selectedTargets.filter((t) => !t.deadline)
    if (missing.length > 0) {
      toast.error(`Vui lòng chọn hạn nộp cho: ${missing.map((t) => t.className).join(', ')}`)
      return
    }
    if (selectedTargets.length === 0) {
      toast.error('Vui lòng chọn ít nhất một lớp để giao bài')
      return
    }

    if (onSubmit) {
      onSubmit(selectedTargets.map((t) => ({ classCode: t.classCode, deadline: t.deadline })))
      return
    }

    try {
      setPublishing(true)
      await api.put(`/assignments/${assignmentId}/publish`, {
        targets: selectedTargets.map((t) => ({
          classCode: t.classCode,
          deadline: new Date(t.deadline).toISOString(),
        })),
      })
      toast.success(assignmentTitle ? `Đã giao bài tập "${assignmentTitle}" thành công!` : 'Đã giao bài tập thành công!')
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data || 'Không thể giao bài tập')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col !z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Giao bài tập
          </DialogTitle>
          <DialogDescription>
            Chọn lớp và cấu hình hạn nộp{assignmentTitle ? <span> cho <span className="font-semibold text-foreground">&quot;{assignmentTitle}&quot;</span></span> : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4 min-h-0 mt-2">
          {loadingClasses ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Left: Class checkboxes */}
              <div className="w-48 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                  Chọn lớp học
                </p>
                {myClasses.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1">Không có lớp học nào.</p>
                ) : (
                  targets.map((t) => (
                    <button
                      key={t.classCode}
                      id={`publish-class-${t.classCode}`}
                      onClick={() => toggleClass(t.classCode)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150 w-full ${
                        t.selected
                          ? 'border-primary/40 bg-primary/5 shadow-sm'
                          : 'border-border bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${t.selected ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                        {t.selected && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{t.className}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{t.classCode}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Right: Deadline config for selected classes */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-3 pl-1 border-l border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                  Cấu hình hạn nộp
                </p>
                {selectedTargets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center space-y-2 py-8">
                    <CalendarDays className="h-8 w-8 text-slate-300" />
                    <p className="text-sm text-muted-foreground">Chọn lớp học để cấu hình hạn nộp</p>
                  </div>
                ) : (
                  selectedTargets.map((t) => (
                    <div
                      key={t.classCode}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white animate-in slide-in-from-left-2 duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{t.className}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.classCode}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <input
                          id={`deadline-${t.classCode}`}
                          type="datetime-local"
                          value={t.deadline}
                          onChange={(e) => setDeadline(t.classCode, e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="h-9 px-2 text-xs rounded-lg border border-border bg-slate-50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                        />
                        <button
                          onClick={() => toggleClass(t.classCode)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-rose-50 transition-colors flex-shrink-0"
                          title="Bỏ chọn lớp này"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 w-full justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedTargets.length > 0
                ? `Sẽ giao cho ${selectedTargets.length} lớp`
                : 'Chưa chọn lớp nào'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={publishing || isSubmitting}
                className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                id="confirm-publish-btn"
                type="button"
                onClick={handlePublish}
                disabled={publishing || isSubmitting || selectedTargets.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {publishing || isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Giao bài
              </button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
