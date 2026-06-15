import { SubmissionDetail } from '@/components/assignments/submission-detail'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string; submissionId: string }>
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id, submissionId } = await params
  const parsedSubmissionId = parseInt(submissionId, 10)
  const parsedAssignmentId = parseInt(id, 10)

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center space-x-2">
        <Link href={`/assignments/${parsedAssignmentId}/submissions`}>
          <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Chi tiết bài nộp</h2>
      </div>

      {isNaN(parsedSubmissionId) ? (
        <div className="text-red-500 p-4 border rounded-md">ID bài nộp không hợp lệ.</div>
      ) : (
        <SubmissionDetail submissionId={parsedSubmissionId} />
      )}
    </div>
  )
}
