import React from 'react'
import Link from 'next/link'
import { PlusCircle, ClipboardList, BookOpen, TrendingUp, Clock, ArrowRight } from 'lucide-react'

export function QuickActionLink({
  href,
  icon: Icon,
  label,
  desc,
  color,
}: {
  href: string
  icon: React.ElementType
  label: string
  desc: string
  color: string
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary/10 group-hover:bg-primary/20', text: 'text-primary' },
    accent: { bg: 'bg-accent/10 group-hover:bg-accent/20', text: 'text-accent' },
    green: { bg: 'bg-green-50 group-hover:bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-orange-50 group-hover:bg-orange-100', text: 'text-orange-500' },
  }
  const c = colorMap[color] || colorMap.primary

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-4 hover:bg-muted/50 transition-colors group"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${c.bg}`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

interface QuickActionsProps {
  isTeacher: boolean
  onCreateClass: () => void
}

export function QuickActions({ isTeacher, onCreateClass }: QuickActionsProps) {
  return (
    <div className="rounded-xl bg-white border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-bold text-foreground">Thao tác nhanh</h2>
      </div>
      <div className="p-4 space-y-2">
        {isTeacher ? (
          <>
            <button
              onClick={onCreateClass}
              className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 p-4 text-left hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <PlusCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tạo lớp học</p>
                <p className="text-xs text-muted-foreground">Mở lớp học mới</p>
              </div>
            </button>
            <QuickActionLink href="/assignments/create" icon={ClipboardList} label="Giao bài tập" desc="Tạo bài tập mới" color="accent" />
            <QuickActionLink href="/students" icon={BookOpen} label="Quản lý học sinh" desc="Xem danh sách" color="green" />
            <QuickActionLink href="/reports" icon={TrendingUp} label="Xem báo cáo" desc="Thống kê lớp học" color="orange" />
          </>
        ) : (
          <>
            <QuickActionLink href="/assignments/submit" icon={ClipboardList} label="Nộp bài tập" desc="Nộp bài đang làm" color="accent" />
            <QuickActionLink href="/classes" icon={BookOpen} label="Vào lớp học" desc="Xem bài học mới" color="primary" />
            <QuickActionLink href="/assignments" icon={TrendingUp} label="Xem điểm số" desc="Kết quả bài làm" color="green" />
            <QuickActionLink href="/profile" icon={Clock} label="Lịch sử học tập" desc="Theo dõi tiến độ" color="orange" />
          </>
        )}
      </div>
    </div>
  )
}
