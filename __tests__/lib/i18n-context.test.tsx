import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider, useI18n } from '@/lib/i18n/i18n-context'

function TestConsumer({ testKey, params }: { testKey: string; params?: any }) {
  const { locale, setLocale, t } = useI18n()
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="translation">{t(testKey, params)}</span>
      <button data-testid="switch-en" onClick={() => setLocale('en')}>EN</button>
      <button data-testid="switch-vi" onClick={() => setLocale('vi')}>VI</button>
    </div>
  )
}

describe('i18n-context', () => {
  it('dịch chuỗi tiếng Việt cơ bản và thay thế biến {variable}', () => {
    render(
      <I18nProvider initialLocale="vi">
        <TestConsumer testKey="Đã sao chép mã lớp: {code}" params={{ code: 'MATH101' }} />
      </I18nProvider>
    )

    expect(screen.getByTestId('current-locale').textContent).toBe('vi')
    expect(screen.getByTestId('translation').textContent).toBe('Đã sao chép mã lớp: MATH101')
  })

  it('hỗ trợ định dạng biến kiểu {{variable}}', () => {
    render(
      <I18nProvider initialLocale="vi">
        <TestConsumer testKey="Xin chào {{name}}" params={{ name: 'Nam' }} />
      </I18nProvider>
    )

    expect(screen.getByTestId('translation').textContent).toBe('Xin chào Nam')
  })

  it('chuyển đổi locale khi gọi setLocale và dịch sang tiếng Anh', () => {
    render(
      <I18nProvider initialLocale="vi">
        <TestConsumer testKey="Quay lại" />
      </I18nProvider>
    )

    expect(screen.getByTestId('translation').textContent).toBe('Quay lại')

    act(() => {
      screen.getByTestId('switch-en').click()
    })

    expect(screen.getByTestId('current-locale').textContent).toBe('en')
    expect(screen.getByTestId('translation').textContent).toBe('Back')
  })

  it('tự động fallback về từ điển tiếng Việt nếu từ khóa chưa có trong tiếng Anh', () => {
    render(
      <I18nProvider initialLocale="en">
        <TestConsumer testKey="Một chuỗi chỉ có trong tiếng Việt chưa được dịch" />
      </I18nProvider>
    )

    expect(screen.getByTestId('translation').textContent).toBe(
      'Một chuỗi chỉ có trong tiếng Việt chưa được dịch'
    )
  })

  it('hỗ trợ truy xuất từ khóa dạng dot-notation (vd: common.success, credits.buyNow)', () => {
    render(
      <I18nProvider initialLocale="vi">
        <TestConsumer testKey="credits.buyNow" />
      </I18nProvider>
    )

    expect(screen.getByTestId('translation').textContent).toBe('Mua ngay')
  })

  it('hoạt động độc lập ngoài I18nProvider với fallback mặc định tiếng Việt', () => {
    render(<TestConsumer testKey="credits.buyNow" />)
    expect(screen.getByTestId('translation').textContent).toBe('Mua ngay')
  })
})
