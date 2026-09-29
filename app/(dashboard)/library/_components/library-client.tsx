'use client'

import { useState, useEffect, useMemo } from 'react'
import { Library, Search, BookOpen, Layers, BookX } from 'lucide-react'
import { RefreshButton } from '@/components/ui/refresh-button'
import { toast } from 'sonner'
import { AssignmentCard } from '@/app/(dashboard)/assignments/_components/assignment-card'
import { CloneConfirmDialog, CloneTarget } from './clone-confirm-dialog'
import { LibraryAssignmentDetailModal } from './library-assignment-detail-modal'
import { useLibraryAssignments, useLibrarySheets } from '@/hooks/useLibrary'
import { useAuth } from '@/hooks/useAuth'
import { AssignmentSheet } from '@/hooks/useAssignments'
import { useI18n } from '@/lib/i18n/i18n-context'

type LibraryTab = 'SINGLE' | 'SHEET'

export function LibraryClient() {
  const { t } = useI18n()
  const { user } = useAuth()
  const userRole = user?.role ?? 'TEACHER'

  const [activeTab, setActiveTab] = useState<LibraryTab>('SINGLE')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [cloneTarget, setCloneTarget] = useState<CloneTarget | null>(null)
  const [previewAssignmentId, setPreviewAssignmentId] = useState<number | null>(null)

  const tabs = useMemo<{ key: LibraryTab; label: string; icon: React.ElementType }[]>(() => [
    { key: 'SINGLE', label: t('library.singleTab'), icon: BookOpen },
    { key: 'SHEET', label: t('library.sheetTab'), icon: Layers },
  ], [t])

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
    refetch: refetchAssignments,
  } = useLibraryAssignments({ ...queryParams, enabled: activeTab === 'SINGLE' })

  const {
    data: sheetPage,
    isLoading: loadingSheets,
    refetch: refetchSheets,
  } = useLibrarySheets({ ...queryParams, enabled: activeTab === 'SHEET' })

  const isLoading = activeTab === 'SINGLE' ? loadingAssignments : loadingSheets
  const currentPage = activeTab === 'SINGLE' ? assignmentPage : sheetPage
  const items = (currentPage?.content ?? []) as AssignmentSheet[]
  const totalPages = currentPage?.totalPages ?? 0

  const handleCloneClick = (id: number, title: string, isSheet: boolean, authorName?: string) => {
    setCloneTarget({ id, title, isSheet, authorName })
  }

  const handleRefresh = () => {
    const activeRefetch = activeTab === 'SINGLE' ? refetchAssignments : refetchSheets
    activeRefetch()
      .then(() => toast.success(t('library.refreshed')))
      .catch(() => toast.error(t('library.refreshFailed')))
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Library className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('library.title')}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('library.subheading')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={handleRefresh}
              iconOnly
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 w-full">

          {/* ── Search & Tabs Toolbar ─────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('library.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-white text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                id="library-search"
              />
            </div>

            <div className="flex bg-slate-200/60 p-1 rounded-xl items-center gap-1 shrink-0">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === key
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content ────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-2xl border border-border bg-white p-6 shadow-sm animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
                    <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-border rounded-2xl text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <BookX className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {searchQuery ? t('library.notFound') : t('library.empty')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery
                  ? t('library.notFoundDesc', { query: searchQuery })
                  : t('library.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item, index) => (
                <AssignmentCard
                  key={item.id}
                  assignment={item}
                  userRole={userRole}
                  activeTab={activeTab}
                  index={index}
                  mode="library"
                  onClone={handleCloneClick}
                  onPreview={(id) => setPreviewAssignmentId(id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onPublish={() => {}}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {t('library.prev')}
              </button>
              <span className="text-sm text-muted-foreground font-medium px-2">
                {t('library.pageInfo', { page: page + 1, total: totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {t('library.next')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ───────────────────────────────────────────────── */}
      <LibraryAssignmentDetailModal
        assignmentId={previewAssignmentId}
        onClose={() => setPreviewAssignmentId(null)}
        onClone={handleCloneClick}
      />

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

