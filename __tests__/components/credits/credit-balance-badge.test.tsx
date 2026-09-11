import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { CreditBalanceBadge } from '@/components/credits/credit-balance-badge'
import { useMyCreditBalance } from '@/hooks/useCredits'

vi.mock('@/hooks/useCredits', () => ({
  useMyCreditBalance: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

describe('CreditBalanceBadge component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hiển thị dấu "..." khi đang tải số dư credit', () => {
    vi.mocked(useMyCreditBalance).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    render(<CreditBalanceBadge />)

    const valueEl = screen.getByTestId('credit-balance-value')
    expect(valueEl.textContent).toBe('...')
    const linkEl = screen.getByTestId('credit-balance-badge')
    expect(linkEl).toHaveAttribute('href', '/credits')
  })

  it('hiển thị chính xác số dư credit khi đã nạp dữ liệu xong', () => {
    vi.mocked(useMyCreditBalance).mockReturnValue({
      data: {
        userId: 1,
        balance: 150,
        totalEarned: 200,
        totalSpent: 50,
        costs: [],
      },
      isLoading: false,
    } as any)

    render(<CreditBalanceBadge />)

    const valueEl = screen.getByTestId('credit-balance-value')
    expect(valueEl.textContent).toBe('150')
  })
})
