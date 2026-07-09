'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Trophy, Flame, BookOpen, Star, ArrowRight, PlayCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import { isPast } from 'date-fns'
import { parseDateSafe, formatDistanceToNowSafe } from '@/lib/utils'

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

  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['student-pending-tasks'],
    queryFn: () => dashboardApi.getStudentPendingTasks(5),
  })

  const { data: gradedTasks = [] } = useQuery({
    queryKey: ['student-graded-tasks'],
    queryFn: () => dashboardApi.getStudentGradedTasks(5),
  })

  // Filter and sort pending tasks
  const sortedPendingTasks = React.useMemo(() => {
    // 1. Filter out past due tasks
    const validTasks = pendingTasks.filter((task: any) => {
      if (!task.deadline) return true;
      const d = parseDateSafe(task.deadline);
      return d ? !isPast(d) : true;
    });

    // 2. Sort by deadline (closest first)
    return validTasks.sort((a: any, b: any) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1; // Put tasks without deadline at the end
      if (!b.deadline) return -1;
      const da = parseDateSafe(a.deadline);
      const db = parseDateSafe(b.deadline);
      if (!da || !db) return 0;
      return da.getTime() - db.getTime();
    });
  }, [pendingTasks]);

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen">
      {/* Inline Topbar (Page Header) */}
      <div className="border-b border-border bg-white py-6 shadow-sm">
        <div className="mx-auto max-w-screen-2xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{greeting}! 👋</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Hôm nay bạn có <span className="font-bold text-orange-600">{sortedPendingTasks.length} bài tập</span> cần hoàn thành. Cố lên nhé!
            </p>
          </div>
        </div>
      </div>

      <main className="p-6 space-y-8 max-w-screen-2xl mx-auto">

        {/* Row 1: Thống kê cá nhân (3 Cards) */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="border-0 shadow-md shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Số lớp tham gia</CardTitle>
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800">{statsLoading ? '-' : stats?.joinedClasses ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bài đã chấm xong</CardTitle>
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <Star className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800">{statsLoading ? '-' : stats?.completedTasks ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-orange-500/20 bg-gradient-to-br from-orange-500 to-rose-500 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-60 -mr-10 -mt-10 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-orange-50 uppercase tracking-wider">Bài tập cần làm</CardTitle>
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Flame className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-white">{statsLoading ? '-' : sortedPendingTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Việc cần làm ngay & Kết quả */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">

          {/* Cột trái (65%): Bài tập cần làm */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-500" /> Bài tập cần làm
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 font-bold px-2 py-0.5 rounded-full ml-1">
                {sortedPendingTasks.length}
              </Badge>
            </h2>
            <div className="space-y-4">
              {sortedPendingTasks.map((task: any, index: number) => {
                const deadlineDate = task.deadline ? parseDateSafe(task.deadline) : null
                const isUrgent = deadlineDate ? (deadlineDate.getTime() - Date.now() < 24 * 60 * 60 * 1000) : false

                // Highlight the absolute first task if it's urgent
                const isTopPriority = index === 0 && isUrgent;

                return (
                  <Card key={task.id} className={`border-0 shadow-md transition-all hover:shadow-lg group overflow-hidden ${isTopPriority ? 'shadow-orange-500/20 bg-gradient-to-r from-orange-50 to-white ring-1 ring-orange-200' : 'shadow-slate-200/50 bg-white'}`}>
                    {isTopPriority && (
                      <div className="bg-orange-500 text-white text-xs font-bold uppercase tracking-wider text-center py-1.5 shadow-sm">
                        Hạn chót đang đến rất gần!
                      </div>
                    )}
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${isTopPriority ? 'border-orange-200 text-orange-700 bg-orange-100/50' : 'border-blue-200 text-blue-700 bg-blue-50/50'} font-semibold`}>
                            {task.className}
                          </Badge>
                          <h3 className={`font-bold text-lg ${isTopPriority ? 'text-orange-900' : 'text-slate-800'}`}>{task.title}</h3>
                        </div>
                        <div className="flex items-center gap-5 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-slate-400" /> {task.type}
                          </span>
                          <span className={`flex items-center gap-1.5 ${isUrgent ? 'text-orange-600 font-semibold bg-orange-100 px-2 py-1 rounded-md shadow-sm' : ''}`}>
                            <Clock className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-slate-400'}`} /> {deadlineDate ? `Còn ${formatDistanceToNowSafe(deadlineDate)}` : 'Không có hạn'}
                          </span>
                        </div>
                      </div>
                      <Link href={`/assignments/${task.id}?classCode=${task.classCode}`} className="shrink-0 w-full sm:w-auto">
                        <Button className={`w-full sm:w-auto shadow-sm font-medium px-6 py-5 rounded-xl ${isTopPriority ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white opacity-90 hover:opacity-100'}`}>
                          <PlayCircle className="w-5 h-5 mr-2" /> Làm bài ngay
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}

              {sortedPendingTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-md shadow-slate-200/50">
                  <div className="p-4 bg-emerald-50 rounded-full mb-4">
                    <Trophy className="w-10 h-10 text-emerald-500" />
                  </div>
                  <p className="font-semibold text-slate-800 text-xl">Tuyệt vời!</p>
                  <p className="text-slate-500 mt-1">Bạn đã hoàn thành mọi bài tập được giao.</p>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải (35%): Bài tập vừa có điểm */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Star className="w-6 h-6 text-emerald-500 fill-emerald-500/20" /> Vừa có điểm
              </h2>
            </div>
            <div className="space-y-4">
              {gradedTasks.map((task: any) => (
                <Card key={task.id} className="relative border-0 shadow-md shadow-slate-200/40 bg-white hover:shadow-lg transition-all group overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 z-10"></div>
                  <CardContent className="p-0">
                    <div className="p-4 flex gap-3 items-center">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0">
                            {task.className}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight mb-1">{task.title}</h3>
                        <span className="text-[11px] font-medium text-slate-400 block">
                          {task.gradedAt ? formatDistanceToNowSafe(task.gradedAt, { addSuffix: true }) : ''}
                        </span>
                      </div>

                      {/* Score Badge */}
                      <div className="flex-shrink-0 flex flex-col items-end">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-3xl font-black text-emerald-600 leading-none">{task.score}</span>
                          <span className="text-sm font-bold text-emerald-600/50">/{task.maxScore}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Đã hoàn thành</span>
                      <Link href={`/assignments/${task.id}?classCode=${task.classCode}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5">
                          Chi tiết <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {gradedTasks.length === 0 && (
                <div className="text-center py-10 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
                  <p className="text-sm font-medium">Chưa có bài tập nào được chấm điểm.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
