import React from 'react'

export function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string
  value: string
  sub: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-white shadow-sm overflow-hidden p-4 flex items-center gap-3 h-full">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
        {icon}
      </div>
      <p className="text-sm font-bold text-muted-foreground flex-1">{label}:</p>
      <div className="flex items-baseline gap-1">
        <p className="text-xl font-extrabold text-foreground leading-none">{value}</p>
        <p className="text-sm text-muted-foreground font-medium">{sub}</p>
      </div>
    </div>
  )
}
