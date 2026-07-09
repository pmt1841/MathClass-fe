import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClassesClient } from '@/app/(dashboard)/classes/_components/classes-client'
import api from '@/lib/axios'

// Mock the API module
vi.mock('@/lib/axios', () => {
  return {
    __esModule: true,
    default: {
      get: vi.fn(),
      delete: vi.fn()
    }
  }
})

describe('ClassesClient Feature', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    window.sessionStorage.clear()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  it('renders loading skeleton initially', () => {
    // API chưa trả về
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}))
    window.localStorage.setItem('user_info', JSON.stringify({ role: 'TEACHER' }))

    render(
      <QueryClientProvider client={queryClient}>
        <ClassesClient />
      </QueryClientProvider>
    )
    
    // Tìm các thẻ Skeleton bằng test id nếu có, hoặc dựa vào class
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders classes list on successful API fetch', async () => {
    // API trả về danh sách lớp
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: 1, className: 'Toán 10A1', classCode: 'MATH10A1', description: 'Lớp nâng cao' }
      ]
    })
    window.localStorage.setItem('user_info', JSON.stringify({ role: 'TEACHER' }))

    render(
      <QueryClientProvider client={queryClient}>
        <ClassesClient />
      </QueryClientProvider>
    )

    // Đợi API trả về và giao diện render ra
    await waitFor(() => {
      expect(screen.getByText('Toán 10A1')).toBeInTheDocument()
      expect(screen.getByText('MATH10A1')).toBeInTheDocument()
    })
  })
})
