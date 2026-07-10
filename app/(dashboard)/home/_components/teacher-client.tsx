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
import { Search, Users, BookOpen, CheckCircle, FileText, LayoutDashboard, AlertTriangle, TrendingDown, Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'
import { classroomService } from '@/services/classroomService'
import Link from 'next/link'
import { formatDistanceToNowSafe } from '@/lib/utils'

export function TeacherDashboardClient() {
  const [selectedClass, setSelectedClass] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: dashboardService.getTeacherStats,
    staleTime: 2 * 60 * 1000,
  })

  const { data: classesData = [] } = useQuery({
    queryKey: ['my-classes'],
    queryFn: classroomService.getMyClassrooms,
    staleTime: 2 * 60 * 1000,
  })

  const { data: pendingSubmissionData = [] } = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: () => dashboardService.getPendingSubmissions(10),
    staleTime: 2 * 60 * 1000,
  })

  const { data: atRiskStudents = [], isLoading: isLoadingAtRisk } = useQuery({
    queryKey: ['at-risk-students'],
    queryFn: dashboardService.getAtRiskStudents,
    staleTime: 2 * 60 * 1000,
  })

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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tổng quan</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {selectedClass === 'all' ? 'Hiển thị dữ liệu của tất cả các lớp.' : `Hiển thị dữ liệu của ${classesData.find((c: any) => c.classCode === selectedClass)?.className || 'lớp'}.`}
            </p>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 space-y-8 max-w-screen-2xl mx-auto w-full">

        {/* Row 1: KPI Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-md shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tổng học sinh</CardTitle>
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800">
                {isLoading ? '-' : stats?.managedStudents ?? 125}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Lớp quản lý</CardTitle>
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800">
                {isLoading ? '-' : stats?.teachingClasses ?? 3}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bài đang mở</CardTitle>
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800">
                {isLoading ? '-' : stats?.openAssignments ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-orange-500/20 bg-gradient-to-br from-orange-500 to-rose-500 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-60 -mr-10 -mt-10 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-orange-50 uppercase tracking-wider">Bài chờ chấm</CardTitle>
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-white">
                {isLoading ? '-' : stats?.assignmentsToGrade ?? 14}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Main Content */}
        <div className="grid gap-6 lg:grid-cols-12 items-start w-full">

          {/* Left Column (65%) */}
          <div className="lg:col-span-8 space-y-4 min-w-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Bài nộp chờ chấm
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 rounded-lg font-medium h-10 text-sm transition-shadow">
                    <SelectValue placeholder="Chọn lớp học..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-medium text-slate-700">Tất cả các lớp</SelectItem>
                    {classesData.map((cls: any) => (
                      <SelectItem key={cls.classCode} value={cls.classCode} className="font-medium">{cls.className}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Tìm kiếm học sinh, bài tập..."
                    className="w-full pl-9 bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 rounded-lg h-10 text-sm transition-shadow"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Card className="border-0 shadow-md shadow-slate-200/50 bg-white/90 backdrop-blur-md overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="font-semibold text-slate-500 py-4 uppercase text-xs tracking-wider">Học sinh</TableHead>
                      <TableHead className="font-semibold text-slate-500 py-4 uppercase text-xs tracking-wider">Tên bài tập</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-slate-500 py-4 uppercase text-xs tracking-wider">Lớp</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold text-slate-500 py-4 uppercase text-xs tracking-wider">Thời gian nộp</TableHead>
                      <TableHead className="text-right py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.length > 0 ? (
                      filteredAssignments.map((task: any) => (
                        <TableRow key={task.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100/50 group">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex shrink-0 items-center justify-center text-blue-700 font-bold text-sm shadow-inner">
                                {task.studentName.charAt(0)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-slate-800 truncate">{task.studentName}</span>
                                <span className="text-xs text-slate-500 md:hidden mt-0.5 truncate">Lớp: {task.className}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 py-4 font-medium">
                            <div className="flex flex-col min-w-0">
                              <span className="truncate block">{task.assignmentTitle}</span>
                              <span className="text-xs text-slate-500 sm:hidden mt-0.5 truncate">
                                {task.submittedAt ? formatDistanceToNowSafe(task.submittedAt, { addSuffix: true }) : 'Chưa rõ'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-4">
                            <Badge variant="outline" className="border-blue-200 text-blue-700 font-semibold bg-blue-50/50">
                              {task.className}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-slate-500 text-sm py-4 font-medium">
                            {task.submittedAt ? formatDistanceToNowSafe(task.submittedAt, { addSuffix: true }) : 'Chưa rõ'}
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <Link href={`/assignments/${task.assignmentId}/submissions/${task.id}`}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all opacity-90 group-hover:opacity-100 rounded-lg font-medium px-4">
                                Chấm ngay
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
                              <p className="font-semibold text-slate-800 text-lg">Tuyệt vời!</p>
                              <p className="text-slate-500 mt-1">Không có bài tập nào chờ chấm trong danh sách.</p>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Học sinh cần chú ý
              </h2>
            </div>

            <div className="space-y-4">
              {isLoadingAtRisk ? (
                <div className="text-center py-8 text-slate-500">Đang tải dữ liệu...</div>
              ) : atRiskStudents.length > 0 ? (
                atRiskStudents.map((student: any, index: number) => {
                  const isLowScore = student.issueType === 'low_score';
                  return (
                    <Card key={`${student.id}-${index}`} className="border-0 shadow-md shadow-slate-200/40 bg-white hover:shadow-lg transition-all group overflow-hidden rounded-xl">
                      <CardContent className="p-0">
                        <div className="p-4 flex items-start gap-4">
                          <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 ${isLowScore
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-orange-100 text-orange-700'
                            }`}>
                            {student.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-slate-900 truncate">{student.name}</h3>
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 shrink-0 text-[10px] px-1.5 py-0">
                                {student.className}
                              </Badge>
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              {isLowScore ? (
                                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                              )}
                              <p className={`text-sm font-semibold ${isLowScore ? 'text-rose-600' : 'text-orange-600'}`}>
                                {student.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                        </div>
                      </CardContent>
                    </Card>
                  )
                })) : (
                <div className="text-center py-8 text-slate-500 bg-white rounded-xl shadow-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>Không có học sinh nào cần chú ý</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
