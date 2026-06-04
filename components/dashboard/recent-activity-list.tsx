import React from 'react'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export interface RecentActivity {
  id: number
  title: string
  time: string
  type: 'class' | 'assignment' | 'grade'
  status?: 'done' | 'pending'
}

interface RecentActivityListProps {
  activities: RecentActivity[]
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  return (
    <div className="lg:col-span-2 rounded-xl bg-white border border-border overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="font-bold text-foreground">Hoạt động gần đây</h2>
        <button className="flex items-center gap-1 text-sm text-primary hover:underline">
          Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
            <div className="mt-0.5 flex-shrink-0">
              {activity.status === 'done' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
            <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              activity.type === 'class'
                ? 'bg-primary/10 text-primary'
                : activity.type === 'assignment'
                ? 'bg-accent/10 text-accent'
                : 'bg-green-50 text-green-600'
            }`}>
              {activity.type === 'class' ? 'Lớp học' : activity.type === 'assignment' ? 'Bài tập' : 'Điểm số'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
