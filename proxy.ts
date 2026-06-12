import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/home', '/classes', '/assignments', '/students', '/reports', '/settings', '/profile']
const teacherOnlyRoutes = ['/classes/create', '/students', '/reports']
const studentOnlyRoutes = ['/assignments/submit']
const publicRoutes = ['/', '/login', '/signup', '/verify']

// Hàm tiện ích để kiểm tra chính xác đường dẫn tránh bị nuốt từ (ví dụ /students bắt đầu bằng /student)
const matchRoute = (pathname: string, routes: string[]) => {
  return routes.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('auth_token')?.value
  const userRole = request.cookies.get('user_role')?.value

  // SỬA: Sử dụng hàm matchRoute mới để kiểm tra chính xác
  const isProtectedRoute = matchRoute(pathname, protectedRoutes)
  const isTeacherRoute = matchRoute(pathname, teacherOnlyRoutes)
  const isStudentRoute = matchRoute(pathname, studentOnlyRoutes)
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // 1. Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Redirect authenticated users from public to their respective dashboards
  if (token && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  const fallbackUrl = '/home'

  // 3. Role-based access: teacher-only routes
  if (isTeacherRoute && token && userRole !== 'TEACHER') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  // 4. Role-based access: student-only routes
  if (isStudentRoute && token && userRole !== 'STUDENT') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder|api/).*)',
  ],
}