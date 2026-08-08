import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreditPackagesSection } from '@/components/credits/credit-packages-section'

const mutateAsync = vi.fn().mockResolvedValue({
  orderId: 501,
  gatewayCode: 'MOCK',
  status: 'SUCCESS',
  credits: 100,
  price: 20000,
  creditsAdded: 100,
  newBalance: 197,
})

vi.mock('@/hooks/useCredits', () => ({
  useCreditPackages: () => ({
    data: [
      { id: 1, name: 'Gói Cơ bản', credits: 100, price: 20000, enabled: true, sortOrder: 1 },
      { id: 2, name: 'Gói Pro', credits: 300, price: 50000, enabled: true, sortOrder: 2 },
    ],
    isLoading: false,
  }),
  usePurchaseCredit: () => ({ isPending: false, mutateAsync }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('CreditPackagesSection', () => {
  it('should list packages with formatted price', () => {
    render(<CreditPackagesSection />)

    expect(screen.getByText('Gói Cơ bản')).toBeTruthy()
    expect(screen.getByText('Gói Pro')).toBeTruthy()
    expect(screen.getAllByText('Mua ngay').length).toBe(2)
  })

  it('should call purchase mutation with selected package id', async () => {
    render(<CreditPackagesSection />)

    fireEvent.click(screen.getAllByText('Mua ngay')[0])

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(1))
  })
})
