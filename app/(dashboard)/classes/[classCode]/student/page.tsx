import { StudentClassDetailPageClient } from './_components/student-client'

interface PageProps { params: any }

export default function StudentClassDetailPage({ params }: PageProps) {
  return <StudentClassDetailPageClient params={params} />
}
