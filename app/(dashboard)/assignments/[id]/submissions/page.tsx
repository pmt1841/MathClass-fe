import { SubmissionsClient } from './_components/submissions-client'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ classCode?: string }>
}

export default async function SubmissionsPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sParams = await searchParams
  const classCode = sParams.classCode
  const parsedAssignmentId = parseInt(id, 10)

  return <SubmissionsClient assignmentId={parsedAssignmentId} classCode={classCode} />
}

