'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Trophy, Flame, Target, BookOpen, Star, ArrowRight, Bell } from 'lucide-react'
import Link from 'next/link'

export function StudentDashboardClient() {
  const [countdown, setCountdown] = useState('23:59:59')

  // Mock countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      // Just a mock display for the UI
      setCountdown('23:58:' + new Date().getSeconds().toString().padStart(2, '0'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex-1 space-y-6 px-8 pb-8 pt-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chào buổi sáng, Nam! 👋</h2>
          <p className="text-muted-foreground mt-1">Sẵn sàng hoàn thành mục tiêu học tập hôm nay chưa?</p>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 border-blue-200 dark:border-blue-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Điểm trung bình</CardTitle>
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">8.5/10</div>
            <Badge variant="secondary" className="mt-1 bg-blue-200/50 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200 hover:bg-blue-200/50">Học lực Giỏi</Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/40 border-orange-200 dark:border-orange-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Chuỗi ngày học (Streak)</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">12 ngày</div>
            <p className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-1">Tuyệt vời! Hãy giữ vững phong độ.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/40 dark:to-yellow-900/40 border-yellow-200 dark:border-yellow-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Bảng xếp hạng</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">Top 3</div>
            <p className="text-xs text-yellow-700/80 dark:text-yellow-300/80 mt-1">Toán Đại Số nâng cao 11A1</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lớp học tham gia</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <Link href="/classes">
              <p className="text-xs text-primary hover:underline mt-1 cursor-pointer">Xem tất cả lớp học</p>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Urgent Tasks */}
        <Card className="col-span-4 border-red-200 shadow-sm dark:border-red-900/50">
          <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <Clock className="h-5 w-5" /> Nhiệm vụ cần làm gấp
            </CardTitle>
            <CardDescription>Các bài tập sẽ hết hạn trong 24h tới.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-base">Bài tập: Đạo hàm cơ bản</p>
                  <p className="text-sm text-muted-foreground">Toán Đại Số nâng cao - 11A1</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                      Còn lại: {countdown}
                    </Badge>
                  </div>
                </div>
                <Link href="/classes/CLASS123/student">
                  <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">Làm bài ngay</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="mt-0.5 bg-green-100 dark:bg-green-900/40 p-2 rounded-full h-8 w-8 flex items-center justify-center">
                  <Star className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Giáo viên vừa chấm bài 'Hình học không gian'</p>
                  <p className="text-sm text-green-600 font-bold my-1">Điểm: 9.0/10</p>
                  <Link href="/classes/CLASS123/student">
                    <p className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer">
                      Xem lời phê <ArrowRight className="h-3 w-3" />
                    </p>
                  </Link>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-0.5 bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full h-8 w-8 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Thầy Nguyễn Trọng T. đăng thông báo mới</p>
                  <p className="text-xs text-muted-foreground my-1">Toán Đại Số 11A1</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">"Tuần sau chúng ta kiểm tra 1 tiết, các em ôn tập kỹ chương 2 nhé."</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
