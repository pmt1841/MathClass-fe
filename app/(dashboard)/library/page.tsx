import { RoutePermissionGuard } from '@/components/ui/with-permission'
import { LibraryClient } from './_components/library-client'

export const metadata = {
  title: 'Thư viện dùng chung | MathClass',
  description: 'Khám phá và clone bài tập từ cộng đồng giáo viên MathClass',
}

export default function LibraryPage() {
  return (
    <RoutePermissionGuard permission="library:read">
      <LibraryClient />
    </RoutePermissionGuard>
  )
}
