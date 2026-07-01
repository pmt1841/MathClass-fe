'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Trophy, Flame, BookOpen, Star, ArrowRight, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import api from '@/lib/axios'
import { formatDistanceToNow, isPast } from 'date-fns'
import { vi } from 'date-fns/locale'

const gradients = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-rose-500'
]

export function StudentDashboardClient() {
  const [greeting, setGreeting] = useState('Chào bạn')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Chào buổi sáng')
    else if (hour < 18) setGreeting('Chào buổi chiều')
    else setGreeting('Chào buổi tối')
  }, [])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['student-stats'],
    queryFn: dashboardApi.getStudentStats,
  })

  const { data: classesData = [] } = useQuery({
    queryKey: ['my-classes'],
    queryFn: async () => {
      const res = await api.get('/classrooms/my-classroom')
      return Array.isArray(res.data) ? res.data : []
    },
  })

  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['student-pending-tasks'],
    queryFn: () => dashboardApi.getStudentPendingTasks(10),
  })

  const { data: gradedTasks = [] } = useQuery({
    queryKey: ['student-graded-tasks'],
    queryFn: () => dashboardApi.getStudentGradedTasks(10),
  })

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen">
      {/* Inline Topbar (Page Header) */}
      <div className="border-b border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{greeting}! 👋</h1>
            <p className="text-sm text-slate-500 mt-1">
              Hôm nay bạn có <span className="font-semibold text-orange-600">{stats?.pendingTasks ?? 0} bài tập</span> cần hoàn thành. Cố lên nhé!
            </p>
          </div>
        </div>
      </div>

      <main className="p-6 space-y-8 max-w-screen-2xl mx-auto">

        {/* Row 1: Thống kê cá nhân (3 Cards) */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Số lớp đang tham gia</CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{statsLoading ? '-' : stats?.joinedClasses ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 border-2 bg-orange-50/50 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-200 to-orange-100 rounded-full blur-2xl opacity-60 -mr-8 -mt-8 group-hover:opacity-80 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-orange-800">Bài tập cần làm</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-orange-600">{statsLoading ? '-' : stats?.pendingTasks ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Bài đã chấm xong</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Star className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">{statsLoading ? '-' : stats?.completedTasks ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Việc cần làm ngay & Lớp học */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">

          {/* Cột trái (65%): Bài tập sắp đến hạn */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Bài tập sắp đến hạn
            </h2>
            <div className="space-y-3">
              {pendingTasks.map((task: any) => {
                const deadlineDate = task.deadline ? new Date(task.deadline) : null
                const isUrgent = deadlineDate ? (deadlineDate.getTime() - Date.now() < 24 * 60 * 60 * 1000) && !isPast(deadlineDate) : false

                return (
                  <Card key={task.id} className={`shadow-sm transition-all hover:shadow-md ${isUrgent ? 'border-orange-300 bg-orange-50/30' : 'border-slate-200 bg-white'}`}>
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-medium">
                            {task.className}
                          </Badge>
                          <h3 className="font-semibold text-slate-900 text-base">{task.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-slate-400" /> {task.type}
                          </span>
                          <span className={`flex items-center gap-1.5 ${isUrgent ? 'text-orange-600 font-semibold bg-orange-100/50 px-2 py-0.5 rounded-md' : ''}`}>
                            <Clock className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-slate-400'}`} /> {deadlineDate ? (isPast(deadlineDate) ? 'Đã quá hạn' : `Còn ${formatDistanceToNow(deadlineDate, { locale: vi })}`) : 'Không có hạn'}
                          </span>
                        </div>
                      </div>
                      <Link href={`/assignments/${task.id}?classCode=${task.classCode}`} className="shrink-0 w-full sm:w-auto">
                        <Button className={`w-full sm:w-auto shadow-sm ${isUrgent ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                          <PlayCircle className="w-4 h-4 mr-1.5" /> Làm bài ngay
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}

              {pendingTasks.length === 0 && (
                <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                    <Trophy className="w-6 h-6 text-slate-400" />
                  </div>
                  <p>Tuyệt vời! Bạn không có bài tập nào cần làm gấp.</p>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải (35%): Lớp học của tôi */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Các lớp đang tham gia</h2>
              <Link href="/classes" className="text-sm font-medium text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-3">
              {classesData.map((cls: any, index: number) => {
                const color = gradients[index % gradients.length]
                return (
                  <Link href={`/classes/${cls.classCode}`} key={cls.classCode} className="block group">
                    <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-1.5 h-12 rounded-full ${color} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{cls.className}</h3>
                            <p className="text-sm text-slate-500 mt-0.5 font-medium">{cls.teacherName}</p>
                            <div className="mt-4 space-y-1.5">
                              <div className="flex justify-between text-xs font-medium text-slate-600">
                                <span>Lớp học mở</span>
                              </div>
                              <Progress value={100} className="h-2 bg-slate-100" indicatorClassName={color} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

        </div>

        {/* Row 3: Kết quả gần đây */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-500" /> Bài tập vừa có điểm
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gradedTasks.map((task: any) => (
              <Card key={task.id} className="border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                      {task.className}
                    </Badge>
                    <span className="text-xs font-medium text-slate-400">
                      {task.gradedAt ? formatDistanceToNow(new Date(task.gradedAt), { addSuffix: true, locale: vi }) : ''}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 line-clamp-2 mb-4 leading-tight">{task.title}</h3>
                  <div className="flex items-end justify-between mt-auto pt-2">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Điểm số</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-3xl font-black text-emerald-600">{task.score}</span>
                        <span className="text-sm font-bold text-slate-400">/{task.maxScore}</span>
                      </div>
                    </div>
                    <Link href={`/assignments/${task.id}?classCode=${task.classCode}`}>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 shadow-sm">
                        Xem chi tiết <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}

            {gradedTasks.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
                <p>Bạn chưa có bài tập nào được chấm điểm.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
