import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LOCALE_COOKIE, SUPPORTED_LOCALES, DEFAULT_LOCALE, SupportedLocale } from '@/lib/constants/i18n'

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

  const rawLoggedOut = request.cookies.has('mathclass_logged_out')
  // Chỉ coi là đã đăng xuất nếu có cờ mathclass_logged_out VÀ không có cookie vai trò (chưa được cấp phiên mới)
  const isLoggedOut = rawLoggedOut && !request.cookies.has('mathclass_role') && !request.cookies.has('user_role')

  if (!isLoggedOut && token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        // Trích xuất role từ payload (kể cả khi token đã hết hạn vẫn lấy được role)
        const rawRole = payload.role || payload.userRole || payload.roles?.[0] || payload.authorities?.[0] || ''
        if (rawRole) {
          userRole = rawRole.replace('ROLE_', '')
        }

        // Kiểm tra xem token đã hết hạn chưa (exp tính bằng giây)
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          isTokenValid = false
        } else {
          isTokenValid = true
        }
      }
    } catch (e) {
      console.error('Error decoding token in middleware', e)
    }
  }

  // Fallback: role từ cookie (cho token cũ chưa có claim role — sau khi Backend deploy claim role thì JWT là nguồn chính)
  if (!userRole) {
    userRole = request.cookies.get('mathclass_role')?.value || request.cookies.get('user_role')?.value || null
  }

  const hasRoleCookie = request.cookies.has('mathclass_role') || request.cookies.has('user_role')
  // Nếu người dùng đã xóa cookie vai trò (đã đăng xuất trên client) thì không coi là token hợp lệ
  if (!hasRoleCookie) {
    isTokenValid = false
  }

  // Cơ chế Silent Refresh: Nếu Access Token hết hạn nhưng vẫn còn Refresh Token hợp lệ (chưa logout)
  // thì cho phép client hydrate để Axios Interceptor gọi /auth/refresh-token, TUYỆT ĐỐI không xóa cookie hay đá ra /login
  const hasRefreshToken = !isLoggedOut && Boolean(request.cookies.get('mathclass_jwt_refresh')?.value)
  const canRefresh = hasRefreshToken && hasRoleCookie

  // Loại trừ trang /admin/login khỏi các protected & admin-only routes
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/')
  const isProtectedRoute = matchRoute(pathname, protectedRoutes) && !isAdminLogin
  const isAdminRoute = matchRoute(pathname, adminOnlyRoutes) && !isAdminLogin
  const isTeacherRoute = matchRoute(pathname, teacherOnlyRoutes)
  const isStudentRoute = matchRoute(pathname, studentOnlyRoutes)

  // Kiểm tra tham số lý do khóa tài khoản để cho phép truy cập trang login hiển thị Modal cảnh báo
  const isAccountLockedReason = request.nextUrl.searchParams.get('reason') === 'account_locked'

  // 1. Redirect chưa đăng nhập (không có cả Access Token hợp lệ lẫn Refresh Token) khỏi protected routes
  if (isProtectedRoute && !isTokenValid && !canRefresh) {
    const redirectUrl = isAdminRoute ? '/admin/login' : '/login'
    const response = NextResponse.redirect(new URL(redirectUrl, request.url))
    response.cookies.delete('mathclass_jwt')
    response.cookies.delete('mathclass_jwt_refresh')
    response.cookies.delete('mathclass_role')
    response.cookies.delete('user_role')
    response.cookies.delete('mathclass_remember')
    response.cookies.delete('user_info')
    if (isLoggedOut) {
      response.cookies.delete('mathclass_logged_out')
    }
    return response
  }

  // 1b. Admin routes: FAIL-CLOSED — chỉ cho qua khi xác định được role ADMIN.
  if (isAdminRoute) {
    if (!isTokenValid && !canRefresh) return NextResponse.redirect(new URL('/admin/login', request.url))
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(userRole ? '/forbidden' : '/admin/login', request.url))
    }
  }

  /*
   * TỰ ĐỘNG NHẬN PHIÊN ĐĂNG NHẬP (CROSS-TAB SESSION SHARING):
   * Chỉ tự động chuyển hướng khi người dùng ở trang chủ "/" và đã có phiên đăng nhập hợp lệ (hoặc có thể refresh).
   * TUYỆT ĐỐI không tự ý redirect khi người dùng đang ở /login hoặc /admin/login,
   * tránh việc người dùng bị kẹt trong vòng lặp vô tận khi muốn đăng nhập lại hoặc đổi tài khoản.
   */
  if (!isLoggedOut && !isAccountLockedReason && (isTokenValid || canRefresh) && hasRoleCookie && pathname === '/') {
    const dest = userRole === 'ADMIN' ? '/admin' : '/home'
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

  const res = NextResponse.next()

  // Locale negotiation: Tự động khởi tạo NEXT_LOCALE cookie nếu thiếu
  if (!request.cookies.has(LOCALE_COOKIE.NAME)) {
    const negotiatedLocale = getNegotiatedLocale(request)
    const secureFlag = request.nextUrl.protocol === 'https:'
    res.cookies.set(LOCALE_COOKIE.NAME, negotiatedLocale, {
      path: LOCALE_COOKIE.PATH,
      maxAge: LOCALE_COOKIE.MAX_AGE,
      sameSite: 'lax',
      secure: secureFlag,
      httpOnly: false,
    })
  }

  return res
}

export function getNegotiatedLocale(request: NextRequest): SupportedLocale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE.NAME)?.value
  if (cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as SupportedLocale
  }

  const acceptLanguage = request.headers.get('accept-language') || ''
  if (!acceptLanguage) return DEFAULT_LOCALE

  try {
    const parts = acceptLanguage.split(',')
    const weights: Array<{ lang: string; weight: number }> = []

    for (const part of parts) {
      const subParts = part.trim().split(';')
      const lang = subParts[0].trim().toLowerCase()
      let weight = 1.0
      if (subParts.length > 1) {
        for (let i = 1; i < subParts.length; i++) {
          const sub = subParts[i].trim()
          if (sub.startsWith('q=')) {
            const parsed = parseFloat(sub.substring(2))
            if (!isNaN(parsed)) weight = parsed
          }
        }
      }
      weights.push({ lang, weight })
    }

    weights.sort((a, b) => b.weight - a.weight)

    for (const item of weights) {
      if (item.lang === '*') return DEFAULT_LOCALE
      const isoCode = item.lang.split('-')[0]
      if ((SUPPORTED_LOCALES as readonly string[]).includes(isoCode)) {
        return isoCode as SupportedLocale
      }
    }
  } catch (e) {
    // Malformed header fallback
  }

  return DEFAULT_LOCALE
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder|api/).*)',
  ],
}