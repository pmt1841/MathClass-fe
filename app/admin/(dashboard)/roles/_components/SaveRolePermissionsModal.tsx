'use client'

import { useState } from 'react'
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
import { Save } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

interface SaveRolePermissionsModalProps {
  roleName: string
  disabled?: boolean
  isPending?: boolean
  onSave: () => void
}

export function SaveRolePermissionsModal({
  roleName,
  disabled = false,
  isPending = false,
  onSave,
}: SaveRolePermissionsModalProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onSave()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled || isPending}>
          {isPending ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t('Lưu cài đặt')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Xác nhận lưu cài đặt phân quyền?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Bạn có chắc chắn muốn cập nhật danh sách quyền cho nhóm người dùng')} <span className="font-semibold text-foreground">{roleName}</span>? {t('Các thay đổi sẽ có hiệu lực ngay lập tức.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('Hủy bỏ')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> {t('Đang lưu...')}
              </>
            ) : (
              t('Xác nhận lưu')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

