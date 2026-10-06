import { Metadata } from 'next'
import { AdminCreditQuotaClient } from './_components/AdminCreditQuotaClient'

export const metadata: Metadata = {
  title: 'Hạn mức Credit - Admin MathClass',
  description: 'Quản lý chi phí tác vụ AI, hạn mức mặc định theo vai trò, gói credit và lịch sử biến động số dư.',
}

export default function AdminCreditQuotaPage() {
  return <AdminCreditQuotaClient />
}
