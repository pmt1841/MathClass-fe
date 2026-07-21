import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/home', '/classes', '/assignments', '/students', '/reports', '/settings', '/profile', '/admin']
const teacherOnlyRoutes = ['/classes/create', '/students', '/reports']
const studentOnlyRoutes = ['/assignments/submit']
const adminOnlyRoutes = ['/admin']
const publicRoutes = ['/', '/login', '/signup', '/verify']

// Hàm tiện ích để kiểm tra chính xác đường dẫn tránh bị nuốt từ (ví dụ /students bắt đầu bằng /student)
const matchRoute = (pathname: string, routes: string[]) => {
  return routes.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('mathclass_jwt')?.value

  let userRole: string | null = null
  if (token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        const rawRole = payload.role || ''
        userRole = rawRole.replace('ROLE_', '')
      }
    } catch (e) {
      console.error('Error decoding token in middleware', e)
    }
  }

  // SỬA: Sử dụng hàm matchRoute mới để kiểm tra chính xác
  const isProtectedRoute = matchRoute(pathname, protectedRoutes)
  const isAdminRoute = matchRoute(pathname, adminOnlyRoutes)
  const isTeacherRoute = matchRoute(pathname, teacherOnlyRoutes)
  const isStudentRoute = matchRoute(pathname, studentOnlyRoutes)
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // 1. Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !token) {
    const landingUrl = new URL('/', request.url)
    return NextResponse.redirect(landingUrl)
  }

  // 1b. Admin routes: must be logged in AND have ADMIN role
  if (isAdminRoute) {
    if (!token) return NextResponse.redirect(new URL('/', request.url))
    if (userRole !== 'ADMIN') return NextResponse.redirect(new URL('/forbidden', request.url))
  }

  // 2. Redirect authenticated users from public to their respective dashboards
  if (token && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
    const dest = userRole === 'ADMIN' ? '/admin/users' : '/home'
    return NextResponse.redirect(new URL(dest, request.url))
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

  // 5. Role-based access: admin-only routes
  if (isAdminRoute && token && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL(`${fallbackUrl}?error=unauthorized`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder|api/).*)',
  ],
}