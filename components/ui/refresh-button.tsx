'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { RefreshCw } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface RefreshButtonProps
  extends Omit<React.ComponentProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  /**
   * Trạng thái đang tải dữ liệu (sẽ tự xoay icon và disable nút).
   */
  isLoading?: boolean
  /**
   * Nhãn văn bản hiển thị (mặc định: 'Làm mới').
   */
  label?: string
  /**
   * Nhãn văn bản khi đang tải (mặc định: 'Đang tải...').
   */
  loadingLabel?: string
  /**
   * Chế độ chỉ hiển thị Icon (hình vuông gọn gàng).
   */
  iconOnly?: boolean
  /**
   * Có hiển thị nhãn chữ trên thiết bị di động hay không (mặc định: false - trên mobile chỉ hiện icon để tiết kiệm diện tích).
   */
  showLabelOnMobile?: boolean
  /**
   * Kích thước của icon (class Tailwind, mặc định: 'h-4 w-4').
   */
  iconClassName?: string
}

export const RefreshButton = React.forwardRef<HTMLButtonElement, RefreshButtonProps>(
  (
    {
      isLoading = false,
      label = 'Làm mới',
      loadingLabel,
      iconOnly = false,
      showLabelOnMobile = false,
      onClick,
      disabled,
      className,
      size,
      variant = 'outline',
      title = 'Làm mới dữ liệu',
      iconClassName,
      ...props
    },
    ref
  ) => {
    const [isInternalLoading, setIsInternalLoading] = React.useState(false)
    const activeLoading = isLoading || isInternalLoading

    const computedSize = size ?? (iconOnly ? 'icon' : 'sm')
    const displayLabel = activeLoading && loadingLabel ? loadingLabel : label

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || activeLoading) return

      try {
        const result = onClick(e) as unknown
        // Nếu onClick là hàm async hoặc trả về Promise (như refetch())
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          setIsInternalLoading(true)
          const startTime = Date.now()
          await (result as Promise<unknown>)
          
          // Giữ icon xoay tối thiểu 450ms để người dùng cảm nhận được visual feedback
          const elapsed = Date.now() - startTime
          if (elapsed < 450) {
            await new Promise((resolve) => setTimeout(resolve, 450 - elapsed))
          }
        }
      } catch (err) {
        // Cho phép lỗi nổi lên nếu cần, nhưng vẫn tắt trạng thái xoay
        console.error('Lỗi khi làm mới dữ liệu:', err)
      } finally {
        setIsInternalLoading(false)
      }
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={computedSize}
        onClick={handleClick}
        disabled={disabled || activeLoading}
        title={title}
        aria-label={title}
        className={cn(
          'rounded-xl bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground transition-all shadow-xs border-border',
          !iconOnly && 'gap-1.5 sm:gap-2 text-xs font-semibold px-3 h-9 sm:h-10',
          iconOnly && 'h-9 w-9 sm:h-10 sm:w-10 p-0',
          className
        )}
        {...props}
      >
        <RefreshCw
          className={cn(
            'shrink-0',
            iconClassName || (iconOnly ? 'h-4.5 w-4.5' : 'h-4 w-4'),
            activeLoading && 'animate-spin text-primary'
          )}
        />
        {!iconOnly && (
          <span className={cn(!showLabelOnMobile && 'hidden sm:inline')}>
            {displayLabel}
          </span>
        )}
      </Button>
    )
  }
)

RefreshButton.displayName = 'RefreshButton'
