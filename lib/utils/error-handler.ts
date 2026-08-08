import { AxiosError } from 'axios'

export function handleApiError(error: unknown, defaultMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.'): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.response?.data?.error || defaultMessage
  }
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

/**
 * Kiểm tra lỗi "hết credit AI" (HTTP 402 + errorCode INSUFFICIENT_CREDITS).
 * Dùng để hiển thị CTA "Mua thêm credit" thay vì thông báo lỗi chung chung.
 */
export function isInsufficientCredit(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 402
}

