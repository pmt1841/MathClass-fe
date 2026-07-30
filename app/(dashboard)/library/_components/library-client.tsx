'use client'

import { useState, useEffect, useMemo } from 'react'
import { Library, Search, BookOpen, Layers, Loader2, BookX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { AssignmentCard } from '@/app/(dashboard)/assignments/_components/assignment-card'
import { CloneConfirmDialog, CloneTarget } from './clone-confirm-dialog'
import { useLibraryAssignments, useLibrarySheets } from '@/hooks/useLibrary'
import { useAuth } from '@/hooks/useAuth'
import { AssignmentSheet } from '@/hooks/useAssignments'

type LibraryTab = 'SINGLE' | 'SHEET'

const TABS: { key: LibraryTab; label: string; icon: React.ElementType }[] = [
  { key: 'SINGLE', label: 'Bài đơn lẻ', icon: BookOpen },
  { key: 'SHEET', label: 'Phiếu bài tập', icon: Layers },
]

export function LibraryClient() {
  const { user } = useAuth()
  const userRole = user?.role ?? 'TEACHER'

  const [activeTab, setActiveTab] = useState<LibraryTab>('SINGLE')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [cloneTarget, setCloneTarget] = useState<CloneTarget | null>(null)

  // Debounce search input 500ms + reset trang về 0 khi search mới
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(0)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset trang và search về 0 khi đổi tab
  useEffect(() => {
    setPage(0)
    setSearchInput('')
    setSearchQuery('')
  }, [activeTab])

  const queryParams = useMemo(
    () => ({ keyword: searchQuery || undefined, page, size: 12 }),
    [searchQuery, page]
  )

  // Mỗi query chỉ enabled khi đúng tab đang active — không chạy song song
  const {
    data: assignmentPage,
    isLoading: loadingAssignments,
  } = useLibraryAssignments({ ...queryParams, enabled: activeTab === 'SINGLE' })

  const {
    data: sheetPage,
    isLoading: loadingSheets,
  } = useLibrarySheets({ ...queryParams, enabled: activeTab === 'SHEET' })

  const isLoading = activeTab === 'SINGLE' ? loadingAssignments : loadingSheets
  const currentPage = activeTab === 'SINGLE' ? assignmentPage : sheetPage
  const items = (currentPage?.content ?? []) as AssignmentSheet[]
  const totalPages = currentPage?.totalPages ?? 0

  const handleCloneClick = (id: number, title: string, isSheet: boolean, authorName?: string) => {
    setCloneTarget({ id, title, isSheet, authorName })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Thư viện dùng chung</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Khám phá và clone bài tập từ cộng đồng giáo viên
            </p>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="flex gap-1 rounded-xl bg-muted/60 p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Search ─────────────────────────────────────────────────── */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề..."
            className="pl-9"
            id="library-search"
          />
        </div>

        {/* ── Content ────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <BookX className="h-12 w-12 opacity-30" />
            <p className="text-sm">
              {searchQuery
                ? `Không tìm thấy kết quả cho "${searchQuery}"`
                : 'Chưa có bài tập nào được chia sẻ công khai.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, index) => (
              <AssignmentCard
                key={item.id}
                assignment={item}
                userRole={userRole}
                activeTab={activeTab}
                index={index}
                mode="library"
                onClone={handleCloneClick}
                onEdit={() => {}}
                onDelete={() => {}}
                onPublish={() => {}}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <span className="text-sm text-muted-foreground">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* ── Clone Dialog ───────────────────────────────────────────────── */}
      {cloneTarget && (
        <CloneConfirmDialog
          target={cloneTarget}
          onClose={() => setCloneTarget(null)}
        />
      )}
    </div>
  )
}
