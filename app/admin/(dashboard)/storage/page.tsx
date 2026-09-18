'use client'

import React from 'react'
import { HardDrive } from 'lucide-react'
import { StorageCleanupCard } from './_components/StorageCleanupCard'

export default function AdminStoragePage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* ── Synchronized Admin Header ── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <HardDrive className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Quản lý Lưu trữ
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý dung lượng hình ảnh, cấu hình lịch tự động quét dọn.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">
          <StorageCleanupCard />
        </div>
      </div>
    </div>
  )
}
