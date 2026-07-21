import { UsersClient } from './_components/users-client'

export const metadata = {
  title: 'Quản lý Người dùng – Math Class',
  description: 'Quản lý tài khoản người dùng trong hệ thống Math Class',
}

export default function AdminUsersPage() {
  return <UsersClient />
}
