'use client'

import { useState } from 'react'
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  ArrowUpDown,
  GraduationCap,
  Clock,
  BookMarked
} from 'lucide-react'
import { CreateClassModal } from '@/components/dashboard/create-class-modal'
import { JoinClassModal } from '@/components/dashboard/join-class-modal'
import { joinRequestService } from '@/services/joinRequestService'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useMyClassrooms } from '@/hooks/useClassrooms'
import { ClassCard } from './class-card'
import { formatDateTime } from '@/lib/utils'
import { PermissionGuard } from '@/components/ui/with-permission'

export function ClassesClient() {
  const { user } = useAuth()
  const userRole = user?.role || 'STUDENT'
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'code-asc'>('name-asc')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-fuchsia-600',
    'from-emerald-400 to-teal-600',
    'from-rose-500 to-pink-600',
  ]

  const { data: classes = [], isLoading: loading, isError, refetch } = useMyClassrooms()

  const { data: joinRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['my-join-requests'],
    queryFn: joinRequestService.getMyJoinRequests,
    enabled: !!user && user.role === 'STUDENT',
  })

  const pendingRequests = joinRequests?.filter(req => req.status === 'PENDING') || []

  const handleCopyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success(`Đã sao chép mã lớp: ${code}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRefresh = () => {
    refetch().then(() => toast.success('Đã cập nhật danh sách lớp học'))
  }

  const filteredClasses = classes
    .filter(
      (c) =>
        c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.classCode.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.className.localeCompare(b.className, 'vi')
      if (sortBy === 'name-desc') return b.className.localeCompare(a.className, 'vi')
      return a.classCode.localeCompare(b.classCode)
    })

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
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
              {userRole === 'TEACHER' 
                ? 'Xem và quản lý toàn bộ danh sách lớp học bạn đang giảng dạy.' 
                : 'Xem và truy cập toàn bộ danh sách lớp học bạn đang tham gia.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm"
              title="Làm mới"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {userRole === 'TEACHER' && (
              <PermissionGuard permission="classroom:create">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center gap-2 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Tạo lớp học mới
                </button>
              </PermissionGuard>
            )}
            {userRole === 'STUDENT' && (
              <PermissionGuard permission="classroom:join">
                <button
                  onClick={() => setJoinModalOpen(true)}
                  className="flex items-center gap-2 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Xin vào lớp
                </button>
              </PermissionGuard>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-border shadow-sm">
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

          {userRole === 'STUDENT' && pendingRequests.length > 0 && (
            <Card className="border-orange-200 shadow-sm dark:border-orange-900/50">
              <CardHeader className="bg-orange-50/50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30 py-3">
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-base">
                  <Clock className="h-5 w-5" /> Yêu cầu xin vào lớp đang chờ duyệt
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-base text-foreground">Lớp: {req.className} ({req.classCode})</p>
                        <p className="text-sm text-muted-foreground">Đã gửi lúc: {formatDateTime(req.requestedAt)}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                        Đang chờ giáo viên duyệt
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[210px] rounded-2xl border border-border bg-white p-6 flex flex-col justify-between shadow-sm animate-pulse">
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
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-border rounded-2xl text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Không thể tải lớp học</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Vui lòng kiểm tra kết nối mạng.</p>
              </div>
              <button onClick={() => refetch()} className="h-10 px-5 rounded-xl border border-border hover:bg-slate-50 text-sm font-semibold transition-colors">
                Thử lại
              </button>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-border rounded-2xl text-center space-y-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary relative">
                <GraduationCap className="h-9 w-9" />
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">+</span>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-foreground">
                  {searchQuery ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có lớp học nào'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Thử thay đổi từ khóa tìm kiếm của bạn hoặc kiểm tra chính xác mã lớp.'
                    : userRole === 'TEACHER'
                      ? 'Bắt đầu hành trình giảng dạy của bạn bằng việc tạo một lớp học đầu tiên.'
                      : 'Bắt đầu hành trình học tập của bạn bằng việc tham gia vào một lớp học.'}
                </p>
              </div>
              {!searchQuery && userRole === 'TEACHER' && (
                <PermissionGuard permission="classroom:create">
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center gap-2 h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    Tạo lớp đầu tiên
                  </button>
                </PermissionGuard>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((item, idx) => (
                <ClassCard 
                  key={item.id} 
                  item={item} 
                  gradient={gradients[idx % gradients.length]} 
                  userRole={userRole} 
                  isCopied={copiedId === item.id} 
                  onCopyCode={handleCopyCode} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateClassModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          refetch()
          setCreateModalOpen(false)
        }}
      />

      <JoinClassModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          setJoinModalOpen(false)
          if (userRole === 'STUDENT') refetchRequests()
        }}
      />
    </div>
  )
}
