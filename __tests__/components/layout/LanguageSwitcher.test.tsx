import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { profileService } from '@/services/profileService'
import { authStorage } from '@/lib/auth-storage'
import { toast } from 'sonner'

// Mock dependencies
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

vi.mock('@/services/profileService', () => ({
  profileService: {
    updateLanguage: vi.fn(),
  },
}))

vi.mock('@/lib/auth-storage', () => ({
  authStorage: {
    isValidSession: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.cookie = ''
  })

  it('renders correctly with default locale VI', () => {
    render(
      <I18nProvider initialLocale="vi">
        <LanguageSwitcher />
      </I18nProvider>
    )

    // Trigger button shows VI
    expect(screen.getByText('VI')).toBeInTheDocument()
  })

  it('switches language and sets cookie when unauthenticated', async () => {
    vi.mocked(authStorage.isValidSession).mockReturnValue(false)

    render(
      <I18nProvider initialLocale="vi">
        <LanguageSwitcher />
      </I18nProvider>
    )

    // Open dropdown by pressing Enter or Space or pointerdown
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })

    // Find and click 'English' option
    const enOption = await screen.findByText('English')
    fireEvent.click(enOption)

    await waitFor(() => {
      // Should NOT call backend updateLanguage API
      expect(profileService.updateLanguage).not.toHaveBeenCalled()
      // Should write cookie
      expect(document.cookie).toContain('NEXT_LOCALE=en')
      // Should refresh router
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('calls profileService.updateLanguage when user is authenticated', async () => {
    vi.mocked(authStorage.isValidSession).mockReturnValue(true)
    vi.mocked(profileService.updateLanguage).mockResolvedValue({} as any)

    render(
      <I18nProvider initialLocale="vi">
        <LanguageSwitcher />
      </I18nProvider>
    )

    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })

    const enOption = await screen.findByText('English')
    fireEvent.click(enOption)

    await waitFor(() => {
      expect(profileService.updateLanguage).toHaveBeenCalledWith('en')
      expect(document.cookie).toContain('NEXT_LOCALE=en')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('rolls back locale and shows error toast when API fails', async () => {
    vi.mocked(authStorage.isValidSession).mockReturnValue(true)
    vi.mocked(profileService.updateLanguage).mockRejectedValue(new Error('Network error'))

    render(
      <I18nProvider initialLocale="vi">
        <LanguageSwitcher />
      </I18nProvider>
    )

    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })

    const enOption = await screen.findByText('English')
    fireEvent.click(enOption)

    await waitFor(() => {
      expect(profileService.updateLanguage).toHaveBeenCalledWith('en')
      expect(toast.error).toHaveBeenCalledWith('Không thể cập nhật ngôn ngữ. Vui lòng thử lại.')
    })
  })
})
