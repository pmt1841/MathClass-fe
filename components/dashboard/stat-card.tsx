import React from 'react'

export interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  bgColor: string
}

export function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}
