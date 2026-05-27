import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/home', '/classes', '/assignments', '/students', '/reports', '/settings', '/profile']

// Routes only for teachers
const teacherOnlyRoutes = ['/classes/create', '/students', '/reports']

// Routes only for students
const studentOnlyRoutes = ['/assignments/submit']

// Public routes (no auth required)
const publicRoutes = ['/', '/login', '/signup', '/verify']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get token from cookie (set after login)
  const token = request.cookies.get('auth_token')?.value
  const userRole = request.cookies.get('user_role')?.value

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isTeacherRoute = teacherOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isStudentRoute = studentOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Role-based access: teacher-only routes
  if (isTeacherRoute && token && userRole !== 'TEACHER') {
    return NextResponse.redirect(new URL('/home?error=unauthorized', request.url))
  }

  // Role-based access: student-only routes
  if (isStudentRoute && token && userRole !== 'STUDENT') {
    return NextResponse.redirect(new URL('/home?error=unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, images
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder|api/).*)',
  ],
}
