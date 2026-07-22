import { SubmissionTable } from '@/components/assignments/submission-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ classCode?: string }>
}

export default async function SubmissionsPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sParams = await searchParams
  const classCode = sParams.classCode
  const parsedAssignmentId = parseInt(id, 10)

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center space-x-2">
        <Link href={classCode ? `/classes/${classCode}` : "/assignments"}>
          <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Danh sách bài nộp</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quản lý bài nộp học sinh</CardTitle>
          <CardDescription>
            Xem, lọc và chấm điểm các bài nộp của học sinh cho bài tập này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isNaN(parsedAssignmentId) ? (
            <div className="text-red-500">ID bài tập không hợp lệ.</div>
          ) : (
            <SubmissionTable assignmentId={parsedAssignmentId} classCode={classCode} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
