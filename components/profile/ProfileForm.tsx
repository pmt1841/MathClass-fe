'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { UserResponse, UpdateProfileRequest, Gender } from '@/types'
import { useUpdateProfile } from '@/hooks/useProfile'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const profileFormSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').max(100, 'Họ tên quá dài'),
  phoneNumber: z.string().min(1, 'Số điện thoại không được để trống').max(15, 'Số điện thoại không hợp lệ'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  initialData: UserResponse
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const updateProfileMutation = useUpdateProfile()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: initialData.fullName || '',
      phoneNumber: initialData.phoneNumber || '',
      dateOfBirth: initialData.dateOfBirth || '',
      gender: initialData.gender || undefined,
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    // Only pass avatarUrl if you are storing it in the form, 
    // but we use AvatarUpload which updates via separate mutation or optimistic update.
    // The current avatarUrl will be preserved if not sent, or we can send the current one.
    const requestData: UpdateProfileRequest = {
      ...data,
      avatarUrl: initialData.avatarUrl
    }
    
    // We send empty string as undefined for backend if dateOfBirth is not set
    if (!requestData.dateOfBirth) {
      delete requestData.dateOfBirth
    }

    await updateProfileMutation.mutateAsync(requestData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ và tên</FormLabel>
              <FormControl>
                <Input placeholder="Nhập họ và tên..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <Input placeholder="Nhập số điện thoại..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2 mt-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Email
            </label>
            <Input value={initialData.email} disabled className="bg-slate-50" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => {
              const [dayVal, monthVal, yearVal] = field.value ? field.value.split('-') : ['', '', '']
              
              const currentYear = new Date().getFullYear()
              const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i))
              const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
              
              const getDaysInMonth = (m: number, y: number) => {
                return new Date(y, m, 0).getDate()
              }
              
              const selectedMonth = monthVal ? Number(monthVal) : 1
              const selectedYear = yearVal ? Number(yearVal) : currentYear
              const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
              const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'))

              const handleSelectChange = (type: 'day' | 'month' | 'year', val: string) => {
                let nextD = dayVal
                let nextM = monthVal
                let nextY = yearVal

                if (type === 'day') nextD = val
                if (type === 'month') nextM = val
                if (type === 'year') nextY = val

                // Adjust day if it exceeds max days of new month/year
                if (nextD && nextM) {
                  const maxDays = getDaysInMonth(Number(nextM), nextY ? Number(nextY) : currentYear)
                  if (Number(nextD) > maxDays) {
                    nextD = String(maxDays).padStart(2, '0')
                  }
                }

                if (nextD && nextM && nextY) {
                  field.onChange(`${nextD}-${nextM}-${nextY}`)
                } else {
                  field.onChange('')
                }
              }

              return (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Ngày sinh</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
                      <Select
                        value={dayVal || undefined}
                        onValueChange={(val) => handleSelectChange('day', val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Ngày" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={monthVal || undefined}
                        onValueChange={(val) => handleSelectChange('month', val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tháng" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m} value={m}>
                              Tháng {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={yearVal || undefined}
                        onValueChange={(val) => handleSelectChange('year', val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Năm" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giới tính</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Form>
  )
}
