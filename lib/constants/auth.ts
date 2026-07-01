export const AUTH_KEYS = {
  TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  REMEMBERED_EMAIL: 'remembered_email',
  SELECTED_ROLE: 'selectedRole',
} as const

export const ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
} as const

export const COOKIE_OPTIONS = {
  MAX_AGE: 60 * 60 * 24 * 30, // 30 days
  PATH: '/',
  SAME_SITE: 'Lax',
} as const
