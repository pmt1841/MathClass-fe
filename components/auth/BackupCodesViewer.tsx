'use client'

import React, { useState } from 'react'
import { Copy, Check, Download, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BackupCodesViewerProps {
  codes: string[]
  className?: string
}

export function BackupCodesViewer({ codes, className = '' }: BackupCodesViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAll = async () => {
    if (!codes || codes.length === 0) return
    const textToCopy = `=== MATHCLASS ADMIN BACKUP CODES ===\nNgày tạo: ${new Date().toLocaleString('vi-VN')}\n\n${codes
      .map((code, index) => `${index + 1}. ${code}`)
      .join('\n')}\n\nLƯU Ý: Mỗi mã dự phòng chỉ có giá trị sử dụng đúng 1 lần duy nhất.`

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Không thể sao chép mã dự phòng:', err)
    }
  }

  const handleDownloadTxt = () => {
    if (!codes || codes.length === 0) return
    const textContent = `=== MATHCLASS ADMIN BACKUP CODES ===\nNgày tạo: ${new Date().toLocaleString('vi-VN')}\n\n${codes
      .map((code, index) => `${index + 1}. ${code}`)
      .join('\n')}\n\nLƯU Ý: Mỗi mã dự phòng chỉ có giá trị sử dụng đúng 1 lần duy nhất để đăng nhập tài khoản Quản trị viên.`

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mathclass-admin-backup-codes-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Lưu ý quan trọng:</p>
          <p className="text-muted-foreground dark:text-amber-200/80 mt-0.5">
            Mỗi mã chỉ có thể sử dụng đúng <strong>1 lần</strong>. Hãy lưu danh sách này vào trình quản lý mật khẩu hoặc nơi an toàn phòng khi mất điện thoại.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 dark:bg-muted/20 rounded-xl border border-border/60">
        {codes.map((code, index) => (
          <div
            key={index}
            className="flex items-center justify-center font-mono font-bold tracking-widest text-xs sm:text-sm py-2 px-2.5 bg-background dark:bg-card rounded-md border border-border/50 text-foreground select-all shadow-xs"
          >
            {code}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          className="flex-1 text-xs gap-1.5 h-9"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đã sao chép tất cả</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Sao chép tất cả</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadTxt}
          className="flex-1 text-xs gap-1.5 h-9"
        >
          <Download className="w-4 h-4" />
          <span>Tải file .txt</span>
        </Button>
      </div>
    </div>
  )
}
