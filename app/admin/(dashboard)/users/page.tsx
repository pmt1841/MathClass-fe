import { UsersClient } from './_components/users-client'

export const metadata = {
  title: 'Quản lý Người dùng – MathClass',
  description: 'Quản lý tài khoản người dùng trong hệ thống MathClass',
}

export default function AdminUsersPage() {
  return <UsersClient />
}
