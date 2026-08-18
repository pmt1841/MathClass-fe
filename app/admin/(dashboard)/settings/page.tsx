'use client'

import React, { useState, useEffect } from 'react'
import { BellRing, Save, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, NotificationSettings } from '@/services/settingsService'

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: settingsService.getNotificationSettings,
    enabled: !!user
  })

  const [settings, setSettings] = useState<NotificationSettings | null>(null)

  useEffect(() => {
    if (serverSettings) {
      setSettings(serverSettings)
    }
  }, [serverSettings])

  const mutation = useMutation({
    mutationFn: settingsService.updateNotificationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data)
      toast({
        title: 'Thành công',
        description: 'Đã lưu cài đặt thông báo.',
      })
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi lưu cài đặt.',
        variant: 'destructive'
      })
    }
  })

  const handleToggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      [key]: !prev[key]
    } : null)
  }

  const handleSave = () => {
    if (settings) {
      mutation.mutate(settings)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          Đang tải cấu hình...
        </div>
      </div>
    )
  }

  const isSaving = mutation.isPending

  return (
    <div className="flex-1 overflow-y-auto w-full bg-slate-50/50">
      <div className="container max-w-4xl py-8 px-4 md:px-8 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cài đặt Quản trị viên</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý tùy chọn nhận thông báo và hệ thống dành cho Admin.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
            <BellRing className="w-5 h-5 text-blue-500" />
            Thông báo qua Email
          </CardTitle>
          <CardDescription className="text-slate-500">
            Cấu hình nhận thông báo qua email của tài khoản Quản trị viên.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/80">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-slate-900 cursor-pointer" htmlFor="master-toggle">
                Nhận thông báo email hệ thống
              </Label>
              <p className="text-sm text-slate-500">
                Bật/tắt các thông báo email quản trị viên
              </p>
            </div>
            <Switch 
              id="master-toggle" 
              checked={settings.masterEmail}
              onCheckedChange={() => handleToggle('masterEmail')}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <Separator className="bg-slate-100" />
        </CardContent>

        <CardFooter className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="border-slate-200 text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4 mr-1.5" />
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
)
}
