export interface Student {
  id: number
  fullName: string
  email: string
  joinedAt?: string
}

export interface ClassroomDetail {
  id: number
  classCode: string
  className: string
  description: string
  teacherId: number
  teacherName: string
  studentCount: number
  maxStudents: number
}

export interface Assignment {
  id: number
  title: string
  description: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  deadline?: string
  classCode?: string
  className?: string
  teacherName?: string
  isOpen?: boolean
}

export interface MyClassroom {
  id: number
  classCode: string
  className: string
}

export type TabType = 'students' | 'assignments' | 'requests'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface UserResponse {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  role: 'TEACHER' | 'STUDENT'
  isActive: boolean
  avatarUrl?: string
  dateOfBirth?: string
  gender?: Gender
  provider?: 'LOCAL' | 'GOOGLE'
}

export interface UpdateProfileRequest {
  fullName: string
  phoneNumber: string
  dateOfBirth?: string
  gender?: Gender
  avatarUrl?: string
}

// ── Admin Domain Types ────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

/** User record returned from GET /admin/users — all fields required */
export interface AdminUser {
  id: number
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
  avatarUrl?: string
}

// ── Spring Data Page Types ─────────────────────────────────────────────────
export interface SpringSort {
  sorted: boolean
  unsorted: boolean
  empty: boolean
}

export interface SpringPageable {
  pageNumber: number
  pageSize: number
  offset: number
  paged: boolean
  unpaged: boolean
  sort: SpringSort
}

export interface PageResponse<T> {
  content: T[]
  pageable: SpringPageable
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  sort: SpringSort
  first: boolean
  numberOfElements: number
  empty: boolean
}
