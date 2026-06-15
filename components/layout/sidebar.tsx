'use client'

import {
  Home,
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  Users,
  PlusCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  roles?: ('TEACHER' | 'STUDENT')[]
  badge?: string
}

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
  // {
  //   icon: FileText,
  //   label: 'Nộp bài',
  //   href: '/assignments/submit',
  //   roles: ['STUDENT'],
  // },
  {
    icon: Users,
    label: 'Quản lý học sinh',
    href: '/students',
    roles: ['TEACHER'],
  },
  {
    icon: BarChart3,
    label: 'Báo cáo & Thống kê',
    href: '/reports',
    roles: ['TEACHER'],
  },
  {
    icon: Settings,
    label: 'Cài đặt',
    href: '/settings',
  },
]

interface SidebarProps {
  onCreateClass?: () => void
}

export function Sidebar({ onCreateClass }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const stored =
      sessionStorage.getItem('user_info') ||
      localStorage.getItem('user_info')
    if (stored) {
      try {
        const info = JSON.parse(stored)
        setUserRole(info.role || info.userRole || 'STUDENT')
      } catch { }
    }
  }, [])

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole as 'TEACHER' | 'STUDENT')
  )

  const isActive = (href: string) => {
    // Nếu là trang chủ, bắt buộc pathname phải giống hệt href (khớp tuyệt đối)
    if (href === '/' || href === '/home') {
      return pathname === href;
    }

    if (pathname.includes('/submissions')) {
      if (href === '/classes') return true;
      if (href === '/assignments') return false;
    }

    // Với các trang khác, chỉ active nếu pathname khớp hoàn toàn 
    // HOẶC pathname là trang con của href (ví dụ /assignments/123 là con của /assignments)
    // nhưng phải đảm bảo không bị nhận diện nhầm sang các nhánh khác
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
        }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white shadow-sm hover:bg-muted transition-colors"
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
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''
                } ${active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
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

      {/* Role indicator at bottom
      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
            userRole === 'TEACHER' ? 'bg-accent/10' : 'bg-primary/10'
          }`}>
            <div className={`h-2 w-2 rounded-full ${
              userRole === 'TEACHER' ? 'bg-accent' : 'bg-primary'
            }`} />
            <span className={`text-xs font-semibold ${
              userRole === 'TEACHER' ? 'text-accent' : 'text-primary'
            }`}>
              {userRole === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
            </span>
          </div>
        </div>
      )} */}
    </aside>
  )
}
