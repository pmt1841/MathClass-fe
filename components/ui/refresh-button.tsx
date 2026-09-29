'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { RefreshCw } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

export interface RefreshButtonProps
  extends Omit<React.ComponentProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  /**
   * Trạng thái đang tải dữ liệu (sẽ tự xoay icon và disable nút).
   */
  isLoading?: boolean
  /**
   * Nhãn văn bản hiển thị. Mặc định dùng i18n t('common.refresh').
   */
  label?: string
  /**
   * Nhãn văn bản khi đang tải. Mặc định dùng i18n t('common.loading').
   */
  loadingLabel?: string
  /**
   * Chế độ chỉ hiển thị Icon (hình vuông gọn gàng).
   */
  iconOnly?: boolean
  /**
   * Có hiển thị nhãn chữ trên thiết bị di động hay không (mặc định: false).
   */
  showLabelOnMobile?: boolean
  /**
   * ClassName tùy chỉnh cho icon.
   */
  iconClassName?: string
}

export const RefreshButton = React.forwardRef<HTMLButtonElement, RefreshButtonProps>(
  (
    {
      isLoading = false,
      label,
      loadingLabel,
      iconOnly = false,
      showLabelOnMobile = false,
      onClick,
      disabled,
      className,
      size,
      variant = 'outline',
      title,
      iconClassName,
      ...props
    },
    ref
  ) => {
    const { t } = useI18n()

    const actualLabel = label ?? t('common.refresh')
    const actualTitle = title ?? t('common.refresh')

    const [isInternalLoading, setIsInternalLoading] = React.useState(false)
    const activeLoading = isLoading || isInternalLoading

    const computedSize = size ?? (iconOnly ? 'icon' : 'sm')
    const displayLabel = activeLoading
      ? (loadingLabel ?? t('common.loading'))
      : actualLabel

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || activeLoading) return

      try {
        const result = onClick(e) as unknown
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          setIsInternalLoading(true)
          const startTime = Date.now()
          await (result as Promise<unknown>)
          
          const elapsed = Date.now() - startTime
          if (elapsed < 450) {
            await new Promise((resolve) => setTimeout(resolve, 450 - elapsed))
          }
        }
      } catch (err) {
        console.error('Error refreshing data:', err)
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
        title={actualTitle}
        aria-label={actualTitle}
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

