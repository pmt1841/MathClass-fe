import React from 'react'

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="h-4 w-96 bg-muted/60 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-muted rounded-lg" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-card border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-32 bg-muted rounded-md" />
            <div className="h-4 w-40 bg-muted/60 rounded" />
          </div>
        ))}
      </div>

      {/* Middle Bento Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 rounded-xl bg-card border p-6 space-y-4">
          <div className="h-6 w-52 bg-muted rounded" />
          <div className="h-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-96 rounded-xl bg-card border p-6 space-y-4">
          <div className="h-6 w-44 bg-muted rounded" />
          <div className="space-y-3 pt-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-12 bg-muted/40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table skeleton */}
      <div className="h-80 rounded-xl bg-card border p-6 space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((k) => (
            <div key={k} className="h-10 bg-muted/30 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
