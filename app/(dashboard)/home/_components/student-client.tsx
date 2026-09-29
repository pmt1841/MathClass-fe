'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Trophy, Flame, BookOpen, Star, ArrowRight, PlayCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { RefreshButton } from '@/components/ui/refresh-button'
import { dashboardService } from '@/services/dashboardService'
import { isPast } from 'date-fns'
import { parseDateSafe, formatDistanceToNowSafe } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

export function StudentDashboardClient() {
  const { t } = useI18n()
  const [greetingKey, setGreetingKey] = useState('Chào bạn')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingKey('Chào buổi sáng')
    else if (hour < 18) setGreetingKey('Chào buổi chiều')
    else setGreetingKey('Chào buổi tối')
  }, [])

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['student-stats'],
    queryFn: dashboardService.getStudentStats,
    staleTime: 2 * 60 * 1000,
  })

  const { data: pendingTasks = [], refetch: refetchPending } = useQuery({
    queryKey: ['student-pending-tasks'],
    queryFn: () => dashboardService.getStudentPendingTasks(5),
    staleTime: 2 * 60 * 1000,
  })

  const { data: gradedTasks = [], refetch: refetchGraded } = useQuery({
    queryKey: ['student-graded-tasks'],
    queryFn: () => dashboardService.getStudentGradedTasks(5),
    staleTime: 2 * 60 * 1000,
  })

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchPending(),
      refetchGraded(),
    ])
  }

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
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t(greetingKey)}! 👋</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {t('Hôm nay bạn có {count} bài tập cần hoàn thành. Cố lên nhé!', {
                count: sortedPendingTasks.length
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={handleRefresh}
              title={t('Làm mới bảng điều khiển')}
            />
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto w-full">

        {/* Row 1: Thống kê cá nhân (3 Cards) - Chữ và số trên cùng 1 dòng, viền mép trên */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Số lớp tham gia */}
          <Card className="border-0 shadow-sm shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden py-3 px-4 gap-0 justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {t('Số lớp tham gia')}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight shrink-0">
                {statsLoading ? '-' : stats?.joinedClasses ?? 0}
              </span>
            </div>
          </Card>

          {/* Card 2: Bài đã chấm xong */}
          <Card className="border-0 shadow-sm shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden py-3 px-4 gap-0 justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {t('Bài đã chấm xong')}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight shrink-0">
                {statsLoading ? '-' : stats?.completedTasks ?? 0}
              </span>
            </div>
          </Card>

          {/* Card 3: Bài tập cần làm */}
          <Card className="border-0 shadow-md shadow-orange-500/20 bg-gradient-to-br from-orange-500 to-rose-500 hover:shadow-lg transition-all hover:-translate-y-0.5 relative overflow-hidden group py-3 px-4 gap-0 justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-60 -mr-10 -mt-10 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                  <Clock className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-xs font-bold text-orange-100 uppercase tracking-wider truncate">
                  {t('Bài tập cần làm')}
                </span>
              </div>
              <span className="text-2xl font-black text-white tracking-tight shrink-0">
                {statsLoading ? '-' : sortedPendingTasks.length}
              </span>
            </div>
          </Card>
        </div>

        {/* Row 2: Việc cần làm ngay & Kết quả */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">

          {/* Cột trái (65%): Bài tập cần làm */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 min-h-10">
              <Clock className="w-5 h-5 text-orange-500" /> {t('Bài tập cần làm')}
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 font-bold px-2 py-0.5 rounded-full ml-1 text-xs">
                {sortedPendingTasks.length}
              </Badge>
            </h2>
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1.5">
              {sortedPendingTasks.map((task: any, index: number) => {
                const deadlineDate = task.deadline ? parseDateSafe(task.deadline) : null
                const isUrgent = deadlineDate ? (deadlineDate.getTime() - Date.now() < 24 * 60 * 60 * 1000) : false

                // Highlight the absolute first task if it's urgent
                const isTopPriority = index === 0 && isUrgent;

                return (
                  <Card key={task.id} className={`border-0 shadow-md transition-all hover:shadow-lg group overflow-hidden ${isTopPriority ? 'shadow-orange-500/20 bg-gradient-to-r from-orange-50 to-white ring-1 ring-orange-200' : 'shadow-slate-200/50 bg-white'}`}>
                    {isTopPriority && (
                      <div className="bg-orange-500 text-white text-xs font-bold uppercase tracking-wider text-center py-1.5 shadow-sm">
                        {t('Hạn chót đang đến rất gần!')}
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
                            <Clock className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-slate-400'}`} /> {deadlineDate ? t('Còn {time}', { time: formatDistanceToNowSafe(deadlineDate) }) : t('Không có hạn')}
                          </span>
                        </div>
                      </div>
                      <Link href={`/assignments/${task.id}?classCode=${task.classCode}`} className="shrink-0 w-full sm:w-auto">
                        <Button className={`w-full sm:w-auto shadow-sm font-medium px-6 py-5 rounded-xl ${isTopPriority ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white opacity-90 hover:opacity-100'}`}>
                          <PlayCircle className="w-5 h-5 mr-2" /> {t('Làm bài ngay')}
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
                  <p className="font-semibold text-slate-800 text-xl">{t('Tuyệt vời!')}</p>
                  <p className="text-slate-500 mt-1">{t('Bạn đã hoàn thành mọi bài tập được giao.')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải (35%): Bài tập vừa có điểm */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between min-h-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-500 fill-emerald-500/20" /> {t('Vừa có điểm')}
              </h2>
            </div>
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1.5">
              {gradedTasks.map((task: any) => (
                <Card key={task.id} className="relative border-0 shadow-md shadow-slate-200/40 bg-white hover:shadow-lg transition-all group overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 z-10"></div>
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
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {t('Đã hoàn thành')}
                      </span>
                      <Link href={`/assignments/${task.id}?classCode=${task.classCode}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5">
                          {t('Chi tiết')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {gradedTasks.length === 0 && (
                <div className="text-center py-10 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
                  <p className="text-sm font-medium">{t('Chưa có bài tập nào được chấm điểm.')}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
