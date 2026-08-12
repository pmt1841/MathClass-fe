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

  /*
   * Kiểm tra cấu trúc token: chỉ coi là "hợp lệ" khi có đúng 3 phần (header.payload.signature)
   * và payload decode ra JSON hợp lệ. Token rác / không parse được → coi như CHƯA đăng nhập.
   * (Không thể verify chữ ký ở đây vì không có secret — verify thật nằm ở Backend API.)
   */
  let isTokenValid = false
  let userRole: string | null = null
  if (token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        const rawRole = payload.role || payload.userRole || payload.roles?.[0] || payload.authorities?.[0] || ''
        if (rawRole) {
          userRole = rawRole.replace('ROLE_', '')
        }
        isTokenValid = true
      }
    } catch (e) {
      console.error('Error decoding token in middleware', e)
    }
  }
  // Fallback: role từ cookie (cho token cũ chưa có claim role — sau khi Backend deploy claim role thì JWT là nguồn chính)
  if (!userRole) {
    userRole = request.cookies.get('mathclass_role')?.value || null
  }

  // Loại trừ trang /admin/login khỏi các protected & admin-only routes
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/')
  const isProtectedRoute = matchRoute(pathname, protectedRoutes) && !isAdminLogin
  const isAdminRoute = matchRoute(pathname, adminOnlyRoutes) && !isAdminLogin
  const isTeacherRoute = matchRoute(pathname, teacherOnlyRoutes)
  const isStudentRoute = matchRoute(pathname, studentOnlyRoutes)

  // Kiểm tra tham số lý do khóa tài khoản để cho phép truy cập trang login hiển thị Modal cảnh báo
  const isAccountLockedReason = request.nextUrl.searchParams.get('reason') === 'account_locked'

  // 1. Redirect chưa đăng nhập (không token HOẶC token rác/không parse được) khỏi protected routes
  if (isProtectedRoute && !isTokenValid) {
    const redirectUrl = isAdminRoute ? '/admin/login' : '/'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // 1b. Admin routes: FAIL-CLOSED — chỉ cho qua khi xác định được role ADMIN.
  //     Trước đây khi userRole = null (token rác/token không có claim role) thì check
  //     `userRole !== 'ADMIN'` bị bỏ qua → token rác vẫn vào được /admin/*. Đã sửa.
  if (isAdminRoute) {
    if (!isTokenValid) return NextResponse.redirect(new URL('/admin/login', request.url))
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(userRole ? '/forbidden' : '/admin/login', request.url))
    }
  }

  /*
   * TỰ ĐỘNG NHẬN PHIÊN ĐĂNG NHẬP (CROSS-TAB SESSION SHARING):
   * Nếu trình duyệt đã có Token hợp lệ (do Tab 1 đã đăng nhập), bất kể có tích "Giữ đăng nhập" hay không,
   * khi Tab 2 mở các đường dẫn công khai (/, /login, /admin/login, /signup), Middleware sẽ tự động
   * chuyển hướng Tab 2 vào Trang chủ (/home hoặc /admin/users).
   */
  if (!isAccountLockedReason && isTokenValid && (pathname === '/' || pathname === '/login' || pathname === '/admin/login' || pathname === '/signup')) {
    const dest = userRole === 'ADMIN' ? '/admin/users' : '/home'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  const fallbackUrl = '/home'

  // 3. Role-based access: teacher-only routes
  if (isTeacherRoute && isTokenValid && userRole && userRole !== 'TEACHER') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  // 4. Role-based access: student-only routes
  if (isStudentRoute && isTokenValid && userRole && userRole !== 'STUDENT') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  // 5. Role-based access: admin-only routes (bổ trợ cho check 1b — fail-closed)
  if (isAdminRoute && isTokenValid && userRole && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder|api/).*)',
  ],
}