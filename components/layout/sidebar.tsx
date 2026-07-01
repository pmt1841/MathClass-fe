'use client'

import {
  Home,
  BookOpen,
  ClipboardList,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

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
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  
  const userRole = user?.role || 'STUDENT'

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole as 'TEACHER' | 'STUDENT')
  )

  const isActive = (href: string) => {
    if (href === '/' || href === '/home') {
      return pathname === href;
    }

    if (pathname.includes('/submissions')) {
      if (href === '/classes') return true;
      if (href === '/assignments') return false;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
        }`}
    >
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
    </aside>
  )
}
