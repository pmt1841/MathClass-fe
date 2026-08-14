import { BugReportsListClient } from './_components/bug-reports-list-client'

export const metadata = {
  title: 'Quản lý Báo cáo lỗi Hệ thống - Admin MathClass',
  description: 'Giao diện quản lý danh sách báo cáo sự cố từ người dùng hệ thống',
}

export default function AdminBugReportsPage() {
  return <BugReportsListClient />
}
