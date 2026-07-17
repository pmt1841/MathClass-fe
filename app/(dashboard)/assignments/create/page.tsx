import { CreateAssignmentPageClient } from './_components/create-client'
import { RoutePermissionGuard } from '@/components/ui/with-permission'

export default function CreateAssignmentPage() {
  return (
    <RoutePermissionGuard permission="assignment:create" redirectUrl="/assignments">
      <CreateAssignmentPageClient />
    </RoutePermissionGuard>
  )
}
