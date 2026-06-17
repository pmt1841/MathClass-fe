'use client'

import { Calculator } from 'lucide-react'

export function DashboardFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-screen-xl px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Calculator className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Math Class</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Math Class. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Hỗ trợ</a>
            <a href="#" className="hover:text-primary transition-colors">Chính sách</a>
            <a href="#" className="hover:text-primary transition-colors">Điều khoản</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
