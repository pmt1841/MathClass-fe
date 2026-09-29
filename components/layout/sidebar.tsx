'use client'

import {
  Home,
  BookOpen,
  ClipboardList,
  Users,
  ChevronLeft,
  ChevronRight,
  Library,
  Zap,
  AlertTriangle,
  Shield,
  FileText,
  Cpu,
  LayoutDashboard,
  CreditCard,
  HardDrive,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadChatClasses } from '@/hooks/useUnreadChatClasses'
import { ReportBugModal } from '@/components/bug-report/ReportBugModal'
import { useI18n } from '@/lib/i18n/i18n-context'

export interface NavItem {

  icon: React.ElementType
  label: string
  href: string
  roles?: ('TEACHER' | 'STUDENT' | 'ADMIN')[]
  permission?: string
  badge?: string
  isAction?: boolean
}

export const adminNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Tổng quan',
    href: '/admin',
    permission: 'dashboard:admin_view',
  },
  {
    icon: Users,
    label: 'Quản lý Người dùng',
    href: '/admin/users',
  },
  {
    icon: Shield,
    label: 'Quản lý Quyền hạn',
    href: '/admin/roles',
  },
  {
    icon: Cpu,
    label: 'Cấu hình Dịch vụ AI',
    href: '/admin/ai-config',
  },
  {
    icon: CreditCard,
    label: 'Cổng VietQR & Đơn nạp',
    href: '/admin/payments',
  },
  {
    icon: FileText,
    label: 'Nhật ký hệ thống',
    href: '/admin/logs',
  },
  {
    icon: HardDrive,
    label: 'Quản lý Lưu trữ',
    href: '/admin/storage',
  },
  {
    icon: AlertTriangle,
    label: 'Quản lý Báo cáo lỗi',
    href: '/admin/bug-reports',
  },
]

const navItems: NavItem[] = [
  {
    icon: Home,
    label: 'Tổng quan',
    href: '/home',
  },
  {
    icon: BookOpen,
    label: 'Lớp học của tôi',
    href: '/classes',
  },
  {
    icon: ClipboardList,
    label: 'Kho bài tập',
    href: '/assignments',
  },
  {
    icon: Library,
    label: 'Thư viện bài tập',
    href: '/library',
    permission: 'library:read',
  },
  {
    icon: Zap,
    label: 'Nạp credit AI',
    href: '/credits',
  },
  {
    icon: AlertTriangle,
    label: 'Báo cáo sự cố',
    href: '#report-bug',
    isAction: true,
  },
]

interface SidebarProps {
  onCreateClass?: () => void
  customNavItems?: NavItem[]
}

export function Sidebar({ onCreateClass, customNavItems }: SidebarProps = {}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const { user } = useAuth()
  const { hasAnyUnread } = useUnreadChatClasses()
  const { t } = useI18n()

  const getTranslatedLabel = (item: NavItem) => {
    if (item.href === '/home' || item.href === '/admin') return t('sidebar.overview')
    if (item.href === '/classes') return t('sidebar.myClasses')
    if (item.href === '/assignments') return t('sidebar.assignmentBank')
    if (item.href === '/library') return t('sidebar.sharedLibrary')
    if (item.href === '/credits') return t('sidebar.aiCredits')
    if (item.href === '#report-bug') return t('sidebar.bugReport')
    if (item.href === '/admin/users') return t('Quản lý Người dùng')
    if (item.href === '/admin/roles') return t('Quản lý Quyền hạn')
    if (item.href === '/admin/ai-config') return t('Cấu hình Dịch vụ AI')
    if (item.href === '/admin/logs') return t('Nhật ký hệ thống')
    if (item.href === '/admin/storage') return t('Quản lý Lưu trữ')
    if (item.href === '/admin/bug-reports') return t('Quản lý Báo cáo lỗi')
    return t(item.label)
  }



  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      } else {
        setCollapsed(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const userRole = user?.role || (user as any)?.userRole || 'STUDENT'
  const defaultItems = userRole === 'ADMIN' ? adminNavItems : navItems
  const itemsToRender = customNavItems || defaultItems

  const visibleItems = itemsToRender.filter((item) => {
    if (item.roles && !item.roles.includes(userRole as 'TEACHER' | 'STUDENT' | 'ADMIN')) return false
    if (item.permission) {
      const hasPerm = user?.permissions?.includes(item.permission) ?? false
      if (!hasPerm) return false
    }
    return true
  })

  const isActive = (href: string) => {
    if (href === '/' || href === '/home' || href === '/admin') {
      return pathname === href
    }

    if (pathname.includes('/submissions')) {
      if (href === '/classes') return true
      if (href === '/assignments') return false
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <aside
        className={`relative flex flex-col bg-white border-r border-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
          }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white shadow-sm hover:bg-muted transition-colors cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = !item.isAction && isActive(item.href)
            const isClassesItem = item.href === '/classes'
            const label = getTranslatedLabel(item)

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all w-full text-left cursor-pointer ${collapsed ? 'justify-center' : ''
                    } text-muted-foreground hover:bg-destructive/10 hover:text-destructive`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0 text-destructive" />
                  {!collapsed && <span className="flex-1 font-semibold">{label}</span>}
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''
                  } ${active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                  {collapsed && isClassesItem && hasAnyUnread && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>
                {!collapsed && <span className="flex-1">{label}</span>}

                {!collapsed && isClassesItem && hasAnyUnread && (
                  <span className="relative flex h-2.5 w-2.5 ml-auto">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span className="rounded-full bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Modal Báo cáo sự cố hệ thống */}
      <ReportBugModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        defaultEmail={user?.email || ''}
        defaultName={user?.fullName || ''}
        isAuthenticated={!!user}
      />
    </>
  )
}
