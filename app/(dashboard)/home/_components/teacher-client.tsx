'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'

// Mock Data for Charts
const classPerformanceData = [
  { name: '10A1', completion: 92 },
  { name: '10A2', completion: 85 },
  { name: '11B1', completion: 78 },
  { name: '11B2', completion: 95 },
  { name: '12C1', completion: 60 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
const weakStudentsData = [
  { name: 'Nguyễn Văn A', class: '12C1', score: 4.5, issue: 'Bỏ 3 bài tập' },
  { name: 'Trần Thị B', class: '11B1', score: 3.8, issue: 'Điểm trung bình thấp' },
]

export function TeacherDashboardClient() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: dashboardApi.getTeacherStats,
  })

  return (
    <div className="flex-1 space-y-6 px-8 pb-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tổng quan Giáo viên</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lớp học đang dạy</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats?.teachingClasses ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Đang hoạt động</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học sinh quản lý</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats?.managedStudents ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Học sinh tham gia lớp</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Bài tập cần chấm</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {isLoading ? '-' : stats?.assignmentsToGrade ?? 0}
            </div>
            <p className="text-xs text-orange-600/80 dark:text-orange-500/80 mt-1">Bài nộp đang chờ</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Duyệt xin vào lớp</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {isLoading ? '-' : stats?.pendingJoinRequests ?? 0}
            </div>
            <p className="text-xs text-red-600/80 dark:text-red-500/80 mt-1">Học sinh đang chờ</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Urgent Actions */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Hành động khẩn cấp</CardTitle>
            <CardDescription>Các công việc cần xử lý ngay hôm nay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">3 Học sinh chờ duyệt vào lớp 10A1</p>
                <p className="text-sm text-muted-foreground">Lê Văn C, Phạm Thị D, ...</p>
              </div>
              <Button size="sm">Duyệt ngay</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Bài tập "Đại số chương 2" vừa hết hạn</p>
                <p className="text-sm text-muted-foreground">Có 38/40 bài nộp (Lớp 12C1)</p>
              </div>
              <Button size="sm" variant="secondary">Chấm điểm</Button>
            </div>
          </CardContent>
        </Card>

        {/* Weak Students Warning */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Cảnh báo học sinh yếu</CardTitle>
            <CardDescription>Học sinh bỏ bài hoặc điểm TB &lt; 5.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weakStudentsData.map((student, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-400">{student.name} <Badge variant="outline" className="ml-2 bg-white dark:bg-black text-xs">{student.class}</Badge></p>
                    <p className="text-xs text-red-700/80 dark:text-red-400/80">{student.issue} - Điểm TB: {student.score}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-700 dark:text-red-400">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tiến độ hoàn thành bài tập các lớp</CardTitle>
            <CardDescription>Tỷ lệ học sinh nộp bài đầy đủ.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classPerformanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
