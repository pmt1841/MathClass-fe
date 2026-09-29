'use client'

import { SubmissionTable } from '@/components/assignments/submission-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/i18n-context'

interface SubmissionsClientProps {
  assignmentId: number
  classCode?: string
}

export function SubmissionsClient({ assignmentId, classCode }: SubmissionsClientProps) {
  const { t } = useI18n()

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center space-x-2">
        <Link href={classCode ? `/classes/${classCode}` : '/assignments'}>
          <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">{t('Danh sách bài nộp')}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Quản lý bài nộp học sinh')}</CardTitle>
          <CardDescription>
            {t('Xem, lọc và chấm điểm các bài nộp của học sinh cho bài tập này.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isNaN(assignmentId) ? (
            <div className="text-red-500">{t('ID bài tập không hợp lệ.')}</div>
          ) : (
            <SubmissionTable assignmentId={assignmentId} classCode={classCode} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
