'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  BookOpen,
  CheckCircle,
  LayoutDashboard,
  AlertTriangle,
  TrendingDown,
  Users,
  FileText,
  BookCopy,
  PenTool,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { RefreshButton } from '@/components/ui/refresh-button'
import { dashboardService } from '@/services/dashboardService'
import { classroomService } from '@/services/classroomService'
import Link from 'next/link'
import { formatDistanceToNowSafe } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

export function TeacherDashboardClient() {
  const { t } = useI18n()
  const [selectedClass, setSelectedClass] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')


  const { data: stats, isLoading, refetch: refetchStats } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: dashboardService.getTeacherStats,
    staleTime: 2 * 60 * 1000,
  })

  const { data: classesData = [], refetch: refetchClasses } = useQuery({
    queryKey: ['my-classes'],
    queryFn: classroomService.getMyClassrooms,
    staleTime: 2 * 60 * 1000,
  })

  const { data: pendingSubmissionData = [], refetch: refetchSubmissions } = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: () => dashboardService.getPendingSubmissions(50),
    staleTime: 2 * 60 * 1000,
  })

  const { data: atRiskStudents = [], isLoading: isLoadingAtRisk, refetch: refetchAtRisk } = useQuery({
    queryKey: ['at-risk-students'],
    queryFn: dashboardService.getAtRiskStudents,
    staleTime: 2 * 60 * 1000,
  })

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchClasses(),
      refetchSubmissions(),
      refetchAtRisk(),
    ])
  }

  // Filter logic
  const filteredAssignments = useMemo(() => {
    return pendingSubmissionData.filter((a: any) => {
      const matchesClass = selectedClass === 'all' || a.classCode === selectedClass
      const matchesSearch = searchQuery === '' ||
        a.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assignmentTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesClass && matchesSearch
    })
  }, [pendingSubmissionData, selectedClass, searchQuery])

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen">
      {/* Header Bar */}
      <div className="border-b border-border bg-white py-6 shadow-sm">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/20">
                <LayoutDashboard className="h-5.5 w-5.5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('dashboard.overview')}</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {selectedClass === 'all' ? t('dashboard.allClassesData') : `Hiển thị dữ liệu của ${classesData.find((c: any) => c.classCode === selectedClass)?.className || 'lớp'}.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={handleRefresh}
              title={t('common.refresh')}
            />
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto w-full">

        {/* Row 1: KPI Cards - Chữ và số trên cùng 1 dòng, icon phù hợp */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1: Tổng học sinh */}
          <Card className="border-0 shadow-sm shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden py-3 px-4 gap-0 justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <Users className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {t('dashboard.totalStudents')}
                </span>

              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight shrink-0">
                {isLoading ? '-' : stats?.managedStudents ?? 125}
              </span>
            </div>
          </Card>

          {/* Card 2: Lớp quản lý */}
          <Card className="border-0 shadow-sm shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden py-3 px-4 gap-0 justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-purple-50 rounded-lg shrink-0">
                  <BookOpen className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {t('dashboard.managedClasses')}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight shrink-0">
                {isLoading ? '-' : stats?.teachingClasses ?? 3}
              </span>
            </div>
          </Card>

          {/* Card 3: Bài đang mở */}
          <Card className="border-0 shadow-sm shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden py-3 px-4 gap-0 justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                  <FileText className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {t('dashboard.openAssignments')}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight shrink-0">
                {isLoading ? '-' : stats?.openAssignments ?? 0}
              </span>
            </div>
          </Card>

          {/* Card 4: Phiếu bài tập */}
          <Card className="border-0 shadow-sm shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden py-3 px-4 gap-0 justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500"></div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-cyan-50 rounded-lg shrink-0">
                  <BookCopy className="h-4.5 w-4.5 text-cyan-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {t('dashboard.worksheets')}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight shrink-0">
                {isLoading ? '-' : stats?.originalAssignmentSheets ?? 0}
              </span>
            </div>
          </Card>

          {/* Card 5: Bài chờ chấm */}
          <Card className="border-0 shadow-md shadow-orange-500/20 bg-gradient-to-br from-orange-500 to-rose-500 hover:shadow-lg transition-all hover:-translate-y-0.5 relative overflow-hidden group py-3 px-4 gap-0 justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-60 -mr-10 -mt-10 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                  <PenTool className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-xs font-bold text-orange-100 uppercase tracking-wider truncate">
                  {t('dashboard.pendingGrading')}
                </span>
              </div>
              <span className="text-2xl font-black text-white tracking-tight shrink-0">
                {isLoading ? '-' : stats?.assignmentsToGrade ?? 14}
              </span>
            </div>
          </Card>
        </div>

        {/* Row 2: Main Content */}
        <div className="grid gap-6 lg:grid-cols-12 items-start w-full">

          {/* Left Column (65%) */}
          <div className="lg:col-span-8 space-y-4 min-w-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 min-h-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {t('dashboard.pendingGradingSubmissions')}
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 rounded-lg font-medium h-10 text-sm transition-shadow">
                    <SelectValue placeholder={t('dashboard.selectClassPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-medium text-slate-700">{t('dashboard.allClasses')}</SelectItem>
                    {classesData.map((cls: any) => (
                      <SelectItem key={cls.classCode} value={cls.classCode} className="font-medium">{cls.className}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder={t('dashboard.searchPlaceholder')}
                    className="w-full pl-9 bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 rounded-lg h-10 text-sm transition-shadow"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Card className="border-0 shadow-md shadow-slate-200/50 bg-white/90 backdrop-blur-md overflow-hidden rounded-xl p-0 gap-0">
              <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-100 shadow-xs">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="font-semibold text-slate-500 py-3 uppercase text-xs tracking-wider">{t('dashboard.student')}</TableHead>
                      <TableHead className="font-semibold text-slate-500 py-3 uppercase text-xs tracking-wider">{t('dashboard.assignmentName')}</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-slate-500 py-3 uppercase text-xs tracking-wider">{t('dashboard.className')}</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold text-slate-500 py-3 uppercase text-xs tracking-wider">{t('dashboard.submitTime')}</TableHead>
                      <TableHead className="text-right py-3 pr-4"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredAssignments.length > 0 ? (
                      filteredAssignments.map((task: any) => (
                        <TableRow key={task.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100/60 group">
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex shrink-0 items-center justify-center text-blue-700 font-bold text-sm shadow-inner">
                                {task.studentName?.charAt(0) || 'H'}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-slate-800 truncate">{task.studentName}</span>
                                <span className="text-xs text-slate-500 md:hidden mt-0.5 truncate">{t('dashboard.className')}: {task.className}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 py-3 font-medium">
                            <div className="flex flex-col min-w-0">
                              <span className="truncate block">{task.assignmentTitle}</span>
                              <span className="text-xs text-slate-500 sm:hidden mt-0.5 truncate">
                                {task.submittedAt ? formatDistanceToNowSafe(task.submittedAt, { addSuffix: true }) : '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-3">
                            <Badge variant="outline" className="border-blue-200 text-blue-700 font-semibold bg-blue-50/50 text-xs">
                              {task.className}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-slate-500 text-sm py-3 font-medium">
                            {task.submittedAt ? formatDistanceToNowSafe(task.submittedAt, { addSuffix: true }) : '-'}
                          </TableCell>
                          <TableCell className="text-right py-3 pr-4">
                            <Link href={`/assignments/${task.assignmentId}/submissions/${task.id}`}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-sm transition-all opacity-90 group-hover:opacity-100 rounded-lg font-medium px-3.5 h-8 text-xs">
                                {t('dashboard.gradeNow')}
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16 text-slate-500">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-emerald-50 rounded-full">
                              <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-lg">{t('common.success')}</p>
                              <p className="text-slate-500 mt-1">{t('dashboard.noPendingGradingAssignments')}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right Column (35%) - At Risk Students */}
          <div className="lg:col-span-4 space-y-4 min-w-0">
            <div className="flex items-center justify-between min-h-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {t('dashboard.studentsNeedingAttention')}
              </h2>

              {atRiskStudents.length > 0 && (
                <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200/60 font-semibold text-xs">
                  {atRiskStudents.length} {t('dashboard.studentUnit')}
                </Badge>
              )}
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {isLoadingAtRisk ? (
                <div className="text-center py-8 text-slate-500 bg-white rounded-xl shadow-xs">{t('common.loading')}</div>
              ) : atRiskStudents.length > 0 ? (
                atRiskStudents.map((student: any, index: number) => {
                  const isLowScore = student.issueType === 'low_score';
                  return (
                    <Card key={`${student.id}-${index}`} className="border-0 shadow-sm shadow-slate-200/40 bg-white hover:shadow-md transition-all group overflow-hidden rounded-xl p-0 gap-0">
                      <CardContent className="p-3.5">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 ${isLowScore
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-orange-100 text-orange-700'
                            }`}>
                            {student.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-slate-900 truncate text-sm">{student.name}</h3>
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 shrink-0 text-[10px] px-1.5 py-0">
                                {student.className}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              {isLowScore ? (
                                <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              )}
                              <p className={`text-xs font-semibold truncate ${isLowScore ? 'text-rose-600' : 'text-orange-600'}`}>
                                {student.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })) : (
                <div className="text-center py-8 text-slate-500 bg-white rounded-xl shadow-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm">{t('dashboard.noStudentsNeedingAttention')}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
