'use client'

import { useState } from 'react'
import { X, Key, Loader2 } from 'lucide-react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { joinRequestService, JoinRequestResponse } from '@/services/joinRequestService'

interface JoinClassModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (requestData: JoinRequestResponse) => void
}

export function JoinClassModal({ open, onClose, onSuccess }: JoinClassModalProps) {
  const [error, setError] = useState('')

  const formik = useFormik({
    initialValues: {
      classCode: '',
    },
    validationSchema: Yup.object({
      classCode: Yup.string()
        .trim()
        .required('Vui lòng nhập mã lớp')
        .min(6, 'Mã lớp tối thiểu 6 ký tự'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError('')

      try {
        const response = await joinRequestService.requestToJoinClass({ classCode: values.classCode.trim() })
        onSuccess?.(response)
        handleClose()
      } catch (err: any) {
        if (err.response) {
          const errData = err.response.data
          setError(errData?.message || 'Không thể xin vào lớp. Vui lòng thử lại.')
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
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Xin vào lớp</h2>
              <p className="text-xs text-muted-foreground">Nhập mã lớp để tham gia</p>
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

          {/* Class code */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Mã lớp học <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="class-code"
                name="classCode"
                type="text"
                placeholder="VD: 8A4D9B2C"
                value={formik.values.classCode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full rounded-lg border bg-background px-4 py-2.5 pl-10 text-sm outline-none transition-all ${
                  formik.touched.classCode && formik.errors.classCode
                    ? 'border-destructive focus:ring-2 focus:ring-destructive/20'
                    : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>
            {formik.touched.classCode && formik.errors.classCode && (
              <p className="text-xs text-destructive">{formik.errors.classCode}</p>
            )}
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
              id="submit-join-class"
              type="submit"
              disabled={formik.isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Tham gia'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
