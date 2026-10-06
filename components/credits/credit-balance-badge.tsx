'use client'

import Link from 'next/link'
import { Coins } from 'lucide-react'
import { useMyCreditBalance } from '@/hooks/useCredits'

/**
 * Badge số dư credit AI trên thanh header.
 * Click → trang /credits (mua thêm / xem lịch sử).
 */
export function CreditBalanceBadge() {
  const { data, isLoading } = useMyCreditBalance()
  const balance = data?.balance

  return (
    <Link
      href="/credits"
      title="Xem Ví Credit AI — bấm để mua thêm"
      data-testid="credit-balance-badge"
      className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/25 transition-colors"
    >
      <Coins className="h-4 w-4 text-amber-300" />
      <span data-testid="credit-balance-value">
        {isLoading || balance === undefined ? '...' : balance}
      </span>
      <span className="hidden md:inline text-primary-foreground/80 font-medium">credit</span>
    </Link>
  )
}
