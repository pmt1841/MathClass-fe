'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useFormik } from 'formik'
import * as yup from 'yup'
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
  Edit,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import api from '@/lib/axios'
import { toast } from 'sonner'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  description: string
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

  // Pagination & Sorting state
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sortAsc, setSortAsc] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Edit classroom state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Add student state
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  // Remove student state
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [studentToRemove, setStudentToRemove] = useState<{ id: number, name: string } | null>(null)

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
      const sortParam = `s.fullName,${sortAsc ? 'asc' : 'desc'}`
      const res = await api.get(`/classrooms/${classCode}/students`, {
        params: { page, size, sort: sortParam }
      })
      if (res.data && res.data.content) {
        setStudents(res.data.content)
        setTotalPages(res.data.totalPages)
        setTotalElements(res.data.totalElements)
      } else {
        setStudents(Array.isArray(res.data) ? res.data : [])
      }
      if (showToast) toast.success('Đã cập nhật danh sách học sinh')
    } catch (err: any) {
      toast.error('Không thể tải danh sách học sinh')
      console.error(err)
    } finally {
      setLoadingStudents(false)
    }
  }, [classCode, page, size, sortAsc])

  useEffect(() => {
    fetchClassroom()
  }, [fetchClassroom])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents, page, size, sortAsc])

  const addStudentForm = useFormik({
    initialValues: { email: '' },
    validationSchema: yup.object({
      email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email')
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setAddError(null)
      setAddSuccess(null)

      try {
        await api.post(`/classrooms/${classCode}/students/add`, { "studentEmail": values.email })
        setAddSuccess(`Đã thêm học sinh với email: ${values.email}`)
        resetForm()
        // Refresh both students list and classroom info (studentCount)
        await Promise.all([fetchStudents(), fetchClassroom()])
        toast.success(`Thêm thành công: ${values.email}`)
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          'Không thể thêm học sinh. Vui lòng kiểm tra email.'
        setAddError(typeof msg === 'string' ? msg : 'Đã xảy ra lỗi. Vui lòng thử lại.')
        toast.error('Thêm học sinh thất bại')
      } finally {
        setSubmitting(false)
      }
    }
  })

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return
    const { id: studentId, name: studentName } = studentToRemove

    setStudentToRemove(null)
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

  const handleRemoveStudent = (studentId: number, studentName: string) => {
    setStudentToRemove({ id: studentId, name: studentName })
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode)
    setCodeCopied(true)
    toast.success(`Đã sao chép mã lớp: ${classCode}`)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const editClassroomForm = useFormik({
    initialValues: {
      className: classroom?.className || '',
      maxStudents: classroom?.maxStudents || 0,
      description: classroom?.description || ''
    },
    enableReinitialize: true,
    validationSchema: yup.object({
      className: yup.string().required('Vui lòng nhập tên lớp'),
      maxStudents: yup.number()
        .required('Vui lòng nhập sĩ số tối đa')
        .min(classroom?.studentCount || 0, `Sĩ số tối đa không được nhỏ hơn sĩ số hiện tại (${classroom?.studentCount || 0})`),
      description: yup.string().nullable()
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.put(`/classrooms/${classCode}`, {
          className: values.className,
          description: values.description,
          maxStudents: values.maxStudents,
        })
        toast.success('Đã cập nhật thông tin lớp học')
        setIsEditModalOpen(false)
        fetchClassroom()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Không thể cập nhật lớp học')
      } finally {
        setSubmitting(false)
      }
    }
  })

  const openEditModal = () => {
    if (classroom) {
      editClassroomForm.resetForm()
      setIsEditModalOpen(true)
    }
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
    <div>
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
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold tracking-tight text-foreground">
                        {classroom?.className ?? classCode}
                      </h1>
                      <button
                        onClick={openEditModal}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {classroom?.teacherName ?? ''}
                      </span>
                      <span className="hidden sm:inline text-border">•</span>
                      <span className="flex items-center gap-1.5 text-slate-500 line-clamp-1 max-w-md">
                        <Mail className="h-3.5 w-3.5" />
                        {classroom?.description || 'Chưa có mô tả'} 
                      </span>
                    </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StatCard
                  label="Sĩ số hiện tại"
                  value={`${classroom.studentCount ?? 0}`}
                  sub={`/ ${classroom.maxStudents ?? '∞'} học sinh`}
                  color="from-indigo-500 to-purple-600"
                  icon={<Users className="h-5 w-5 text-white" />}
                />

                {/* Add Student Quick Form (Moved from side panel) */}
                <div className="rounded-2xl border border-border bg-white shadow-sm flex items-center gap-4 p-4 overflow-hidden relative">
                  <div className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b ${isFull ? 'from-rose-500 to-pink-600' : 'from-emerald-400 to-teal-500'}`} />
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <UserPlus className="h-5 w-5 text-slate-500" />
                  </div>
                  <form onSubmit={addStudentForm.handleSubmit} className="flex-1 flex flex-col gap-1">
                    <div className="flex gap-2 w-full">
                      <div className="relative flex-1">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={addStudentForm.values.email}
                          onChange={(e) => {
                            addStudentForm.handleChange(e)
                            if (addError) setAddError(null)
                            if (addSuccess) setAddSuccess(null)
                          }}
                          onBlur={addStudentForm.handleBlur}
                          placeholder={isFull ? "Lớp đã đầy" : "Email học sinh..."}
                          disabled={addStudentForm.isSubmitting || isFull}
                          className={`w-full h-10 px-3 rounded-lg border ${addStudentForm.touched.email && addStudentForm.errors.email ? 'border-destructive' : 'border-border'} bg-slate-50/50 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                      </div>
                      <button
                        id="submit-add-student"
                        type="submit"
                        disabled={addStudentForm.isSubmitting || !addStudentForm.values.email.trim() || isFull}
                        className="flex-shrink-0 flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addStudentForm.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Thêm'}
                      </button>
                    </div>
                    {addStudentForm.touched.email && addStudentForm.errors.email && (
                      <p className="text-xs text-destructive mt-1 px-1">{addStudentForm.errors.email as string}</p>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Messages for Add Student */}
            {(addSuccess || addError) && (
              <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 animate-in slide-in-from-top-2 ${addSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-destructive/10 border-destructive/20'}`}>
                {addSuccess ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4.5 w-4.5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-xs font-medium ${addSuccess ? 'text-emerald-700' : 'text-destructive'}`}>
                  {addSuccess || addError}
                </p>
              </div>
            )}

            {/* Full width student list */}
            <div className="grid gap-6 grid-cols-1">
              {/* Panel header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-slate-50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <Users className="h-4.5 w-4.5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Danh sách học sinh</h2>
                    <p className="text-xs text-muted-foreground">
                      {loadingStudents ? 'Đang tải...' : `${totalElements} học sinh`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSortAsc(!sortAsc)
                      setPage(0)
                    }}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Sắp xếp theo tên"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    {sortAsc ? 'A-Z' : 'Z-A'}
                  </button>

                  <select
                    value={size}
                    onChange={(e) => {
                      setSize(Number(e.target.value))
                      setPage(0)
                    }}
                    className="h-9 px-2 rounded-lg border border-border bg-white text-xs text-slate-600 outline-none hover:bg-slate-50 transition-colors"
                  >
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={15}>15 / trang</option>
                    <option value={20}>20 / trang</option>
                  </select>

                  <div className="relative w-48 hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Tìm trong danh sách..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-slate-50/80 text-xs outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
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
                        index={page * size + idx + 1}
                        isRemoving={removingId === student.id}
                        onRemove={() => handleRemoveStudent(student.id, student.fullName)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              {!loadingStudents && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-slate-50">
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Đang hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === i ? 'bg-primary text-white' : 'border border-border bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={page === totalPages - 1}
                      onClick={() => setPage(page + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa học sinh</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa học sinh "{studentToRemove?.name}" khỏi lớp không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-black border border-slate-200 hover:bg-slate-300 hover:text-black transition-colors">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveStudent}
              className="bg-white text-destructive border border-destructive hover:bg-destructive hover:text-white transition-colors"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin lớp học</DialogTitle>
            <DialogDescription>
              Thay đổi tên lớp, sĩ số tối đa và mô tả của lớp học này.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editClassroomForm.handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tên lớp</label>
              <input
                id="className"
                name="className"
                value={editClassroomForm.values.className}
                onChange={editClassroomForm.handleChange}
                onBlur={editClassroomForm.handleBlur}
                className={`w-full h-10 px-3 rounded-lg border ${editClassroomForm.touched.className && editClassroomForm.errors.className ? 'border-destructive' : 'border-border'} bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                placeholder="Nhập tên lớp..."
              />
              {editClassroomForm.touched.className && editClassroomForm.errors.className && (
                <p className="text-xs text-destructive">{editClassroomForm.errors.className as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Sĩ số tối đa <span className="text-xs font-normal text-muted-foreground">(Hiện tại: {classroom?.studentCount || 0})</span>
              </label>
              <input
                type="number"
                id="maxStudents"
                name="maxStudents"
                value={editClassroomForm.values.maxStudents}
                onChange={editClassroomForm.handleChange}
                onBlur={editClassroomForm.handleBlur}
                className={`w-full h-10 px-3 rounded-lg border ${editClassroomForm.touched.maxStudents && editClassroomForm.errors.maxStudents ? 'border-destructive' : 'border-border'} bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
              />
              {editClassroomForm.touched.maxStudents && editClassroomForm.errors.maxStudents && (
                <p className="text-xs text-destructive">{editClassroomForm.errors.maxStudents as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Mô tả lớp học</label>
              <textarea
                id="description"
                name="description"
                value={editClassroomForm.values.description}
                onChange={editClassroomForm.handleChange}
                onBlur={editClassroomForm.handleBlur}
                className="w-full h-24 p-3 rounded-lg border border-border bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                placeholder="Nhập mô tả lớp học..."
              />
            </div>
            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={editClassroomForm.isSubmitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {editClassroomForm.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div >
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
