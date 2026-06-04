'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon, GraduationCap, Users } from 'lucide-react'
import api from '@/lib/axios'
import { toast } from 'sonner'
import { AssignmentFormValues } from './AssignmentForm'

interface Classroom {
  id: number
  classCode: string
  className: string
  studentCount: number
}

interface PublishModalProps {
  open: boolean
  onClose: () => void
  assignmentData: AssignmentFormValues | null
  onSubmit: (data: { classCodes: string[]; deadline: Date }) => void
  isSubmitting?: boolean
}

export function PublishModal({ open, onClose, assignmentData, onSubmit, isSubmitting }: PublishModalProps) {
  const [classes, setClasses] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchClasses()
      // Reset state
      setSelectedClasses([])
      setDeadline(undefined)
      setError(null)
    }
  }, [open])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/classrooms/my-classroom')
      if (Array.isArray(response.data)) {
        setClasses(response.data)
      } else {
        setClasses([])
      }
    } catch (err) {
      console.error('Error fetching classes:', err)
      toast.error('Không thể tải danh sách lớp học')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleClass = (classCode: string) => {
    setSelectedClasses(prev => 
      prev.includes(classCode) 
        ? prev.filter(c => c !== classCode)
        : [...prev, classCode]
    )
  }

  const handleToggleAll = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([])
    } else {
      setSelectedClasses(classes.map(c => c.classCode))
    }
  }

  const handleSubmit = () => {
    if (selectedClasses.length === 0) {
      setError('Vui lòng chọn ít nhất 1 lớp học.')
      return
    }
    if (!deadline) {
      setError('Vui lòng chọn hạn nộp bài.')
      return
    }
    if (deadline <= new Date()) {
      setError('Hạn nộp phải là thời gian trong tương lai.')
      return
    }

    setError(null)
    onSubmit({ classCodes: selectedClasses, deadline })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white">
        <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Đăng bài tập</DialogTitle>
            <DialogDescription className="mt-1.5">
              Chọn lớp học muốn giao và thiết lập hạn nộp cho bài tập <span className="font-semibold text-foreground">"{assignmentData?.title}"</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Deadline Picker */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Hạn nộp bài <span className="text-destructive">*</span></label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`flex w-full items-center justify-between h-11 px-4 rounded-xl border bg-white text-sm transition-all focus:ring-2 focus:ring-primary/15 ${
                    !deadline ? 'text-muted-foreground border-border hover:border-slate-300' : 'text-foreground border-primary bg-primary/5'
                  }`}
                >
                  {deadline ? format(deadline, 'PPP - HH:mm', { locale: vi }) : 'Chọn ngày và giờ nộp...'}
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                  locale={vi}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Class Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Giao cho lớp <span className="text-destructive">*</span></label>
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {selectedClasses.length === classes.length && classes.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            <div className="border border-border rounded-xl max-h-[220px] overflow-y-auto bg-slate-50/30 p-2 space-y-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Đang tải danh sách lớp...</div>
              ) : classes.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Bạn chưa quản lý lớp học nào.</div>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer"
                    onClick={() => handleToggleClass(cls.classCode)}
                  >
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={selectedClasses.includes(cls.classCode)}
                      onCheckedChange={() => handleToggleClass(cls.classCode)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`class-${cls.id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex items-center justify-between"
                        onClick={(e) => e.preventDefault()} // Let the parent handle the click
                      >
                        <span className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          {cls.className}
                        </span>
                        <span className="text-xs text-muted-foreground font-normal bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          {cls.classCode}
                        </span>
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50/80 border-t border-slate-100">
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Xác nhận đăng'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
