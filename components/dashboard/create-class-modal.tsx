'use client'

import { useState } from 'react'
import { X, BookOpen, FileText, Users, Loader2 } from 'lucide-react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import api from '@/lib/axios'

interface CreateClassModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (classData: ClassData) => void
}

interface ClassData {
  name: string
  maxStudents: number | null
  description: string
}

export function CreateClassModal({ open, onClose, onSuccess }: CreateClassModalProps) {
  const [error, setError] = useState('')

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      maxStudents: '' as string | number,
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required('Vui lòng điền tên lớp học'),
      description: Yup.string(),
      maxStudents: Yup.number()
        .transform((value, originalValue) => (String(originalValue).trim() === '' ? null : value))
        .nullable()
        .test('min-30', 'Số học sinh tối đa phải từ 30 trở lên', (value) => {
          if (value === null || value === undefined) return true;
          return value >= 30;
        }),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError('')

      const payload: ClassData = {
        name: values.name.trim(),
        description: values.description.trim(),
        maxStudents: values.maxStudents === '' || values.maxStudents === null ? null : Number(values.maxStudents),
      }

      try {
        const response = await api.post('/classrooms/create', payload)
        const data = response.data
        onSuccess?.(data)
        handleClose()
      } catch (err: any) {
        if (err.response) {
          const errData = err.response.data
          setError(errData?.message || 'Không thể tạo lớp. Vui lòng thử lại.')
        } else {
          setError('Lỗi kết nối. Vui lòng thử lại.')
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleClose = () => {
    formik.resetForm()
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
        <form onSubmit={formik.handleSubmit} className="p-6 space-y-4">
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
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full rounded-lg border bg-background px-4 py-2.5 pl-10 text-sm outline-none transition-all ${formik.touched.name && formik.errors.name
                  ? 'border-destructive focus:ring-2 focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
              />
            </div>
            {formik.touched.name && formik.errors.name && (
              <p className="text-xs text-destructive">{formik.errors.name}</p>
            )}
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
                min={30}
                max={100}
                value={formik.values.maxStudents}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full rounded-lg border bg-background px-4 py-2.5 pl-10 text-sm outline-none transition-all ${formik.touched.maxStudents && formik.errors.maxStudents
                  ? 'border-destructive focus:ring-2 focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
              />
            </div>
            {formik.touched.maxStudents && formik.errors.maxStudents && (
              <p className="text-xs text-destructive">{formik.errors.maxStudents}</p>
            )}
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
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
              disabled={formik.isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? (
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
