import React from 'react'
import { Settings, Construction } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 mb-6">
        <Construction className="h-10 w-10 text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Cài đặt</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        Tính năng đang được phát triển. Vui lòng quay lại sau!
      </p>
    </div>
  )
}
