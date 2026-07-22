'use client'

import { useState, useEffect } from 'react'
import { useAllPermissions, useRolePermissions, useUpdateRolePermissions } from '@/hooks/useAdmin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { Save } from 'lucide-react'

const ROLES = [
  { id: 'TEACHER', name: 'Giáo viên' },
  { id: 'STUDENT', name: 'Học sinh' },
]

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState('TEACHER')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])
  
  const { data: allPermissions, isLoading: isLoadingAll } = useAllPermissions()
  const { data: rolePermissions, isLoading: isLoadingRole, isFetching } = useRolePermissions(selectedRole)
  const updatePermissions = useUpdateRolePermissions()

  // Đồng bộ state cục bộ khi dữ liệu từ API thay đổi
  useEffect(() => {
    if (rolePermissions) {
      setSelectedPermissionIds(rolePermissions.map(p => p.id))
    }
  }, [rolePermissions])

  const handleToggle = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissionIds(prev => [...prev, permissionId])
    } else {
      setSelectedPermissionIds(prev => prev.filter(id => id !== permissionId))
    }
  }

  const handleSave = () => {
    updatePermissions.mutate(
      { role: selectedRole, permissionIds: selectedPermissionIds },
      {
        onSuccess: () => {
          toast.success(`Cập nhật quyền cho nhóm ${selectedRole} thành công!`)
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi lưu quyền, vui lòng thử lại sau.')
        }
      }
    )
  }

  const hasChanges = () => {
    if (!rolePermissions) return false
    const originalIds = rolePermissions.map(p => p.id).sort()
    const currentIds = [...selectedPermissionIds].sort()
    
    if (originalIds.length !== currentIds.length) return true
    for (let i = 0; i < originalIds.length; i++) {
      if (originalIds[i] !== currentIds[i]) return true
    }
    return false
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Phân quyền Động</h2>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges() || updatePermissions.isPending}
        >
          {updatePermissions.isPending ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Lưu cài đặt
        </Button>
      </div>

      <Tabs defaultValue="TEACHER" onValueChange={setSelectedRole} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          {ROLES.map(role => (
            <TabsTrigger key={role.id} value={role.id}>
              {role.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {ROLES.map(role => (
          <TabsContent key={role.id} value={role.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quyền của {role.name}</CardTitle>
                <CardDescription>
                  Bật/tắt các quyền bên dưới để cấu hình giới hạn tính năng cho nhóm người dùng này.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingAll || isFetching ? (
                  <div className="flex items-center justify-center py-10">
                    <Spinner />
                  </div>
                ) : allPermissions && allPermissions.length > 0 ? (
                  Object.entries(
                    allPermissions
                      .filter(
                        (p) =>
                          !['dashboard:teacher_view', 'dashboard:student_view', 'user:manage'].includes(
                            p.name
                          )
                      )
                      .reduce((acc, p) => {
                        const prefix = p.name.split(':')[0]
                        const groupName =
                          prefix === 'classroom' ? 'Lớp học' :
                          prefix === 'assignment' ? 'Bài tập' :
                          prefix === 'submission' ? 'Bài nộp' : 'Khác'
                        if (!acc[groupName]) acc[groupName] = []
                        acc[groupName].push(p)
                        return acc
                      }, {} as Record<string, typeof allPermissions>)
                  ).map(([group, perms]) => (
                    <div key={group} className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
                        {group}
                      </h4>
                      <div className="space-y-4 pl-2">
                        {perms.map((permission) => (
                          <div key={permission.id} className="flex items-center justify-between space-x-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">{permission.description}</p>
                              <p className="text-sm text-muted-foreground">
                                Mã quyền: <code className="bg-muted px-1 py-0.5 rounded text-xs">{permission.name}</code>
                              </p>
                            </div>
                            <Switch
                              checked={selectedPermissionIds.includes(permission.id)}
                              onCheckedChange={(checked) => handleToggle(permission.id, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Không có quyền nào được định nghĩa trong hệ thống.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
