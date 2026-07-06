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
