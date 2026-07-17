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
