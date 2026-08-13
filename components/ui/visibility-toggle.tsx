'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { useUpdateVisibility } from '@/hooks/useLibrary'
import type { AssignmentVisibility } from '@/types'

interface VisibilityToggleProps {
  value: AssignmentVisibility
  assignmentId: number
  isSheet?: boolean
}

/**
 * Switch inline để chuyển trạng thái bài tập giữa PRIVATE và PUBLIC.
 * Dùng optimistic update: UI phản hồi ngay, rollback nếu API lỗi.
 *
 * Lưu ý: Bọc trong onClick stopPropagation khi dùng bên trong card có
 * sự kiện click toàn card để tránh navigate nhầm.
 */
export function VisibilityToggle({ value, assignmentId, isSheet = false }: VisibilityToggleProps) {
  const [optimistic, setOptimistic] = useState(value === 'PUBLIC')
  const { mutateAsync, isPending } = useUpdateVisibility()

  // Đồng bộ với props nếu data bị refetch từ bên ngoài
  useEffect(() => {
    setOptimistic(value === 'PUBLIC')
  }, [value])

  const handleToggle = async (checked: boolean) => {
    setOptimistic(checked)
    try {
      await mutateAsync({
        id: assignmentId,
        visibility: checked ? 'PUBLIC' : 'PRIVATE',
        isSheet,
      })
      toast.success(
        checked
          ? '✅ Bài tập đã được công khai lên Thư viện'
          : '🔒 Bài tập đã chuyển về trạng thái riêng tư'
      )
    } catch (error: any) {
      setOptimistic(!checked) // Rollback nếu API lỗi
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : undefined) ||
        'Cần gắn đủ Khối lớp, Phân môn và Độ khó trước khi đăng lên Thư viện cộng đồng.'
      toast.error(errorMessage)
    }
  }

  return (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan ra card
    >
      <Switch
        checked={optimistic}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="data-[state=checked]:bg-emerald-500 h-4 w-7"
        id={`visibility-toggle-${assignmentId}`}
      />
      <span
        className={`text-xs font-medium transition-colors ${
          optimistic ? 'text-emerald-600' : 'text-muted-foreground'
        }`}
      >
        {optimistic ? 'Công khai' : 'Riêng tư'}
      </span>
    </div>
  )
}
