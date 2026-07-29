import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/home', '/classes', '/assignments', '/students', '/reports', '/settings', '/profile', '/admin']
const teacherOnlyRoutes = ['/classes/create', '/students', '/reports']
const studentOnlyRoutes = ['/assignments/submit']
const adminOnlyRoutes = ['/admin']
const publicRoutes = ['/', '/login', '/admin/login', '/signup', '/verify']

// Hàm tiện ích để kiểm tra chính xác đường dẫn tránh bị nuốt từ
const matchRoute = (pathname: string, routes: string[]) => {
  return routes.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('mathclass_jwt')?.value

  // Đọc role từ cookie mathclass_role hoặc từ token payload (nếu có)
  let userRole: string | null = request.cookies.get('mathclass_role')?.value || null
  if (!userRole && token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        const rawRole = payload.role || payload.userRole || payload.roles?.[0] || payload.authorities?.[0] || ''
        if (rawRole) {
          userRole = rawRole.replace('ROLE_', '')
        }
      }
    } catch (e) {
      console.error('Error decoding token in middleware', e)
    }
  }

  // Loại trừ trang /admin/login khỏi các protected & admin-only routes
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/')
  const isProtectedRoute = matchRoute(pathname, protectedRoutes) && !isAdminLogin
  const isAdminRoute = matchRoute(pathname, adminOnlyRoutes) && !isAdminLogin
  const isTeacherRoute = matchRoute(pathname, teacherOnlyRoutes)
  const isStudentRoute = matchRoute(pathname, studentOnlyRoutes)

  // Kiểm tra tham số lý do khóa tài khoản để cho phép truy cập trang login hiển thị Modal cảnh báo
  const isAccountLockedReason = request.nextUrl.searchParams.get('reason') === 'account_locked'

  // 1. Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !token) {
    const redirectUrl = isAdminRoute ? '/admin/login' : '/'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // 1b. Admin routes: must be logged in. Only redirect to forbidden if userRole is explicitly non-ADMIN.
  if (isAdminRoute) {
    if (!token) return NextResponse.redirect(new URL('/admin/login', request.url))
    if (userRole && userRole !== 'ADMIN') return NextResponse.redirect(new URL('/forbidden', request.url))
  }

  /*
   * XỬ LÝ VÒNG LẶP CHUYỂN HƯỚNG (INFINITE REDIRECT LOOP):
   * Không chuyển hướng tự động người dùng từ /login về /home nếu URL chứa ?reason=account_locked.
   * Điều này đảm bảo người dùng bị khóa tài khoản giữ nguyên ở trang Login để xem Modal Cảnh báo.
   */
  if (!isAccountLockedReason && token && (pathname === '/' || pathname === '/login' || pathname === '/admin/login' || pathname === '/signup')) {
    const dest = userRole === 'ADMIN' ? '/admin/users' : '/home'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  const fallbackUrl = '/home'

  // 3. Role-based access: teacher-only routes
  if (isTeacherRoute && token && userRole && userRole !== 'TEACHER') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  // 4. Role-based access: student-only routes
  if (isStudentRoute && token && userRole && userRole !== 'STUDENT') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  // 5. Role-based access: admin-only routes
  if (isAdminRoute && token && userRole && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder|api/).*)',
  ],
}