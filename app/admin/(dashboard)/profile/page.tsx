'use client'

import React from 'react'
import { useProfile } from '@/hooks/useProfile'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function AdminProfilePage() {
  const { data: profile, isGoogleUser, isLoading, isError } = useProfile()

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500">
        Đã có lỗi xảy ra khi tải thông tin hồ sơ.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto w-full bg-slate-50/50">
      <div className="container max-w-4xl py-8 px-4 md:px-8 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hồ sơ cá nhân Admin</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý thông tin tài khoản Quản trị viên của bạn.
        </p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Ảnh đại diện</CardTitle>
              <CardDescription>
                Cập nhật ảnh đại diện mới cho tài khoản của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <AvatarUpload
                currentAvatarUrl={profile.avatarUrl}
                fullName={profile.fullName}
                isGoogleUser={isGoogleUser}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
              <CardDescription>
                Thông tin quản trị viên hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm initialData={profile} isGoogleUser={isGoogleUser} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
