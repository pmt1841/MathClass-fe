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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

import { ResetRolePermissionsModal } from './_components/ResetRolePermissionsModal'
import { SaveRolePermissionsModal } from './_components/SaveRolePermissionsModal'

const ROLES = [
  { id: 'TEACHER', name: 'Giáo viên' },
  { id: 'STUDENT', name: 'Học sinh' },
]

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState('TEACHER')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])
  
  const { data: allPermissions, isLoading: isLoadingAll } = useAllPermissions()
  const { data: rolePermissions, isLoading: isLoadingRole, isFetching, refetch } = useRolePermissions(selectedRole)
  const updatePermissions = useUpdateRolePermissions()

  // Đồng bộ state cục bộ khi dữ liệu từ API thay đổi
  useEffect(() => {
    if (rolePermissions) {
      setSelectedPermissionIds(rolePermissions.map(p => p.id))
    }
  }, [rolePermissions])

  const handleResetSuccess = async () => {
    const { data: updatedPermissions } = await refetch()
    if (updatedPermissions) {
      setSelectedPermissionIds(updatedPermissions.map(p => p.id))
    }
  }

  const handleToggle = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissionIds(prev => [...prev, permissionId])
    } else {
      setSelectedPermissionIds(prev => prev.filter(id => id !== permissionId))
    }
  }

  const handleToggleGroup = (groupPermissions: typeof allPermissions, selectAll: boolean) => {
    if (!groupPermissions) return
    const groupIds = groupPermissions.map(p => p.id)
    if (selectAll) {
      setSelectedPermissionIds(prev => Array.from(new Set([...prev, ...groupIds])))
    } else {
      setSelectedPermissionIds(prev => prev.filter(id => !groupIds.includes(id)))
    }
  }

  const currentRoleName = ROLES.find(r => r.id === selectedRole)?.name || selectedRole

  const handleSave = () => {
    updatePermissions.mutate(
      { role: selectedRole, permissionIds: selectedPermissionIds },
      {
        onSuccess: () => {
          toast.success(`Cập nhật quyền cho nhóm ${currentRoleName} thành công!`)
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
        <div className="flex items-center gap-2">
          <ResetRolePermissionsModal
            roleId={selectedRole}
            roleName={currentRoleName}
            disabled={isLoadingAll || isFetching}
            onSuccess={handleResetSuccess}
          />
          <SaveRolePermissionsModal
            roleName={currentRoleName}
            disabled={!hasChanges() || isLoadingAll || isFetching}
            isPending={updatePermissions.isPending}
            onSave={handleSave}
          />
        </div>
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
                  <Accordion type="multiple" className="w-full space-y-3">
                    {Object.entries(
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
                    ).map(([group, perms]) => {
                      const activeCount = perms.filter(p => selectedPermissionIds.includes(p.id)).length
                      const totalCount = perms.length
                      const isAllSelected = activeCount === totalCount && totalCount > 0

                      return (
                        <AccordionItem key={group} value={group} className="border rounded-lg border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                          <AccordionTrigger className="hover:no-underline py-3.5 px-4 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-base tracking-wide uppercase text-slate-800 dark:text-slate-200">{group}</span>
                              <Badge variant={activeCount > 0 ? "secondary" : "outline"} className="text-xs font-normal">
                                {activeCount}/{totalCount} quyền đã bật
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-0 pb-1 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                            <div className="flex items-center justify-between space-x-4 px-4 py-3 bg-slate-100/70 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 font-medium text-sm text-foreground">
                              <span>{isAllSelected ? 'Tắt tất cả nhóm này' : 'Bật tất cả nhóm này'}</span>
                              <Switch
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleToggleGroup(perms, checked)}
                              />
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {perms.map((permission) => (
                                <div key={permission.id} className="flex items-center justify-between space-x-4 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">{permission.description}</p>
                                  </div>
                                  <Switch
                                    checked={selectedPermissionIds.includes(permission.id)}
                                    onCheckedChange={(checked) => handleToggle(permission.id, checked)}
                                  />
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
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

