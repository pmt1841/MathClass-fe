import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreditBalanceCard } from '@/components/credits/credit-balance-card'

vi.mock('@/hooks/useCredits', () => ({
  useMyCreditBalance: () => ({
    data: {
      userId: 1,
      balance: 97,
      totalEarned: 100,
      totalSpent: 3,
      costs: [
        { task: 'STUDENT_HINT', costPerCall: 1, tokensPerCredit: 1000 },
        { task: 'SUBMISSION_GRADING', costPerCall: 5, tokensPerCredit: 1000 },
      ],
    },
    isLoading: false,
  }),
}))

describe('CreditBalanceCard', () => {
  it('should render current balance, totals and cost list', () => {
    render(<CreditBalanceCard />)

    expect(screen.getByText('97')).toBeTruthy()
    expect(screen.getByText('100')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('Gợi ý tư duy làm bài')).toBeTruthy()
    expect(screen.getByText('Chấm bài tự động')).toBeTruthy()
    expect(screen.getAllByText('1 credit = 1000 token đầu ra')).toHaveLength(2)
    expect(screen.getByText('Ví Credit AI')).toBeTruthy()
  })
})
