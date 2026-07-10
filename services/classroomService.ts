import api from '@/lib/axios'
import { ClassroomDetail, Student } from '@/types'

export interface Classroom {
  id: number
  classCode: string
  className: string
  teacherId: number
  teacherName: string
  studentCount: number
  maxStudents: number
}

export const classroomService = {
  getMyClassrooms: async (): Promise<Classroom[]> => {
    const res = await api.get('/classrooms/my-classroom')
    return Array.isArray(res.data) ? res.data : []
  },
  createClassroom: async (payload: { name: string; maxStudents: number | null; description: string }) => {
    const res = await api.post('/classrooms/create', payload)
    return res.data
  },
  getClassroomDetail: async (classCode: string): Promise<ClassroomDetail> => {
    const res = await api.get(`/classrooms/${classCode}`)
    return res.data
  },
  updateClassroom: async (classCode: string, payload: { className: string; description?: string; maxStudents: number }) => {
    await api.put(`/classrooms/${classCode}`, payload)
  },
  deleteClassroom: async (classCode: string) => {
    await api.delete(`/classrooms/${classCode}`)
  },
  getClassroomStudents: async (classCode: string, params: { page: number; size: number; sort: string }) => {
    const res = await api.get(`/classrooms/${classCode}/students`, { params })
    return res.data
  },
  getClassroomAssignments: async (classCode: string, params: { page: number; size: number; status?: string; keyword?: string }) => {
    const res = await api.get(`/classrooms/${classCode}/assignments`, { params })
    return res.data
  },
  addStudent: async (classCode: string, email: string) => {
    await api.post(`/classrooms/${classCode}/students/add`, { studentEmail: email })
  },
  removeStudent: async (classCode: string, studentId: number) => {
    await api.delete(`/classrooms/${classCode}/students/${studentId}`)
  },
  getClassroomAssignmentDetail: async (classCode: string, assignmentId: number) => {
    const res = await api.get(`/classrooms/${classCode}/assignments/${assignmentId}/detail`)
    return res.data
  }
}
