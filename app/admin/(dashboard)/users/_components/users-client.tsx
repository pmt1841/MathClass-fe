'use client'

import { useEffect, useState } from 'react'
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
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminUser } from '@/types'
import { StatusSwitch } from './status-switch'
import { LockUserModal } from './LockUserModal'
import { UnlockUserModal } from './UnlockUserModal'

// ── Role Badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: AdminUser['role'] }) {
  const styles: Record<AdminUser['role'], string> = {
    ADMIN: 'bg-red-600 text-white hover:bg-red-700',
    TEACHER: 'bg-blue-600 text-white hover:bg-blue-700',
    STUDENT: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  }
  return (
    <Badge className={cn('rounded-full font-medium', styles[role])}>
      {role}
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

  const { data, isLoading } = useAdminUsers(
    page,
    role === 'ALL' ? undefined : role,
    statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
    debouncedSearch || undefined,
    pageSize
  )

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
          toast.success('Đã khóa tài khoản thành công và đang gửi email thông báo!')
          setUserToLock(null)
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || 'Khóa tài khoản thất bại. Vui lòng thử lại!'
          toast.error(message)
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
          toast.success('Đã mở khóa tài khoản thành công và gửi email thông báo!')
          setUserToUnlock(null)
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || 'Không thể mở khóa tài khoản. Vui lòng thử lại!'
          toast.error(message)
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
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h2>
          {data && (
            <p className="mt-1 text-sm text-muted-foreground">
              Hiển thị{' '}
              <span className="font-medium text-foreground">{data.numberOfElements}</span>
              {' '}/ {' '}
              <span className="font-medium text-foreground">{data.totalElements}</span>
              {' '}người dùng
            </p>
          )}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="user-search-input"
            placeholder="Tìm kiếm theo email hoặc tên..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 w-[300px]"
          />
        </div>

        {/* Role Filter */}
        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger id="user-role-filter" className="w-[180px]">
            <SelectValue placeholder="Tất cả vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả vai trò</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="TEACHER">TEACHER</SelectItem>
            <SelectItem value="STUDENT">STUDENT</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger id="user-status-filter" className="w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="LOCKED">Bị khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-md border bg-white">
        {/* Table toolbar: page size selector */}
        <div className="flex items-center justify-end px-4 py-2 border-b bg-slate-50/60">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Hiển thị:</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger id="user-page-size-select" className="h-8 w-[80px] text-sm">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">STT</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-32">Vai trò</TableHead>
              <TableHead className="w-32">Trạng thái</TableHead>
              <TableHead className="w-36">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.content && data.content.length > 0 ? (
              data.content.map((user, index) => {
                const stt = page * (data.size || 10) + index + 1
                return (
                  <TableRow key={user.id}>
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
                <TableCell colSpan={6} className="h-36 text-center">
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
          >
            Trang sau
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

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


