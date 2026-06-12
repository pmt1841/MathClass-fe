'use client'

import { useEffect, useState, use, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronRight, Send, Save, Users, XCircle, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { CountdownTimer } from './countdown-timer'
import { SubmissionEditor } from './submission-editor'
import { submissionApi } from '@/lib/api/submission'

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
  const [submissionStatus, setSubmissionStatus] = useState<'DRAFT' | 'SUBMITTED' | null>(null)
  const [submissionScore, setSubmissionScore] = useState<number | null>(null)
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
      } catch {}
    }
    setUserRole(currentRole)

    if (!classCode) {
      toast.error('Thiếu mã lớp (classCode)')
      router.push('/assignments')
      return
    }

    const fetchDetail = async () => {
      try {
        const response = await api.get(`/classrooms/${classCode}/assignments/${id}/detail`)
        setAssignment(response.data)

        // Nếu là học sinh, lấy bài nộp của họ
        if (currentRole === 'STUDENT') {
          try {
            const sub = await submissionApi.getMySubmission(assignmentId)
            if (sub) {
              setSubmissionId(sub.id)
              setSubmissionContent(sub.content || '')
              setSubmissionStatus(sub.status)
              setSubmissionScore(sub.score)
              if (sub.updatedAt) {
                const dateStr = sub.updatedAt.includes('T') && !sub.updatedAt.endsWith('Z') && !sub.updatedAt.includes('+') ? `${sub.updatedAt}Z` : sub.updatedAt;
                setLastSavedExternal(new Date(dateStr))
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
            const subs = await submissionApi.getSubmissionsByAssignment(assignmentId)
            setTeacherSubmissions(subs)
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
    setShowLeaveModal(true)
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
      return await submissionApi.updateSubmission(submissionId, content, status)
    } else {
      return await submissionApi.createSubmission(assignmentId, content, status)
    }
  }

  const handleAutoSaveDraft = async (content: string) => {
    if (submissionScore !== null) return;
    try {
      setIsSavingExternal(true)
      const res = await saveOrUpdateSubmission(content, 'DRAFT')
      if (!submissionId) setSubmissionId(res.id)
      setSubmissionStatus('DRAFT')
      const dateStr = res.updatedAt.includes('T') && !res.updatedAt.endsWith('Z') && !res.updatedAt.includes('+') ? `${res.updatedAt}Z` : res.updatedAt;
      setLastSavedExternal(new Date(dateStr))
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
      const dateStr = res.updatedAt.includes('T') && !res.updatedAt.endsWith('Z') && !res.updatedAt.includes('+') ? `${res.updatedAt}Z` : res.updatedAt;
      setLastSavedExternal(new Date(dateStr))
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
      const dateStr = res.updatedAt.includes('T') && !res.updatedAt.endsWith('Z') && !res.updatedAt.includes('+') ? `${res.updatedAt}Z` : res.updatedAt;
      setLastSavedExternal(new Date(dateStr))
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
      const res = await submissionApi.unsubmit(submissionId)
      setSubmissionStatus('DRAFT')
      const dateStr = res.updatedAt.includes('T') && !res.updatedAt.endsWith('Z') && !res.updatedAt.includes('+') ? `${res.updatedAt}Z` : res.updatedAt;
      setLastSavedExternal(new Date(dateStr))
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
      const res = await submissionApi.gradeSubmission(subId, scoreVal)
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

  const isPastDeadline = assignment.deadline ? new Date() > new Date(assignment.deadline) : false
  const isGraded = submissionScore !== null
  const isReadOnly = isPastDeadline || userRole !== 'STUDENT' || isGraded || submissionStatus === 'SUBMITTED'

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
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {assignment.content || "Không có nội dung chi tiết."}
                </ReactMarkdown>
              </div>
            </div>
          </Panel>
          
          {userRole === 'STUDENT' && (
            <>
              {/* RESIZE HANDLE */}
              <PanelResizeHandle className="w-2 mx-1 rounded-full bg-slate-200 hover:bg-primary/50 transition-colors cursor-col-resize flex flex-col items-center justify-center gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-400" />
                <div className="w-1 h-1 rounded-full bg-slate-400" />
                <div className="w-1 h-1 rounded-full bg-slate-400" />
              </PanelResizeHandle>
              
              {/* PANEL PHẢI: KHU VỰC LÀM BÀI */}
              <Panel defaultSize={60} minSize={30} className="ml-2">
                <SubmissionEditor 
                  assignmentId={assignmentId} 
                  initialContent={submissionContent}
                  onChange={setSubmissionContent}
                  readOnly={isReadOnly}
                  isSavingExternal={isSavingExternal}
                  lastSavedExternal={lastSavedExternal}
                  onAutoSave={handleAutoSaveDraft}
                />
              </Panel>
            </>
          )}

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
                        Nộp lúc: {sub.submittedAt ? new Date(sub.submittedAt.includes('T') && !sub.submittedAt.endsWith('Z') && !sub.submittedAt.includes('+') ? `${sub.submittedAt}Z` : sub.submittedAt).toLocaleString('vi-VN') : 'Chưa nộp'}
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
