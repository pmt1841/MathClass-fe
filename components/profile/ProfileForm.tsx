'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { UserResponse, UpdateProfileRequest, Gender } from '@/types'
import { useUpdateProfile } from '@/hooks/useProfile'
import { DateSelectGroup } from '@/components/ui/date-select-group'

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

    // We send empty string as undefined for backend if dateOfBirth is not set or incomplete
    const isCompleteDate = requestData.dateOfBirth && requestData.dateOfBirth.split('-').filter(Boolean).length === 3
    if (!isCompleteDate) {
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
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>Ngày sinh</FormLabel>
                <FormControl>
                  <DateSelectGroup
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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
