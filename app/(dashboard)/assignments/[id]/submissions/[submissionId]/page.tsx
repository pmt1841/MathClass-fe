import { SubmissionDetail } from '@/components/assignments/submission-detail'

interface PageProps {
  params: Promise<{ id: string; submissionId: string }>
  searchParams: Promise<{ classCode?: string; sheetId?: string }>
}

export default async function SubmissionDetailPage({ params, searchParams }: PageProps) {
  const { id, submissionId } = await params
  const sParams = await searchParams
  const classCode = sParams.classCode
  const sheetId = sParams.sheetId
  const parsedSubmissionId = parseInt(submissionId, 10)
  const parsedAssignmentId = parseInt(id, 10)
  const parsedSheetId = sheetId ? parseInt(sheetId, 10) : undefined

  return (
    <div className="flex-1 h-[calc(100vh-theme(spacing.16))]">
      {isNaN(parsedSubmissionId) || isNaN(parsedAssignmentId) ? (
        <div className="text-red-500 p-4 border rounded-md m-4">ID không hợp lệ.</div>
      ) : (
        <SubmissionDetail submissionId={parsedSubmissionId} assignmentId={parsedAssignmentId} classCode={classCode} sheetId={parsedSheetId} />
      )}
    </div>
  )
}
