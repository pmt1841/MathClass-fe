import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('trả về giá trị khởi tạo ngay lập tức', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('chưa cập nhật giá trị mới khi thời gian trôi qua chưa đủ delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    rerender({ value: 'updated', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Chưa đạt 300ms nên vẫn giữ giá trị cũ
    expect(result.current).toBe('initial')
  })

  it('cập nhật giá trị mới sau khi đủ delay ms', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    rerender({ value: 'updated', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('updated')
  })

  it('hủy bỏ timer trước đó và chỉ lấy giá trị cuối cùng khi giá trị thay đổi liên tục', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    rerender({ value: 'third' })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    // Tổng 300ms kể từ 'second' nhưng 'third' mới kích hoạt được 150ms -> vẫn 'first'
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(150)
    })

    // Đã đủ 300ms kể từ lần đổi sang 'third'
    expect(result.current).toBe('third')
  })

  it('sử dụng delay mặc định 300ms khi không truyền tham số delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })
})
