'use client'

import { useState } from 'react'
import { useAdminUsers, useUpdateUserStatus } from '@/hooks/useAdmin'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminUsersPage() {
  const [page, setPage] = useState(0)
  const [role, setRole] = useState<string>('ALL')
  const [isActive, setIsActive] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useAdminUsers(
    page,
    role === 'ALL' ? undefined : role,
    isActive === 'ALL' ? undefined : isActive === 'TRUE',
    search
  )

  const updateUserStatus = useUpdateUserStatus()

  const handleStatusChange = (userId: number, currentStatus: boolean) => {
    updateUserStatus.mutate(
      { userId, isActive: !currentStatus },
      {
        onSuccess: () => {
          toast.success(`Đã ${!currentStatus ? 'mở khóa' : 'khóa'} tài khoản thành công!`)
        },
        onError: () => {
          toast.error('Có lỗi xảy ra, vui lòng thử lại sau.')
        },
      }
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h2>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Tìm kiếm theo email hoặc tên..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="w-[300px]"
        />
        <Select
          value={role}
          onValueChange={(val) => {
            setRole(val)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả vai trò</SelectItem>
            <SelectItem value="TEACHER">Giáo viên</SelectItem>
            <SelectItem value="STUDENT">Học sinh</SelectItem>
            <SelectItem value="ADMIN">Quản trị viên</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={isActive}
          onValueChange={(val) => {
            setIsActive(val)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="TRUE">Đang hoạt động</SelectItem>
            <SelectItem value="FALSE">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.content && data.content.length > 0 ? (
              data.content.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'TEACHER' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.isActive}
                        disabled={updateUserStatus.isPending || user.role === 'ADMIN'}
                        onCheckedChange={() => handleStatusChange(user.id!, user.isActive!)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {user.isActive ? 'Khóa' : 'Mở khóa'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trang trước
          </Button>
          <div className="text-sm text-muted-foreground">
            Trang {page + 1} / {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
            disabled={page >= data.totalPages - 1}
          >
            Trang sau
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
