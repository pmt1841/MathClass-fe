'use client'

import { useState } from 'react'
import { X, BookOpen, Hash, FileText, Users, Loader2 } from 'lucide-react'

interface CreateClassModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (classData: ClassData) => void
}

interface ClassData {
  name: string
  code: string
  description: string
  maxStudents: number
  subject: string
}

const SUBJECTS = [
  'Đại số',
  'Hình học',
  'Giải tích',
  'Xác suất thống kê',
  'Toán tổ hợp',
  'Toán ứng dụng',
]

export function CreateClassModal({ open, onClose, onSuccess }: CreateClassModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ClassData>({
    name: '',
    code: '',
    description: '',
    maxStudents: 30,
    subject: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'maxStudents' ? Number(value) : value,
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.subject) {
      setError('Vui lòng điền đầy đủ tên lớp và môn học.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const token =
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token')

      const response = await fetch('http://localhost:8080/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess?.(data)
        handleClose()
      } else {
        const errData = await response.json().catch(() => null)
        setError(errData?.message || 'Không thể tạo lớp. Vui lòng thử lại.')
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setForm({ name: '', code: '', description: '', maxStudents: 30, subject: '' })
    setError('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Tạo lớp học mới</h2>
              <p className="text-xs text-muted-foreground">Điền thông tin để tạo lớp học</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Class name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Tên lớp học <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="class-name"
                name="name"
                type="text"
                placeholder="VD: Toán 10A - Đại số cơ bản"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pl-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Subject & Code row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Môn học <span className="text-destructive">*</span>
              </label>
              <select
                id="class-subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              >
                <option value="">Chọn môn học</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Mã lớp (tùy chọn)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="class-code"
                  name="code"
                  type="text"
                  placeholder="VD: MC2024"
                  value={form.code}
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pl-9 text-sm uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Max students */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Số học sinh tối đa
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="class-max-students"
                name="maxStudents"
                type="number"
                min={1}
                max={100}
                value={form.maxStudents}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pl-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Mô tả lớp học
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                id="class-description"
                name="description"
                placeholder="Mô tả ngắn về nội dung, mục tiêu của lớp học..."
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pl-10 text-sm outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border-2 border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            <button
              id="submit-create-class"
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo lớp học'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
