import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReportBugModal } from '@/components/bug-report/ReportBugModal'
import { I18nProvider } from '@/lib/i18n/i18n-context'

// Mock bugReportService
vi.mock('@/services/bugReportService', () => ({
  bugReportService: {
    sendPublicOtp: vi.fn(),
    uploadPublicImage: vi.fn(),
    createPublicReport: vi.fn(),
    createAuthenticatedReport: vi.fn(),
  },
}))

describe('ReportBugModal i18n', () => {
  it('renders in Vietnamese when locale is vi', () => {
    render(
      <I18nProvider initialLocale="vi">
        <ReportBugModal open={true} onClose={() => {}} isAuthenticated={true} />
      </I18nProvider>
    )

    // Should show Vietnamese title and labels
    expect(screen.getByText('Báo cáo lỗi hệ thống')).toBeInTheDocument()
    expect(screen.getByText('Mô tả sự cố')).toBeInTheDocument()
    expect(screen.getByText('Ảnh đính kèm')).toBeInTheDocument()
    expect(screen.getByText('Hủy bỏ')).toBeInTheDocument()
    expect(screen.getByText('Gửi báo cáo')).toBeInTheDocument()
  })

  it('renders in English when locale is en', () => {
    render(
      <I18nProvider initialLocale="en">
        <ReportBugModal open={true} onClose={() => {}} isAuthenticated={true} />
      </I18nProvider>
    )

    // Should show English title and labels
    expect(screen.getByText('Report System Bug')).toBeInTheDocument()
    expect(screen.getByText('Issue Description')).toBeInTheDocument()
    expect(screen.getByText('Attachments')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Submit Report')).toBeInTheDocument()
  })
})
