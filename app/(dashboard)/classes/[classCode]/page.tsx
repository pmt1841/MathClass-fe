'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  GraduationCap,
  Mail,
  Loader2,
  Trash2,
  BookMarked,
  RefreshCw,
  UserX,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'
import api from '@/lib/axios'
import { toast } from 'sonner'

interface Student {
  id: number
  fullName: string
  email: string
  joinedAt?: string
}

interface ClassroomDetail {
  id: number
  classCode: string
  className: string
  description?: string
  teacherId: number
  teacherName: string
  studentCount: number
  maxStudents: number
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const classCode = params?.classCode as string

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loadingClass, setLoadingClass] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Add student state
  const [addEmail, setAddEmail] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  // Remove student state
  const [removingId, setRemovingId] = useState<number | null>(null)

  // Copy code state
  const [codeCopied, setCodeCopied] = useState(false)

  const fetchClassroom = useCallback(async () => {
    try {
      setLoadingClass(true)
      const res = await api.get(`/classrooms/${classCode}`)
      setClassroom(res.data)
    } catch (err: any) {
      toast.error('Không thể tải thông tin lớp học')
      console.error(err)
    } finally {
      setLoadingClass(false)
    }
  }, [classCode])

  const fetchStudents = useCallback(async (showToast = false) => {
    try {
      setLoadingStudents(true)
      const res = await api.get(`/classrooms/${classCode}/students`)
      setStudents(Array.isArray(res.data) ? res.data : [])
      if (showToast) toast.success('Đã cập nhật danh sách học sinh')
    } catch (err: any) {
      toast.error('Không thể tải danh sách học sinh')
      console.error(err)
    } finally {
      setLoadingStudents(false)
    }
  }, [classCode])

  useEffect(() => {
    fetchClassroom()
    fetchStudents()
  }, [fetchClassroom, fetchStudents])

  const handleAddStudent = async (e: React.SubmitEvent) => {
    e.preventDefault()
    const email = addEmail.trim()
    if (!email) return

    setAddingStudent(true)
    setAddError(null)
    setAddSuccess(null)

    try {
      await api.post(`/classrooms/${classCode}/students/add`, { "studentEmail": email })
      setAddSuccess(`Đã thêm học sinh với email: ${email}`)
      setAddEmail('')
      // Refresh both students list and classroom info (studentCount)
      await Promise.all([fetchStudents(), fetchClassroom()])
      toast.success(`Thêm thành công: ${email}`)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        'Không thể thêm học sinh. Vui lòng kiểm tra email.'
      setAddError(typeof msg === 'string' ? msg : 'Đã xảy ra lỗi. Vui lòng thử lại.')
      toast.error('Thêm học sinh thất bại')
    } finally {
      setAddingStudent(false)
    }
  }

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa học sinh "${studentName}" khỏi lớp?`)) return
    setRemovingId(studentId)
    try {
      await api.delete(`/classrooms/${classCode}/students/${studentId}`)
      setStudents((prev) => prev.filter((s) => s.id !== studentId))
      fetchClassroom()
      toast.success(`Đã xóa học sinh: ${studentName}`)
    } catch (err: any) {
      toast.error('Không thể xóa học sinh')
    } finally {
      setRemovingId(null)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode)
    setCodeCopied(true)
    toast.success(`Đã sao chép mã lớp: ${classCode}`)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isFull = classroom
    ? (classroom.studentCount ?? 0) >= (classroom.maxStudents ?? Infinity)
    : false

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* Header */}
      <div className="border-b border-border bg-white py-5">
        <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm"
              title="Quay lại"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BookMarked className="h-5 w-5 text-primary" />
            </div>
            <div>
              {loadingClass ? (
                <div className="space-y-1.5">
                  <div className="h-5 w-48 bg-slate-200 rounded-lg animate-pulse" />
                  <div className="h-3.5 w-32 bg-slate-100 rounded-lg animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {classroom?.className ?? classCode}
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {classroom?.teacherName ?? ''}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Class code badge + refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border bg-white text-sm font-mono font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              {codeCopied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {classCode}
            </button>
            <button
              onClick={() => fetchStudents(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm"
              title="Làm mới"
            >
              <RefreshCw className={`h-4 w-4 ${loadingStudents ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">
          {/* Stats row */}
          {!loadingClass && classroom && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Sĩ số hiện tại"
                value={`${classroom.studentCount ?? 0}`}
                sub={`/ ${classroom.maxStudents ?? '∞'} học sinh`}
                color="from-indigo-500 to-purple-600"
                icon={<Users className="h-5 w-5 text-white" />}
              />
              <StatCard
                label="Trạng thái"
                value={isFull ? 'Đầy lớp' : 'Còn chỗ'}
                sub={
                  isFull
                    ? 'Không thể nhận thêm'
                    : `Còn ${(classroom.maxStudents ?? 0) - (classroom.studentCount ?? 0)} chỗ trống`
                }
                color={isFull ? 'from-rose-500 to-pink-600' : 'from-emerald-400 to-teal-600'}
                icon={
                  isFull ? (
                    <UserX className="h-5 w-5 text-white" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-white" />
                  )
                }
              />
              <div className="sm:col-span-2 rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Mô tả lớp học</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">
                    {classroom.description || 'Chưa có mô tả'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Two-column layout: Add student | Student list */}
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* ---- Add Student Panel ---- */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <UserPlus className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Thêm học sinh</h2>
                    <p className="text-xs text-muted-foreground">Nhập email để thêm vào lớp</p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleAddStudent} className="p-5 space-y-4">
                  {/* Success message */}
                  {addSuccess && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 animate-in slide-in-from-top-2">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700 font-medium">{addSuccess}</p>
                    </div>
                  )}
                  {/* Error message */}
                  {addError && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 animate-in slide-in-from-top-2">
                      <AlertCircle className="h-4.5 w-4.5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive font-medium">{addError}</p>
                    </div>
                  )}

                  {/* Email input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                      Email học sinh
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        id="add-student-email"
                        type="email"
                        value={addEmail}
                        onChange={(e) => {
                          setAddEmail(e.target.value)
                          if (addError) setAddError(null)
                          if (addSuccess) setAddSuccess(null)
                        }}
                        placeholder="vd: hocsinh@gmail.com"
                        disabled={addingStudent || isFull}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-slate-50/50 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground/60 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-add-student"
                    type="submit"
                    disabled={addingStudent || !addEmail.trim() || isFull}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/15 hover:shadow-primary/25 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {addingStudent ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang thêm...
                      </>
                    ) : isFull ? (
                      <>
                        <UserX className="h-4 w-4" />
                        Lớp đã đầy
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Thêm học sinh
                      </>
                    )}
                  </button>

                  {isFull && (
                    <p className="text-center text-xs text-muted-foreground">
                      Lớp đã đạt sĩ số tối đa. Không thể thêm học sinh mới.
                    </p>
                  )}
                </form>
              </div>

              {/* Quick tips */}
              <div className="rounded-2xl border border-border bg-white shadow-sm p-4 space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  💡 Lưu ý
                </h3>
                <ul className="space-y-1.5">
                  {[
                    'Email phải đã được đăng ký trong hệ thống',
                    'Học sinh sẽ được thông báo khi được thêm vào lớp',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ---- Student List Panel ---- */}
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
              {/* Panel header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-slate-50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <Users className="h-4.5 w-4.5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Danh sách học sinh</h2>
                    <p className="text-xs text-muted-foreground">
                      {loadingStudents ? 'Đang tải...' : `${filteredStudents.length} học sinh`}
                    </p>
                  </div>
                </div>

                {/* Search within list */}
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm trong danh sách..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-slate-50/80 text-xs outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              {/* List body */}
              <div className="flex-1 overflow-y-auto">
                {loadingStudents ? (
                  // Skeleton
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 bg-slate-200 rounded-lg w-2/5" />
                          <div className="h-3 bg-slate-100 rounded-lg w-3/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredStudents.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <UserX className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {searchQuery ? 'Không tìm thấy học sinh' : 'Chưa có học sinh nào'}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        {searchQuery
                          ? 'Thử thay đổi từ khoá tìm kiếm.'
                          : 'Thêm học sinh vào lớp bằng email bên trái.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Student rows
                  <div className="p-4 space-y-2">
                    {filteredStudents.map((student, idx) => (
                      <StudentRow
                        key={student.id}
                        student={student}
                        index={idx + 1}
                        isRemoving={removingId === student.id}
                        onRemove={() => handleRemoveStudent(student.id, student.fullName)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Sub-components ----

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string
  value: string
  sub: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-white shadow-sm overflow-hidden p-4 flex flex-col gap-3">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-extrabold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{sub}</p>
      </div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">{label}</p>
    </div>
  )
}

function StudentRow({
  student,
  index,
  isRemoving,
  onRemove,
}: {
  student: Student
  index: number
  isRemoving: boolean
  onRemove: () => void
}) {
  // Generate consistent avatar color based on id
  const colors = [
    'from-indigo-400 to-purple-500',
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-violet-400 to-fuchsia-500',
  ]
  const color = colors[student.id % colors.length]
  const initials = student.fullName
    ? student.fullName
      .split(' ')
      .slice(-2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : '?'

  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-100 transition-all duration-200">
      {/* Index */}
      <span className="text-xs text-muted-foreground/60 font-mono w-5 text-right flex-shrink-0">
        {index}
      </span>

      {/* Avatar */}
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white text-xs font-bold shadow-sm`}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{student.fullName}</p>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Mail className="h-3 w-3 flex-shrink-0" />
          {student.email}
        </p>
      </div>

      {/* Joined at */}
      {student.joinedAt && (
        <span className="hidden sm:block text-[11px] text-muted-foreground/70 flex-shrink-0">
          {new Date(student.joinedAt).toLocaleDateString('vi-VN')}
        </span>
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={isRemoving}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 disabled:opacity-50"
        title="Xóa học sinh khỏi lớp"
      >
        {isRemoving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
