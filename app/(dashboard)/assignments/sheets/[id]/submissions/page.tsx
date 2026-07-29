import { SheetSubmissionTable } from '@/components/assignments/sheet-submission-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ classCode?: string }>
}

export default async function SheetSubmissionsPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sParams = await searchParams
  const classCode = sParams.classCode
  const parsedSheetId = parseInt(id, 10)

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center space-x-2">
        <Link href={classCode ? `/classes/${classCode}` : "/assignments"}>
          <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Danh sách bài nộp phiếu</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tiến độ làm phiếu bài tập của học sinh</CardTitle>
          <CardDescription>
            Danh sách những học sinh đã làm và nộp ít nhất một bài tập trong phiếu này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isNaN(parsedSheetId) ? (
            <div className="text-red-500">ID phiếu bài tập không hợp lệ.</div>
          ) : (
            <SheetSubmissionTable sheetId={parsedSheetId} classCode={classCode} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
