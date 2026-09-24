'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sparkles,
  ThumbsUp,
  AlertCircle,
  MessageSquareQuote,
  Clock,
  Send,
  Loader2,
  Trash2,
  User,
  History,
  CheckCircle2,
  ChevronDown,
  AlertTriangle,
  Calendar,
  Bot,
} from 'lucide-react'
import { toast } from 'sonner'
import { Student } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  useStudentRemarks,
  useCreateStudentRemark,
  useDeleteStudentRemark,
  useAiStudentRemarkEvaluation,
} from '@/hooks/useStudentRemarks'
import { useQuery } from '@tanstack/react-query'
import { aiFeatureService, AI_FEATURE_TASKS } from '@/services/aiFeatureService'
import { PermissionGuard } from '@/components/ui/with-permission'

interface StudentRemarksModalProps {
  open: boolean
  onClose: () => void
  student: Student | null
  classCode: string
}

export function StudentRemarksModal({
  open,
  onClose,
  student,
  classCode,
}: StudentRemarksModalProps) {
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [generalAssessment, setGeneralAssessment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [remarkToDelete, setRemarkToDelete] = useState<number | null>(null)
  // Quản lý danh sách ID của nhận xét đang được mở rộng (mặc định mở nhận xét mới nhất)
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({})

  // State cho trợ lý AI đánh giá
  const [selectedDays, setSelectedDays] = useState<number>(7)
  const [scanInfo, setScanInfo] = useState<{
    startDate: string
    endDate: string
    total: number
    completed: number
    overdue?: number
    active?: number
    avgScore?: number | null
  } | null>(null)

  const studentId = student?.id ?? null
  const { data: remarks = [], isLoading } = useStudentRemarks(classCode, studentId)
  const createMutation = useCreateStudentRemark(classCode, studentId)
  const deleteMutation = useDeleteStudentRemark(classCode, studentId)
  const aiEvaluateMutation = useAiStudentRemarkEvaluation(classCode, studentId)

  // Kiểm tra cờ bật/tắt tính năng AI từ Admin
  const { data: aiFeatures } = useQuery({
    queryKey: ['ai-features'],
    queryFn: aiFeatureService.getFeatures,
  })
  const isAiRemarkEnabled = aiFeatures?.[AI_FEATURE_TASKS.STUDENT_REMARK] === true

  // Reset form và trạng thái mở rộng khi đổi học sinh hoặc mở modal
  useEffect(() => {
    if (open) {
      setStrengths('')
      setWeaknesses('')
      setGeneralAssessment('')
      setExpandedIds({})
      setRemarkToDelete(null)
      setScanInfo(null)
      setSelectedDays(7)
    }
  }, [open, student?.id])

  // Xử lý gọi AI đánh giá tiến độ học sinh
  const handleAiEvaluate = () => {
    if (!studentId) return
    aiEvaluateMutation.mutate(
      { days: selectedDays },
      {
        onSuccess: (res) => {
          setStrengths(res.strengths || '')
          setWeaknesses(res.weaknesses || '')
          setGeneralAssessment(res.generalAssessment || '')
          setScanInfo({
            startDate: res.startDate,
            endDate: res.endDate,
            total: res.totalAssignments,
            completed: res.completedAssignments,
            overdue: res.overdueAssignments,
            active: res.activeIncompleteAssignments,
            avgScore: res.averageScore,
          })
          toast.success('AI đã quét dữ liệu và điền gợi ý đánh giá thành công!')
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            err?.response?.data ||
            'Không thể sinh đánh giá từ AI. Vui lòng kiểm tra số dư credit hoặc thử lại.'
          toast.error(typeof msg === 'string' ? msg : 'AI Đánh giá thất bại')
        },
      }
    )
  }

  // Toggle mở/đóng 1 nhận xét
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const current = prev[id] !== undefined ? prev[id] : (remarks.length > 0 && remarks[0].id === id)
      return {
        ...prev,
        [id]: !current,
      }
    })
  }

  const isExpanded = (id: number, index: number) => {
    if (expandedIds[id] !== undefined) {
      return expandedIds[id]
    }
    // Mặc định mở nhận xét đầu tiên (mới nhất), các nhận xét cũ hơn thì đóng
    return index === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!strengths.trim() && !weaknesses.trim() && !generalAssessment.trim()) {
      toast.error('Vui lòng nhập ít nhất điểm mạnh, điểm yếu hoặc đánh giá chung')
      return
    }

    setIsSubmitting(true)
    createMutation.mutate(
      {
        strengths: strengths.trim() || undefined,
        weaknesses: weaknesses.trim() || undefined,
        generalAssessment: generalAssessment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã lưu nhận xét học sinh thành công')
          setStrengths('')
          setWeaknesses('')
          setGeneralAssessment('')
          setIsSubmitting(false)
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            err?.response?.data ||
            'Không thể lưu nhận xét. Vui lòng thử lại.'
          toast.error(typeof msg === 'string' ? msg : 'Lưu nhận xét thất bại')
          setIsSubmitting(false)
        },
      }
    )
  }

  const handleConfirmDelete = () => {
    if (!remarkToDelete) return

    const id = remarkToDelete
    setDeletingId(id)
    setRemarkToDelete(null)

    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Đã xóa nhận xét thành công')
        setDeletingId(null)
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          'Không thể xóa nhận xét'
        toast.error(typeof msg === 'string' ? msg : 'Xóa nhận xét thất bại')
        setDeletingId(null)
      },
    })
  }

  const initials = student?.fullName
    ? student.fullName
      .split(' ')
      .slice(-2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : '?'

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="max-w-5xl sm:max-w-[1050px] w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/20">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                  {initials}
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>Hồ sơ theo dõi học sinh</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-100/80 text-indigo-700">
                      {student?.fullName}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {student?.email} • Ghi nhận và theo dõi tiến độ học tập (Điểm mạnh & Điểm yếu)
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Modal Body: Split 2 Columns */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[480px]">
            {/* Cột Trái (lg:col-span-5): Ghi nhận xét mới */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/40 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-4">
              <PermissionGuard
                permission="classroom:manage_requests"
                fallback={
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Chế độ xem lịch sử nhận xét
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Chỉ giáo viên phụ trách lớp mới có quyền ghi nhận xét và đánh giá tiến độ cho học sinh.
                    </p>
                  </div>
                }
              >
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Viết nhận xét mới</span>
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Lưu mốc thời gian thực
                      </span>
                    </div>

                    {/* Khối Trợ lý AI Quét & Đánh giá học sinh */}
                    {isAiRemarkEnabled && (
                      <div className="rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white p-3.5 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span>AI Đánh giá tiến độ</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">
                                  ~5 credit
                                </span>
                              </h4>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleAiEvaluate}
                            disabled={aiEvaluateMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-semibold shadow-sm shadow-indigo-500/20 hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {aiEvaluateMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Đang quét...</span>
                              </>
                            ) : (
                              <>
                                <Bot className="h-3.5 w-3.5" />
                                <span>Quét & Đánh giá</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Thanh chọn mốc thời gian */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mr-1">
                            <Calendar className="h-3 w-3" />
                            <span>Mốc thời gian:</span>
                          </span>
                          {[
                            { days: 3, label: '3 ngày' },
                            { days: 7, label: '7 ngày' },
                            { days: 30, label: '1 tháng' },
                          ].map((item) => (
                            <button
                              key={item.days}
                              type="button"
                              onClick={() => setSelectedDays(item.days)}
                              disabled={aiEvaluateMutation.isPending}
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-lg transition-all border ${
                                selectedDays === item.days
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white/90 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Banner thông báo kết quả quét dữ liệu */}
                        {scanInfo && (
                          <section
                            aria-label="Kết quả đánh giá AI"
                            className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] animate-in fade-in duration-200"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate">
                                Quét từ <strong>{formatDate(scanInfo.startDate)}</strong> đến{' '}
                                <strong>{formatDate(scanInfo.endDate)}</strong> • Đã nộp{' '}
                                <strong>{scanInfo.completed}/{scanInfo.total}</strong> bài
                                {scanInfo.active != null && scanInfo.active > 0 && (
                                  <span className="text-slate-600 font-normal">
                                    {' '}
                                    ({scanInfo.active} bài còn hạn
                                    {scanInfo.overdue != null && scanInfo.overdue > 0
                                      ? `, ${scanInfo.overdue} quá hạn`
                                      : ''}
                                    )
                                  </span>
                                )}
                                {scanInfo.active === 0 &&
                                  scanInfo.overdue != null &&
                                  scanInfo.overdue > 0 && (
                                    <span className="text-amber-700 font-medium">
                                      {' '}
                                      ({scanInfo.overdue} bài quá hạn)
                                    </span>
                                  )}
                                {scanInfo.avgScore != null && ` • ĐTB: ${scanInfo.avgScore}`}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setScanInfo(null)}
                              aria-label="Đóng"
                              className="text-emerald-700 hover:text-emerald-900 text-[10px] font-medium ml-1 flex-shrink-0 hover:underline"
                            >
                              Đóng
                            </button>
                          </section>
                        )}
                      </div>
                    )}

                    <form id="remark-form" onSubmit={handleSubmit} className="space-y-3">
                      {/* Điểm mạnh */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Điểm mạnh & Ưu điểm</span>
                        </label>
                        <textarea
                          value={strengths}
                          onChange={(e) => setStrengths(e.target.value)}
                          placeholder="VD: Tư duy logic tốt, phản xạ nhanh với các bài toán hình học..."
                          rows={3}
                          className="w-full text-xs rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-2.5 text-slate-800 outline-none transition-all placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 resize-none"
                        />
                      </div>

                      {/* Điểm yếu */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Điểm yếu & Cần cải thiện</span>
                        </label>
                        <textarea
                          value={weaknesses}
                          onChange={(e) => setWeaknesses(e.target.value)}
                          placeholder="VD: Hay nhầm lẫn dấu khi giải phương trình, trình bày còn vội vàng..."
                          rows={3}
                          className="w-full text-xs rounded-xl border border-amber-200/80 bg-amber-50/30 p-2.5 text-slate-800 outline-none transition-all placeholder:text-muted-foreground/60 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/15 resize-none"
                        />
                      </div>

                      {/* Đánh giá chung / Lời khuyên */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <MessageSquareQuote className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Đánh giá chung & Lời khuyên</span>
                        </label>
                        <textarea
                          value={generalAssessment}
                          onChange={(e) => setGeneralAssessment(e.target.value)}
                          placeholder="VD: Cần luyện tập thêm 10 bài tập rút gọn biểu thức mỗi tuần..."
                          rows={3}
                          className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 outline-none transition-all placeholder:text-muted-foreground/60 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 resize-none"
                        />
                      </div>
                    </form>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      form="remark-form"
                      disabled={
                        isSubmitting ||
                        (!strengths.trim() && !weaknesses.trim() && !generalAssessment.trim())
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-purple-700 active:scale-[.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Đang lưu nhận xét...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Lưu nhận xét học sinh</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </PermissionGuard>
            </div>

            {/* Cột Phải (lg:col-span-7): Danh sách Lịch sử nhận xét */}
            <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col overflow-hidden bg-white space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 flex-shrink-0">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-slate-600" />
                  <span>Lịch sử nhận xét ({remarks.length})</span>
                </h3>
              </div>

              {isLoading ? (
                <div className="space-y-3 py-4 flex-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 animate-pulse space-y-3"
                    >
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-6 bg-slate-200 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : remarks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <MessageSquareQuote className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Chưa có nhận xét nào
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-xs">
                    Hãy nhập nhận xét về điểm mạnh, điểm yếu ở khung bên trái để bắt đầu theo dõi quá trình học tập.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 -mr-1 max-h-[460px] space-y-3">
                  <div className="space-y-3 pr-1 pb-2">
                    {remarks.map((remark, index) => {
                      const openItem = isExpanded(remark.id, index)

                      return (
                        <div
                          key={remark.id}
                          className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow"
                        >
                          {/* Accordion / Dropdown Header */}
                          <div
                            onClick={() => toggleExpand(remark.id)}
                            className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50/90 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs flex-shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-800 truncate">
                                    {remark.teacherName || 'Giáo viên'}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDateTime(remark.createdAt)}</span>
                                  </span>
                                </div>

                                {/* Tags preview khi thu gọn */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  {remark.strengths && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Điểm mạnh
                                    </span>
                                  )}
                                  {remark.weaknesses && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      Cần cải thiện
                                    </span>
                                  )}
                                  {remark.generalAssessment && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                      Đánh giá chung
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions: Delete & Expand chevron */}
                            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                              <PermissionGuard permission="classroom:manage_requests">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setRemarkToDelete(remark.id)
                                  }}
                                  disabled={deletingId === remark.id}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                  title="Xóa nhận xét này"
                                >
                                  {deletingId === remark.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </PermissionGuard>

                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-transform duration-200 ${
                                  openItem ? 'rotate-180 text-indigo-600' : ''
                                }`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </div>
                          </div>

                          {/* Dropdown Content */}
                          {openItem && (
                            <div className="p-4 pt-2 space-y-2.5 border-t border-slate-100/80 bg-white">
                              {/* Strengths Badge / Box */}
                              {remark.strengths && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-1">
                                  <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                                    <span>Điểm mạnh & Ưu điểm:</span>
                                  </div>
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-5">
                                    {remark.strengths}
                                  </p>
                                </div>
                              )}

                              {/* Weaknesses Badge / Box */}
                              {remark.weaknesses && (
                                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 space-y-1">
                                  <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                    <span>Điểm yếu & Cần cải thiện:</span>
                                  </div>
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-5">
                                    {remark.weaknesses}
                                  </p>
                                </div>
                              )}

                              {/* General Assessment */}
                              {remark.generalAssessment && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                                  <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-bold">
                                    <MessageSquareQuote className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                                    <span>Đánh giá chung & Lời khuyên:</span>
                                  </div>
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-5">
                                    {remark.generalAssessment}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Xác nhận xóa nhận xét (AlertDialog) */}
      <AlertDialog open={remarkToDelete !== null} onOpenChange={(val) => !val && setRemarkToDelete(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl p-6 bg-white border border-slate-100 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mx-auto sm:mx-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-slate-800">
                Xác nhận xóa nhận xét
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bạn có chắc chắn muốn xóa bản ghi nhận xét này không? Thao tác này sẽ xóa vĩnh viễn và không thể khôi phục lại.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-3">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold px-4 py-2 border-slate-200 hover:bg-slate-50">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs font-semibold px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
            >
              Xóa nhận xét
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
