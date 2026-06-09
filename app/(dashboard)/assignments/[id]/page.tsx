'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CalendarIcon, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { toast } from 'sonner'
import api from '@/lib/axios'

interface AssignmentDetail {
  id: number
  title: string
  description: string
  content: string
  deadline: string
  status: string
  teacherName: string
  classCode: string
  className: string
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const classCode = searchParams.get('classCode')
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classCode) {
      toast.error('Thiếu mã lớp (classCode)')
      router.push('/assignments')
      return
    }

    const fetchDetail = async () => {
      try {
        const response = await api.get(`/classrooms/${classCode}/assignments/${id}/detail`)
        setAssignment(response.data)
      } catch (error) {
        console.error('Error fetching assignment detail:', error)
        toast.error('Không thể tải chi tiết bài tập. Vui lòng thử lại.')
        router.push('/assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id, classCode, router])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full gap-6 animate-pulse">
        {/* Skeleton Header */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="h-8 bg-slate-200 rounded w-2/3"></div>
          <div className="h-4 bg-slate-100 rounded w-1/3"></div>
        </div>
        {/* Skeleton Content */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4 min-h-[300px]">
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-5/6"></div>
          <div className="h-4 bg-slate-100 rounded w-4/6"></div>
        </div>
      </div>
    )
  }

  if (!assignment) return null

  const dueDate = new Date(assignment.deadline)
  const isOverdue = new Date() > dueDate

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Back button */}
        <div>
          <Link href="/assignments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        </div>

        {/* Phần 1: Khung thông tin tổng quan */}
        <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{assignment.title}</h1>
            {isOverdue ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-700 whitespace-nowrap">
                Đã quá hạn nộp
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">
                Đang mở
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <span>Giao cho: <span className="font-semibold text-slate-700">{assignment.className}</span></span>
            </div>
            {assignment.deadline && (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>
                  Hạn nộp: <span className="font-semibold text-slate-700">
                    {dueDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {dueDate.toLocaleDateString('vi-VN')}
                  </span>
                </span>
              </div>
            )}
          </div>

          {assignment.description && (
            <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
              <p className="text-sm text-slate-700 leading-relaxed">
                {assignment.description}
              </p>
            </div>
          )}
        </div>

        {/* Phần 2: Nội dung đề bài */}
        <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Nội dung đề bài</h2>
          <hr className="border-slate-100 mb-6" />
          
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {assignment.content || "Không có nội dung chi tiết."}
            </ReactMarkdown>
          </div>
        </div>

        {/* Phần 3: Khu vực Nộp bài (Placeholder) */}
        <div className="border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 rounded-3xl text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
              <Info className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Khu vực nộp bài</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            🕒 Tính năng nộp bài trực tuyến đang được phát triển. Học sinh vui lòng làm bài ra vở hoặc chuẩn bị sẵn file bài làm.
          </p>
        </div>
        
      </div>
    </div>
  )
}
