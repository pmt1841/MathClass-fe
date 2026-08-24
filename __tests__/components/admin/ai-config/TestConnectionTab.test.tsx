import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestConnectionTab } from '@/components/admin/ai-config/TestConnectionTab'
import { AiProvider } from '@/services/aiConfigService'

const mockProviders: AiProvider[] = [
  {
    id: 1,
    code: 'OPENAI',
    name: 'OpenAI Provider',
    baseUrl: 'https://api.openai.com/v1',
    protocol: 'OPENAI_COMPATIBLE',
    strategy: 'PRIORITY',
    status: 'ACTIVE',
  },
  {
    id: 2,
    code: 'GEMINI',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    protocol: 'GOOGLE_GEMINI_COMPATIBLE',
    strategy: 'ROUND_ROBIN',
    status: 'ACTIVE',
  },
]

const { getProvidersMock, testConnectionMock, toastMock } = vi.hoisted(() => ({
  getProvidersMock: vi.fn(),
  testConnectionMock: vi.fn(),
  toastMock: vi.fn(),
}))

vi.mock('@/services/aiConfigService', async () => {
  const actual = await vi.importActual<typeof import('@/services/aiConfigService')>('@/services/aiConfigService')
  return {
    ...actual,
    aiConfigService: {
      getProviders: getProvidersMock,
      testConnection: testConnectionMock,
    },
  }
})

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}))

describe('TestConnectionTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getProvidersMock.mockResolvedValue(mockProviders)
    testConnectionMock.mockResolvedValue({
      success: true,
      valid: true,
      latencyMs: 120,
      message: 'OK',
    })
  })

  it('should not select any provider by default and hide API key input initially', async () => {
    render(<TestConnectionTab />)

    await waitFor(() => expect(getProvidersMock).toHaveBeenCalled())

    // Empty provider state
    expect(screen.getByText('Chưa chọn Nhà cung cấp')).toBeTruthy()
    expect(screen.getByText(/Vui lòng chọn một Provider ở danh sách trên/)).toBeTruthy()

    // API Key input & submit button are NOT rendered yet
    expect(screen.queryByPlaceholderText('Nhập API Key cần thử nghiệm...')).toBeNull()
    expect(screen.queryByRole('button', { name: /Kiểm tra kết nối/i })).toBeNull()
  })
})
