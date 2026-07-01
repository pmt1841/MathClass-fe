'use client'

import React, { useState } from 'react'
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
import { Search, Plus, Users, BookOpen, CheckCircle, FileText, ArrowRight, LayoutDashboard } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import api from '@/lib/axios'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

const gradients = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500'
]

export function TeacherDashboardClient() {
  const [selectedClass, setSelectedClass] = useState('all')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: dashboardApi.getTeacherStats,
  })

  const { data: classesData = [] } = useQuery({
    queryKey: ['my-classes'],
    queryFn: async () => {
      const res = await api.get('/classrooms/my-classroom')
      return Array.isArray(res.data) ? res.data : []
    },
  })

  const { data: pendingAssignmentsData = [] } = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: () => dashboardApi.getPendingSubmissions(20),
  })

  // Filter logic
  const filteredAssignments = selectedClass === 'all' 
    ? pendingAssignmentsData 
    : pendingAssignmentsData.filter((a: any) => a.classCode === selectedClass)

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen">
      {/* Header Bar */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <LayoutDashboard className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedClass === 'all' ? 'Hiển thị dữ liệu của tất cả các lớp.' : `Hiển thị dữ liệu của ${classesData.find((c: any) => c.classCode === selectedClass)?.className || 'lớp'}.`}
            </p>
          </div>
        </div>
      </div>

      <main className="p-6 space-y-8 max-w-screen-2xl mx-auto">

        {/* Row 1: KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Tổng học sinh</CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoading ? '-' : stats?.managedStudents ?? 125}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Lớp đang quản lý</CardTitle>
              <div className="p-2 bg-purple-50 rounded-lg">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoading ? '-' : stats?.teachingClasses ?? 3}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Bài tập đang mở</CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoading ? '-' : stats?.openAssignments ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 border-2 bg-orange-50/50 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-200 to-orange-100 rounded-full blur-2xl opacity-60 -mr-8 -mt-8 group-hover:opacity-80 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-orange-800">Bài chờ chấm</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-orange-600">
                {isLoading ? '-' : stats?.assignmentsToGrade ?? 14}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Main Content */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* Left Column (65%) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">Danh sách bài chờ chấm</h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-white border-slate-200 shadow-sm focus:ring-blue-500 font-medium h-9 text-sm">
                    <SelectValue placeholder="Chọn lớp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-medium text-slate-700">Tất cả các lớp</SelectItem>
                    {classesData.map((cls: any) => (
                      <SelectItem key={cls.classCode} value={cls.classCode} className="font-medium">{cls.className}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="search" 
                    placeholder="Tìm kiếm học sinh, bài tập..." 
                    className="w-full pl-8 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-md h-9 shadow-sm text-sm"
                  />
                </div>
              </div>
            </div>
            
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-600 py-4">Học sinh</TableHead>
                      <TableHead className="font-semibold text-slate-600 py-4">Tên bài tập</TableHead>
                      <TableHead className="font-semibold text-slate-600 py-4">Lớp</TableHead>
                      <TableHead className="font-semibold text-slate-600 py-4">Thời gian nộp</TableHead>
                      <TableHead className="text-right py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.length > 0 ? (
                      filteredAssignments.map((task: any) => (
                        <TableRow key={task.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                          <TableCell className="font-medium text-slate-900 py-4">{task.studentName}</TableCell>
                          <TableCell className="text-slate-600 py-4">{task.assignmentTitle}</TableCell>
                          <TableCell className="py-4">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-semibold shadow-sm">
                              {task.className}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm py-4">
                            {task.submittedAt ? formatDistanceToNow(new Date(task.submittedAt), { addSuffix: true, locale: vi }) : 'Chưa rõ'}
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <Link href={`/assignments/${task.id}/submissions?classCode=${task.classCode}`}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow text-white">
                                Chấm ngay
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="p-3 bg-slate-100 rounded-full">
                              <CheckCircle className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>Không có bài tập nào chờ chấm trong lớp này.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right Column (35%) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Danh sách lớp học</h2>
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 font-medium shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo bài mới
              </Button>
            </div>

            <div className="space-y-3">
              {classesData.map((cls: any, index: number) => {
                const color = gradients[index % gradients.length]
                return (
                  <Link href={`/classes/${cls.classCode}`} key={cls.classCode} className="block">
                    <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-12 rounded-full ${color} shadow-sm`} />
                          <div>
                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base">{cls.className}</h3>
                            <p className="text-sm text-slate-500 font-medium mt-0.5">
                              {cls.studentCount} học sinh <span className="mx-1.5 text-slate-300">•</span> {cls.classCode}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors h-9 w-9">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
