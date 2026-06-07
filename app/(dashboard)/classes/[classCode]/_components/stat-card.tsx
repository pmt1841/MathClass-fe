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
    <div className="relative rounded-2xl border border-border bg-white shadow-sm overflow-hidden p-4 flex flex-col gap-3">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-extrabold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{sub}</p>
      </div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">{label}</p>
    </div>
  )
}
