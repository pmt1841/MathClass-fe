import { EditAssignmentPageClient } from './_components/edit-client'
import { RoutePermissionGuard } from '@/components/ui/with-permission'

export default function EditAssignmentPage() {
  return (
    <RoutePermissionGuard permission="assignment:update" redirectUrl="/assignments">
      <EditAssignmentPageClient />
    </RoutePermissionGuard>
  )
}
