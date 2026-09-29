'use client'

import { useState } from 'react'
import { useResetRolePermissions } from '@/hooks/useAdmin'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

interface ResetRolePermissionsModalProps {
  roleId: string
  roleName: string
  disabled?: boolean
  onSuccess?: () => void
}

export function ResetRolePermissionsModal({
  roleId,
  roleName,
  disabled = false,
  onSuccess,
}: ResetRolePermissionsModalProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const resetPermissions = useResetRolePermissions()

  const handleReset = () => {
    resetPermissions.mutate(roleId, {
      onSuccess: () => {
        toast.success(t('Khôi phục quyền mặc định cho nhóm {name} thành công!', { name: roleName }))
        onSuccess?.()
        setOpen(false)
      },
      onError: () => {
        toast.error(t('Có lỗi xảy ra khi khôi phục quyền mặc định. Vui lòng thử lại sau.'))
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={disabled || resetPermissions.isPending}>
          {resetPermissions.isPending ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4 text-slate-500" />
          )}
          {t('Khôi phục mặc định')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Khôi phục phân quyền mặc định?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Hành động này sẽ đặt lại tất cả các quyền của nhóm {name} về trạng thái cấu hình chuẩn ban đầu của hệ thống. Bạn có chắc chắn muốn thực hiện?', { name: roleName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resetPermissions.isPending}>{t('Hủy bỏ')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleReset()
            }}
            disabled={resetPermissions.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            {resetPermissions.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> {t('Đang khôi phục...')}
              </>
            ) : (
              t('Xác nhận khôi phục')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
