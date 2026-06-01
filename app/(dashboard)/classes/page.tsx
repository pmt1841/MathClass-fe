'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Plus,
  RefreshCw,
  ArrowUpDown,
  GraduationCap,
  Users,
  ExternalLink,
  BookMarked
} from 'lucide-react'
import api from '@/lib/axios'
import { CreateClassModal } from '@/components/dashboard/create-class-modal'
import { toast } from 'sonner'

interface Classroom {
  id: number
  classCode: string
  className: string
  teacherId: number
  teacherName: string
  studentCount: number
  maxStudents: number
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'code-asc'>('name-asc')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string>('STUDENT')

  // Gradient themes for cards to look premium and stunning
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-fuchsia-600',
    'from-emerald-400 to-teal-600',
    'from-rose-500 to-pink-600',
  ]

  const fetchClasses = async (showToast = false) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/classrooms/my-classroom')
      // Make sure the data is an array
      if (Array.isArray(response.data)) {
        setClasses(response.data)
      } else {
        setClasses([])
      }
      if (showToast) {
        toast.success('Đã cập nhật danh sách lớp học')
      }
    } catch (err: any) {
      console.error('Error fetching classrooms:', err)
      setError('Không thể tải danh sách lớp học. Vui lòng kiểm tra kết nối.')
      toast.error('Lỗi khi tải danh sách lớp học')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
    
    // Get user role from storage
    const stored = sessionStorage.getItem('user_info') || localStorage.getItem('user_info')
    if (stored) {
      try {
        const info = JSON.parse(stored)
        setUserRole(info.role || info.userRole || 'STUDENT')
      } catch {}
    }
  }, [])

  const handleCopyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success(`Đã sao chép mã lớp: ${code}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter and sort logic
  const filteredClasses = classes
    .filter(
      (c) =>
        c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.classCode.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.className.localeCompare(b.className, 'vi')
      }
      if (sortBy === 'name-desc') {
        return b.className.localeCompare(a.className, 'vi')
      }
      return a.classCode.localeCompare(b.classCode)
    })

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* Header Bar */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookMarked className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Lớp học của tôi</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Xem và quản lý toàn bộ danh sách lớp học toán bạn đang giảng dạy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchClasses(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm"
              title="Làm mới"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {userRole === 'TEACHER' && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98"
              >
                <Plus className="h-4.5 w-4.5" />
                Tạo lớp học mới
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-border shadow-sm">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên lớp, mã lớp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-slate-50/50 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground/70"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 min-w-[180px]">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-11 px-3 py-2 rounded-xl border border-border bg-slate-50/50 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              >
                <option value="name-asc">Tên lớp: A - Z</option>
                <option value="name-desc">Tên lớp: Z - A</option>
                <option value="code-asc">Mã lớp tăng dần</option>
              </select>
            </div>
          </div>

          {/* Cards Grid / States */}
          {loading ? (
            // Skeleton Loading State
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[210px] rounded-2xl border border-border bg-white p-6 flex flex-col justify-between shadow-sm animate-pulse"
                >
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-200 rounded-lg w-2/3" />
                    <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-slate-100 rounded-lg w-1/3" />
                    <div className="h-10 bg-slate-200 rounded-xl w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-border rounded-2xl text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Không thể tải lớp học</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
              </div>
              <button
                onClick={() => fetchClasses(true)}
                className="h-10 px-5 rounded-xl border border-border hover:bg-slate-50 text-sm font-semibold transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : filteredClasses.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-border rounded-2xl text-center space-y-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary relative">
                <GraduationCap className="h-9 w-9" />
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                  +
                </span>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-foreground">
                  {searchQuery ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có lớp học nào'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Thử thay đổi từ khóa tìm kiếm của bạn hoặc kiểm tra chính xác mã lớp.'
                    : 'Bắt đầu hành trình giảng dạy của bạn bằng việc tạo một lớp học toán đầu tiên.'}
                </p>
              </div>
              {!searchQuery && userRole === 'TEACHER' && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center gap-2 h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Tạo lớp đầu tiên
                </button>
              )}
            </div>
          ) : (
            // Premium Cards Layout Grid
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((item, idx) => {
                const gradient = gradients[idx % gradients.length]
                const isCopied = copiedId === item.id

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Gradient accent top line */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`} />

                    {/* Content */}
                    <div className="space-y-4">
                      {/* Name & Badge */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-foreground text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                            {item.className}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Đang hoạt động
                        </p>
                      </div>

                      {/* Class code info badge */}
                      <div className="flex items-center justify-between gap-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-100 p-2.5 rounded-xl transition-all">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none">
                            Mã lớp học
                          </span>
                          <p className="font-mono text-sm font-bold text-slate-800 leading-tight">
                            {item.classCode}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyCode(item.classCode, item.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${isCopied
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-white border-slate-200 text-muted-foreground hover:text-slate-800 hover:border-slate-300 active:scale-95'
                            }`}
                          title="Sao chép mã lớp"
                        >
                          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                      {/* Student count */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-xs font-medium">Sĩ số:</span>
                          <span className="text-xs font-bold text-foreground">
                            {item.studentCount ?? 0}
                            <span className="text-muted-foreground font-normal">/{item.maxStudents ?? '—'}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(item.studentCount ?? 0) >= (item.maxStudents ?? Infinity)
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-emerald-50 text-emerald-600'
                              }`}
                          >
                            {(item.studentCount ?? 0) >= (item.maxStudents ?? Infinity) ? 'Đầy lớp' : 'Còn chỗ'}
                          </span>
                        </div>
                      </div>

                      {/* Teacher & action */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          <span className="text-xs font-medium">{item.teacherName}</span>
                        </div>

                        <a
                          href={`/classes/${item.classCode}`}
                          className="flex items-center gap-1 rounded-xl bg-slate-100/80 hover:bg-primary hover:text-primary-foreground px-3.5 py-2 text-xs font-bold text-foreground transition-all duration-200 group/btn"
                        >
                          Vào lớp
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          fetchClasses(false)
          setCreateModalOpen(false)
        }}
      />
    </div>
  )
}

