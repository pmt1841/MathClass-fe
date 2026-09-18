'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminUsers, useUpdateUserStatus } from '@/hooks/useAdmin'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/hooks/useAuth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/ui/refresh-button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatRelativeLastLogin, formatDateTime } from '@/lib/utils'
import { AdminUser } from '@/types'
import { StatusSwitch } from './status-switch'
import { LockUserModal } from './LockUserModal'
import { UnlockUserModal } from './UnlockUserModal'

const ROLE_LABELS: Record<AdminUser['role'], string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
}

// ── Role Badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: AdminUser['role'] }) {
  const styles: Record<AdminUser['role'], string> = {
    ADMIN: 'bg-red-600 text-white hover:bg-red-700',
    TEACHER: 'bg-blue-600 text-white hover:bg-blue-700',
    STUDENT: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  }
  return (
    <Badge className={cn('rounded-full font-medium', styles[role])}>
      {ROLE_LABELS[role] || role}
    </Badge>
  )
}

// ── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={cn(
        'rounded-full font-medium',
        isActive
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-red-600 text-white hover:bg-red-700'
      )}
    >
      {isActive ? 'Hoạt động' : 'Bị khóa'}
    </Badge>
  )
}

// ── Main Client Component ───────────────────────────────────────────────────
export function UsersClient() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(0)
  const [role, setRole] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  // Track which userId is currently being toggled (for per-switch loading)
  const [pendingUserId, setPendingUserId] = useState<number | null>(null)

  // State quản lý Modal Khóa & Mở khóa tài khoản
  const [userToLock, setUserToLock] = useState<AdminUser | null>(null)
  const [userToUnlock, setUserToUnlock] = useState<AdminUser | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, refetch } = useAdminUsers(
    page,
    role === 'ALL' ? undefined : role,
    statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
    debouncedSearch || undefined,
    pageSize
  )

  // Realtime Presence: Lắng nghe sự kiện presence-change từ GlobalPresenceTracker (dùng chung kết nối WebSocket STOMP)
  useEffect(() => {
    const handlePresenceChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: number; isOnline: boolean; lastActiveAt?: string }>
      const payload = customEvent.detail
      if (payload && payload.userId) {
        queryClient.setQueriesData({ queryKey: ['admin-users'] }, (oldData: any) => {
          if (!oldData || !oldData.content) return oldData
          return {
            ...oldData,
            content: oldData.content.map((u: AdminUser) => {
              if (u.id === payload.userId) {
                return {
                  ...u,
                  isOnline: payload.isOnline,
                  online: payload.isOnline,
                  lastActiveAt: payload.lastActiveAt || u.lastActiveAt,
                }
              }
              return u
            }),
          }
        })
      }
    }

    window.addEventListener('presence-change', handlePresenceChange)
    return () => {
      window.removeEventListener('presence-change', handlePresenceChange)
    }
  }, [queryClient])

  const updateUserStatus = useUpdateUserStatus()

  const handleStatusToggle = (userId: number, currentIsActive: boolean) => {
    if (pendingUserId !== null) return // block if another request is in-flight

    const targetUser = data?.content.find((u) => u.id === userId)
    if (!targetUser) return

    if (currentIsActive) {
      // Nếu đang hoạt động -> Yêu cầu mở Modal nhập lý do khóa
      setUserToLock(targetUser)
    } else {
      // Nếu đang bị khóa -> Mở Modal mở khóa tài khoản
      setUserToUnlock(targetUser)
    }
  }

  const handleConfirmLock = (reason: string) => {
    if (!userToLock) return
    const userId = userToLock.id
    setPendingUserId(userId)
    updateUserStatus.mutate(
      { userId, isActive: false, reason },
      {
        onSuccess: () => {
          toast.success('Đã khóa tài khoản thành công')
          setUserToLock(null)
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Không thể khóa tài khoản')
        },
        onSettled: () => {
          setPendingUserId(null)
        },
      }
    )
  }

  const handleConfirmUnlock = (reason?: string) => {
    if (!userToUnlock) return
    const userId = userToUnlock.id
    setPendingUserId(userId)
    updateUserStatus.mutate(
      { userId, isActive: true, reason },
      {
        onSuccess: () => {
          toast.success('Đã mở khóa tài khoản thành công')
          setUserToUnlock(null)
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Không thể mở khóa tài khoản')
        },
        onSettled: () => {
          setPendingUserId(null)
        },
      }
    )
  }



  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleRoleChange = (value: string) => {
    setRole(value)
    setPage(0)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(0)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(0)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* ── Synchronized Header ── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Quản lý Người dùng
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {data ? (
                <>
                  Hiển thị{' '}
                  <span className="font-semibold text-foreground">{data.numberOfElements}</span>
                  {' '}/ {' '}
                  <span className="font-semibold text-foreground">{data.totalElements}</span>
                  {' '}người dùng.
                </>
              ) : (
                'Quản lý tài khoản người dùng trong hệ thống MathClass.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={() => refetch()}
            />
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 space-y-4 w-full">
          {/* ── Filter Bar & Page Size Selector ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            {/* Left Filters */}
            <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
              {/* Search */}
              <div className="relative min-w-[220px] max-w-md flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="user-search-input"
                  placeholder="Tìm kiếm theo email hoặc tên..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-10 w-full bg-white rounded-xl border-border"
                />
              </div>

              {/* Role Filter */}
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger id="user-role-filter" className="h-10 w-[150px] bg-white rounded-xl border-border text-xs font-semibold">
                  <SelectValue placeholder="Tất cả vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                  <SelectItem value="TEACHER">Giáo viên</SelectItem>
                  <SelectItem value="STUDENT">Học sinh</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger id="user-status-filter" className="h-10 w-[160px] bg-white rounded-xl border-border text-xs font-semibold">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="LOCKED">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium shrink-0 self-end sm:self-auto">
              <span>Hiển thị:</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger id="user-page-size-select" className="h-10 w-[75px] text-xs font-bold bg-white rounded-xl border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span>/ trang</span>
            </div>
          </div>

          {/* ── Data Table ── */}
          <div className="rounded-xl border border-border bg-white shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-32">Vai trò</TableHead>
                  <TableHead className="w-32">Trạng thái</TableHead>
                  <TableHead className="w-44">Hoạt động gần nhất</TableHead>
                  <TableHead className="w-36">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Spinner className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.content && data.content.length > 0 ? (
                  data.content.map((user, index) => {
                    const stt = page * (data.size || 10) + index + 1
                    const isSelf = !!currentUser && (currentUser.id === user.id || currentUser.email?.toLowerCase() === user.email?.toLowerCase())
                    const isUserActive = Boolean(user.isOnline || user.online || isSelf)
                    return (
                      <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="text-muted-foreground">{stt}</TableCell>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge isActive={user.active} />
                        </TableCell>
                        <TableCell>
                          {isUserActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              Đang hoạt động
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "text-sm",
                                user.lastActiveAt ? "text-muted-foreground" : "text-slate-400 italic"
                              )}
                              title={user.lastActiveAt ? formatDateTime(user.lastActiveAt) : undefined}
                            >
                              {formatRelativeLastLogin(user.lastActiveAt)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusSwitch
                            userId={user.id}
                            isActive={user.active}
                            isCurrentUser={user.id === currentUser?.id}
                            isPending={pendingUserId !== null}
                            onToggle={handleStatusToggle}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-36 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8 opacity-40" />
                        <p className="text-sm">Không tìm thấy người dùng phù hợp</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                id="pagination-prev-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-xl bg-white"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trang trước
              </Button>
              <div className="text-sm text-muted-foreground">
                Trang <span className="font-medium text-foreground">{page + 1}</span> / {data.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                id="pagination-next-btn"
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={page >= data.totalPages - 1}
                className="rounded-xl bg-white"
              >
                Trang sau
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* ── Lock User Modal ── */}
      <LockUserModal
        isOpen={!!userToLock}
        onClose={() => setUserToLock(null)}
        onConfirm={handleConfirmLock}
        userFullName={userToLock?.fullName}
        userEmail={userToLock?.email}
        isPending={pendingUserId !== null}
      />

      {/* ── Unlock User Modal ── */}
      <UnlockUserModal
        isOpen={!!userToUnlock}
        onClose={() => setUserToUnlock(null)}
        onConfirm={handleConfirmUnlock}
        userFullName={userToUnlock?.fullName}
        userEmail={userToUnlock?.email}
        isPending={pendingUserId !== null}
      />
    </div>
  )
}


