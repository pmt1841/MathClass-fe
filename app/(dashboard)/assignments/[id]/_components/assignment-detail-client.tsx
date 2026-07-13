'use client'

import { useEffect, useState, use, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronRight, Send, Save, Users, XCircle, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '@/lib/markdown'
import 'katex/dist/katex.min.css'
import { toast } from 'sonner'
import { classroomService } from '@/services/classroomService'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { CountdownTimer } from './countdown-timer'
import { StudentAssignmentLayout } from './student-assignment-layout'
import { submissionService } from '@/services/submissionService'
import { formatDateTime, parseDateSafe } from '@/lib/utils'
import dynamic from 'next/dynamic'

const JsxGraphBoard = dynamic(() => import('@/components/ui/jsxgraph-board').then(mod => mod.JsxGraphBoard), { ssr: false })

export const extractDrawings = (content: string) => {
  if (!content) return { content: '', extractedDrawings: [] }
  let extractedDrawings: any[] = []
  let newContent = content
  const match = content.match(/<!-- DRAWINGS_DATA_START\n([\s\S]*?)\nDRAWINGS_DATA_END -->/)
  if (match) {
    try {
      extractedDrawings = JSON.parse(match[1])
      newContent = content.replace(/\n\n<!-- DRAWINGS_DATA_START[\s\S]*?DRAWINGS_DATA_END -->/g, '')
    } catch (e) {
      console.error("Failed to parse drawings", e)
    }
  }
  return { content: newContent, extractedDrawings }
}

interface AssignmentDetail {
  id: number
  title: string
  description: string
  content: string
  deadline: string
  status: string
  teacherName: string
  classCode: string
  className: string
  images?: { id: number; imageCode: string; imageUrl: string }[]
}

export function AssignmentDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const classCode = searchParams.get('classCode')
  const from = searchParams.get('from')

  const resolvedParams = use(params)
  const id = resolvedParams.id
  const assignmentId = parseInt(id)

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showUnsubmitModal, setShowUnsubmitModal] = useState(false)
  const [userRole, setUserRole] = useState<string>('STUDENT')

  // Submission states
  const [submissionId, setSubmissionId] = useState<number | null>(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState<'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE' | null>(null)
  const [submissionScore, setSubmissionScore] = useState<number | null>(null)
  const [submissionTeacherFeedback, setSubmissionTeacherFeedback] = useState<string>('')
  const [isSavingExternal, setIsSavingExternal] = useState(false)
  const [lastSavedExternal, setLastSavedExternal] = useState<Date | null>(null)
  const [teacherSubmissions, setTeacherSubmissions] = useState<any[]>([])

  // Teacher grade states
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null)
  const [gradingScore, setGradingScore] = useState<string>('')

  const isSavingExternalRef = useRef(isSavingExternal)
  useEffect(() => {
    isSavingExternalRef.current = isSavingExternal
  }, [isSavingExternal])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSavingExternalRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    // Get user role
    const stored = sessionStorage.getItem('user_info') || localStorage.getItem('user_info')
    let currentRole = 'STUDENT'
    if (stored) {
      try {
        const userInfo = JSON.parse(stored)
        if (userInfo.userRole) currentRole = userInfo.userRole
      } catch { }
    }
    setUserRole(currentRole)

    if (!classCode) {
      toast.error('Thiếu mã lớp (classCode)')
      router.push('/assignments')
      return
    }

    const fetchDetail = async () => {
      try {
        const data = await classroomService.getClassroomAssignmentDetail(classCode, Number(id))
        setAssignment(data)

        // Nếu là học sinh, lấy bài nộp của họ
        if (currentRole === 'STUDENT') {
          try {
            const sub = await submissionService.getMySubmission(assignmentId)
            if (sub) {
              setSubmissionId(sub.id)
              setSubmissionContent(sub.content || '')
              setSubmissionStatus(sub.status)
              setSubmissionScore(sub.score)
              setSubmissionTeacherFeedback(sub.teacherFeedback || '')
              if (sub.updatedAt) {
                setLastSavedExternal(parseDateSafe(sub.updatedAt))
              }
            }
          } catch (err: any) {
            if (err.response?.status !== 404 && err.response?.status !== 400 && err.response?.status !== 204) {
              console.error('Lỗi khi lấy bài nộp:', err)
            }
          }
        } else if (currentRole === 'TEACHER') {
          // Lấy danh sách bài nộp của lớp
          try {
            const subs = await submissionService.getSubmissionsByAssignment({ assignmentId, size: 100 })
            setTeacherSubmissions(subs.content || [])
          } catch (err) {
            console.error('Lỗi lấy danh sách bài nộp:', err)
          }
        }
      } catch (error) {
        console.error('Error fetching assignment detail:', error)
        toast.error('Không thể tải chi tiết bài tập. Vui lòng thử lại.')
        router.push('/assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id, classCode, router, assignmentId])

  const handleBackClick = () => {
    const pastDeadline = assignment?.deadline ? Date.now() > (parseDateSafe(assignment.deadline)?.getTime() ?? Infinity) : false
    const graded = submissionScore !== null
    const readOnly = pastDeadline || userRole !== 'STUDENT' || graded || submissionStatus === 'SUBMITTED'

    if (readOnly) {
      if (window.history.length > 2) {
        router.back()
      } else {
        router.push('/assignments')
      }
    } else {
      setShowLeaveModal(true)
    }
  }

  const handleLeaveConfirm = () => {
    setShowLeaveModal(false)
    if (window.history.length > 2) {
      router.back()
    } else {
      router.push('/assignments')
    }
  }

  const saveOrUpdateSubmission = async (content: string, status: 'DRAFT' | 'SUBMITTED') => {
    if (submissionId) {
      return await submissionService.updateSubmission(submissionId, content, status)
    } else {
      return await submissionService.createSubmission(assignmentId, content, status)
    }
  }

  const handleAutoSaveDraft = async (content: string) => {
    if (submissionScore !== null) return;
    try {
      setIsSavingExternal(true)
      const res = await saveOrUpdateSubmission(content, 'DRAFT')
      if (!submissionId) setSubmissionId(res.id)
      setSubmissionStatus('DRAFT')
      setLastSavedExternal(new Date())
    } catch (error: any) {
      console.error('Lỗi auto-save', error)
    } finally {
      setIsSavingExternal(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!submissionContent.trim()) {
      toast.error('Vui lòng nhập nội dung trước khi lưu.')
      return
    }
    try {
      setIsSavingExternal(true)
      const res = await saveOrUpdateSubmission(submissionContent, 'DRAFT')
      if (!submissionId) setSubmissionId(res.id)
      setSubmissionStatus('DRAFT')
      setLastSavedExternal(new Date())
      toast.success('Đã lưu nháp thành công')
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra khi lưu nháp.')
    } finally {
      setIsSavingExternal(false)
    }
  }

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      toast.error('Vui lòng nhập nội dung trước khi nộp.')
      return
    }
    try {
      setIsSavingExternal(true)
      const res = await saveOrUpdateSubmission(submissionContent, 'SUBMITTED')
      if (!submissionId) setSubmissionId(res.id)
      setSubmissionStatus('SUBMITTED')
      setLastSavedExternal(new Date())
      toast.success('Đã nộp bài thành công!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra khi nộp bài.')
    } finally {
      setIsSavingExternal(false)
    }
  }

  const handleUnsubmitConfirm = async () => {
    if (!submissionId) return;
    try {
      setIsSavingExternal(true)
      const res = await submissionService.unsubmit(submissionId)
      setSubmissionStatus('DRAFT')
      setLastSavedExternal(new Date())
      toast.success('Đã hủy nộp bài. Bạn có thể sửa và nộp lại.')
      setShowUnsubmitModal(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra khi hủy nộp bài.')
    } finally {
      setIsSavingExternal(false)
    }
  }

  const handleGradeSubmission = async (subId: number) => {
    const scoreVal = parseFloat(gradingScore)
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 10) {
      toast.error('Điểm số không hợp lệ. Vui lòng nhập từ 0 đến 10.')
      return
    }
    try {
      const res = await submissionService.gradeSubmission(subId, scoreVal)
      toast.success('Đã chấm điểm thành công!')
      setGradingSubmissionId(null)
      setGradingScore('')
      // Update local list
      setTeacherSubmissions(prev => prev.map(s => s.id === subId ? { ...s, score: res.score, updatedAt: res.updatedAt } : s))
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra khi chấm điểm.')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải bài tập...</p>
        </div>
      </div>
    )
  }

  if (!assignment) return null

  const isPastDeadline = assignment.deadline ? Date.now() > (parseDateSafe(assignment.deadline)?.getTime() ?? Infinity) : false
  const isGraded = submissionScore !== null
  const isReadOnly = isPastDeadline || userRole !== 'STUDENT' || isGraded || submissionStatus === 'SUBMITTED'

  if (userRole === 'STUDENT') {
    return (
      <>
        <StudentAssignmentLayout
          assignment={assignment}
          submissionContent={submissionContent}
          setSubmissionContent={setSubmissionContent}
          isReadOnly={isReadOnly}
          isSavingExternal={isSavingExternal}
          lastSavedExternal={lastSavedExternal}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onUnsubmit={() => setShowUnsubmitModal(true)}
          submissionStatus={submissionStatus}
          submissionScore={submissionScore}
          teacherFeedback={submissionTeacherFeedback}
          onBack={handleBackClick}
          fromText={from === 'class' ? `Lớp ${assignment.className}` : 'Kho bài tập'}
          onAutoSave={handleAutoSaveDraft}
        />
        {showLeaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Rời khỏi trang?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn rời khỏi trang này không? Những thay đổi chưa được lưu tự động có thể bị mất.
                </p>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 border-t border-border justify-end">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleLeaveConfirm}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
                >
                  Vẫn rời đi
                </button>
              </div>
            </div>
          </div>
        )}
        {showUnsubmitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <XCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận hủy nộp bài</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn hủy nộp bài không? Bài làm của bạn sẽ chuyển về trạng thái Lưu nháp và bạn có thể tiếp tục chỉnh sửa.
                </p>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 border-t border-border justify-end">
                <button
                  onClick={() => setShowUnsubmitModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                >
                  Không, quay lại
                </button>
                <button
                  onClick={handleUnsubmitConfirm}
                  disabled={isSavingExternal}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  Đồng ý hủy nộp
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden">
      {/* TOOLBAR */}
      <div className="h-14 bg-white border-b border-border px-4 flex items-center justify-between shrink-0 shadow-sm z-10">

        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm hover:text-slate-900 transition-all"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="hover:text-slate-800 transition-colors cursor-pointer" onClick={handleBackClick}>
              {from === 'class' ? `Lớp ${assignment.className}` : 'Kho bài tập'}
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 truncate max-w-[300px]" title={assignment.title}>
              {assignment.title}
            </span>
          </div>
        </div>

        {/* Center: Countdown Timer (Only if deadline exists) */}
        <div className="flex-1 flex justify-center">
          {assignment.deadline && (
            <CountdownTimer deadline={assignment.deadline} />
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {userRole === 'STUDENT' && isGraded && (
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
              Điểm của bạn: {submissionScore}
            </span>
          )}
          {userRole === 'STUDENT' && !isPastDeadline && !isGraded && (
            <>
              {submissionStatus !== 'SUBMITTED' ? (
                <>
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSavingExternal}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Lưu nháp
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSavingExternal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowUnsubmitModal(true)}
                  disabled={isSavingExternal}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 text-sm font-semibold rounded-lg hover:bg-rose-100 shadow-sm transition-all disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Hủy nộp bài
                </button>
              )}
            </>
          )}
          {userRole === 'STUDENT' && isPastDeadline && !isGraded && (
            <span className="text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
              Đã hết hạn nộp bài
            </span>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-0 overflow-hidden p-2 sm:p-4">
        <PanelGroup direction="horizontal" className="h-full w-full">

          {/* PANEL TRÁI: ĐỀ BÀI */}
          <Panel defaultSize={userRole === 'STUDENT' ? 40 : 100} minSize={25} className={`bg-white rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden ${userRole === 'STUDENT' ? 'mr-2' : ''}`}>
            <div className="p-5 border-b border-border bg-slate-50/50 shrink-0">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                {assignment.title}
              </h1>
              {assignment.description && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {assignment.description}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-8">
              <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600">
                {(() => {
                  if (!assignment.content) return "Không có nội dung chi tiết."
                  const { content, extractedDrawings } = extractDrawings(assignment.content)
                  const parts = content.split(/(\[SHAPE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\]|\[IMAGE_[a-zA-Z0-9_]+(?:\|[^\]]*)?\])/g)
                  return parts.map((part, index) => {
                    const match = part.match(/^\[(SHAPE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
                    if (match) {
                      const shapeCode = match[1]
                      const drawing = extractedDrawings.find(d => d.shapeCode === shapeCode)
                      if (drawing) {
                        let width: string | number = '100%'
                        let height: string | number = 300
                        if (match[2]) {
                          const [w, h] = match[2].split('x')
                          if (w) width = isNaN(Number(w)) ? w : Number(w)
                          if (h) height = isNaN(Number(h)) ? h : Number(h)
                        }
                        return <JsxGraphBoard key={index} shapeCode={shapeCode} jsxGraphData={drawing.jsxGraphData} width={width} height={height} />
                      }
                    }

                    const imageMatch = part.match(/^\[(IMAGE_[a-zA-Z0-9_]+)(?:\|([^\]]+))?\]$/)
                    if (imageMatch) {
                      const imageCode = imageMatch[1]
                      const image = assignment.images?.find((img: any) => img.imageCode === `[${imageCode}]`)
                      if (image) {
                        let width: string | number = 'auto'
                        let height: string | number = 'auto'
                        if (imageMatch[2]) {
                          const [w, h] = imageMatch[2].split('x')
                          if (w) width = isNaN(Number(w)) ? w : Number(w)
                          if (h) height = isNaN(Number(h)) ? h : Number(h)
                        }
                        // eslint-disable-next-line @next/next/no-img-element
                        return <img key={index} src={image.imageUrl} alt="Assignment image" className="max-w-full rounded-lg my-4 shadow-sm border border-slate-200" style={{ width, height }} />
                      }
                    }

                    return (
                      <ReactMarkdown
                        key={index}
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
                      >
                        {part}
                      </ReactMarkdown>
                    )
                  })
                })()}
              </div>
            </div>
          </Panel>

          {/* RESIZE HANDLE is handled differently now, but we just don't render right side for teacher */}

        </PanelGroup>
      </div>

      {/* TEACHER VIEW: Danh sách nộp bài */}
      {userRole === 'TEACHER' && (
        <div className="fixed top-14 right-0 bottom-0 w-[400px] bg-white border-l border-border shadow-2xl flex flex-col z-20">
          <div className="p-4 border-b border-border bg-slate-50 flex items-center gap-2 font-semibold text-slate-800">
            <Users className="w-5 h-5 text-primary" />
            Danh sách nộp bài ({teacherSubmissions.length})
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50">
            {teacherSubmissions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center mt-10 italic">Chưa có học sinh nào nộp bài.</p>
            ) : (
              teacherSubmissions.map((sub) => (
                <div key={sub.id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{sub.studentName || 'Học sinh'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {sub.status === 'SUBMITTED' ? 'Đã nộp' : 'Lưu nháp'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Nộp lúc: {sub.submittedAt ? formatDateTime(sub.submittedAt) : 'Chưa nộp'}
                  </p>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                    {sub.score !== null ? (
                      <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Điểm: {sub.score}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        {gradingSubmissionId === sub.id ? (
                          <>
                            <input
                              type="number"
                              min="0" max="10" step="0.5"
                              value={gradingScore}
                              onChange={(e) => setGradingScore(e.target.value)}
                              className="w-20 text-sm border border-slate-300 rounded-lg px-2 py-1 outline-none focus:border-primary"
                              placeholder="Điểm"
                            />
                            <button
                              onClick={() => handleGradeSubmission(sub.id)}
                              className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setGradingSubmissionId(null)}
                              className="text-xs text-slate-500 hover:text-slate-700 underline"
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingSubmissionId(sub.id)
                              setGradingScore('')
                            }}
                            className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors w-full text-center"
                          >
                            Chấm điểm
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Rời khỏi trang?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn rời khỏi trang này không? Những thay đổi chưa được lưu tự động có thể bị mất.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 border-t border-border justify-end">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
              >
                Vẫn rời đi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsubmit Confirmation Modal */}
      {showUnsubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận hủy nộp bài</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn hủy nộp bài không? Bài làm của bạn sẽ chuyển về trạng thái Lưu nháp và bạn có thể tiếp tục chỉnh sửa.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 border-t border-border justify-end">
              <button
                onClick={() => setShowUnsubmitModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                Không, quay lại
              </button>
              <button
                onClick={handleUnsubmitConfirm}
                disabled={isSavingExternal}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                Đồng ý hủy nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
