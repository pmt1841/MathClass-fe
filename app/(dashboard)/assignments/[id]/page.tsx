import { AssignmentDetailClient } from './_components/assignment-detail-client'

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <AssignmentDetailClient params={params} />
}
