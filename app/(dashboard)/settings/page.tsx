'use client'

import React, { useState, useEffect } from 'react'
import { BellRing, Save, X, UserPlus, FileText, CheckCircle, Clock, KeyRound } from 'lucide-react'
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
import { useI18n } from '@/lib/i18n/i18n-context'

import { ChangePasswordCard } from '@/components/settings/ChangePasswordCard'

type SettingsTab = 'NOTIFICATIONS' | 'PASSWORD'

export default function SettingsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('NOTIFICATIONS')

  const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'NOTIFICATIONS', label: t('Thông báo Email'), icon: BellRing },
    { key: 'PASSWORD', label: t('Đổi mật khẩu'), icon: KeyRound },
  ]

  // Role
  const isTeacher = user?.role === 'TEACHER'
  const isStudent = user?.role === 'STUDENT'

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
        title: t('Thành công'),
        description: t('Đã lưu cài đặt thông báo.'),
      })
    },
    onError: () => {
      toast({
        title: t('Lỗi'),
        description: t('Có lỗi xảy ra khi lưu cài đặt.'),
        variant: 'destructive'
      })
    }
  })

  // Nếu master đang tắt, các nút con sẽ bị disabled
  const isSubDisabled = !settings?.masterEmail

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
          {t('Đang tải cấu hình...')}
        </div>
      </div>
    )
  }

  const isSaving = mutation.isPending

  return (
    <div className="flex-1 overflow-y-auto w-full bg-slate-50/50">
      <div className="container max-w-4xl py-8 px-4 md:px-8 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('Cài đặt')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('Quản lý tùy chọn nhận thông báo và các thiết lập tài khoản khác.')}
          </p>
        </div>

        {/* ── Tabs Navigation (Tương tự Thư viện dùng chung) ── */}
        <div className="flex gap-1 rounded-xl bg-slate-200/60 p-1 w-fit border border-slate-200/40">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content: Thông báo Email */}
        {activeTab === 'NOTIFICATIONS' && (
          <Card className="shadow-sm border-slate-200 bg-white animate-in fade-in duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                <BellRing className="w-5 h-5 text-blue-500" />
                {t('Thông báo qua Email')}
              </CardTitle>
              <CardDescription className="text-slate-500">
                {t('Chọn các sự kiện bạn muốn nhận email thông báo để không bỏ lỡ thông tin quan trọng.')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/80">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-slate-900 cursor-pointer" htmlFor="master-toggle">
                    {t('Nhận thông báo email')}
                  </Label>
                  <p className="text-sm text-slate-500">
                    {t('Bật/tắt toàn bộ thông báo gửi về email của bạn')}
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

              {/* Sub Toggles */}
              <div className="space-y-6 px-2">
                
                {/* TEACHER SECTION */}
                {isTeacher && (
                  <>
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${isSubDisabled ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 bg-blue-50 p-2.5 rounded-xl border border-blue-100/50">
                          <UserPlus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold leading-none cursor-pointer text-slate-800" htmlFor="teacher-join">
                            {t('Học sinh xin vào lớp')}
                          </Label>
                          <p className="text-sm text-slate-500 max-w-[500px]">
                            {t('Nhận email khi có học sinh gửi yêu cầu tham gia vào lớp học của bạn.')}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="teacher-join" 
                        disabled={isSubDisabled}
                        checked={settings.teacherJoinRequest}
                        onCheckedChange={() => handleToggle('teacherJoinRequest')}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${isSubDisabled ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100/50">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold leading-none cursor-pointer text-slate-800" htmlFor="teacher-submit">
                            {t('Học sinh nộp bài')}
                          </Label>
                          <p className="text-sm text-slate-500 max-w-[500px]">
                            {t('Nhận email mỗi khi có học sinh hoàn thành và nộp bài tập mới.')}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="teacher-submit" 
                        disabled={isSubDisabled}
                        checked={settings.teacherNewSubmission}
                        onCheckedChange={() => handleToggle('teacherNewSubmission')}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* STUDENT SECTION */}
                {isStudent && (
                  <>
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${isSubDisabled ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 bg-blue-50 p-2.5 rounded-xl border border-blue-100/50">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold leading-none cursor-pointer text-slate-800" htmlFor="student-assign">
                            {t('Có bài tập mới')}
                          </Label>
                          <p className="text-sm text-slate-500 max-w-[500px]">
                            {t('Nhận email ngay khi giáo viên giao một bài tập mới cho lớp của bạn.')}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="student-assign" 
                        disabled={isSubDisabled}
                        checked={settings.studentNewAssignment}
                        onCheckedChange={() => handleToggle('studentNewAssignment')}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${isSubDisabled ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/50">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold leading-none cursor-pointer text-slate-800" htmlFor="student-graded">
                            {t('Bài đã được chấm')}
                          </Label>
                          <p className="text-sm text-slate-500 max-w-[500px]">
                            {t('Nhận email khi giáo viên đã hoàn tất việc chấm điểm và nhận xét bài làm của bạn.')}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="student-graded" 
                        disabled={isSubDisabled}
                        checked={settings.studentGraded}
                        onCheckedChange={() => handleToggle('studentGraded')}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${isSubDisabled ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 bg-orange-50 p-2.5 rounded-xl border border-orange-100/50">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold leading-none cursor-pointer text-slate-800" htmlFor="student-reminder">
                            {t('Nhắc nhở sắp đến hạn')}
                          </Label>
                          <p className="text-sm text-slate-500 max-w-[500px]">
                            {t('Hệ thống tự động gửi email nhắc nhở trước 24 giờ khi bài tập sắp hết hạn.')}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="student-reminder" 
                        disabled={isSubDisabled}
                        checked={settings.studentDeadlineReminder}
                        onCheckedChange={() => handleToggle('studentDeadlineReminder')}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Empty state nếu không phải teacher/student */}
                {!isTeacher && !isStudent && (
                  <p className="text-sm text-slate-500 italic py-4">
                    {t('Không có tùy chọn thông báo nào khả dụng cho tài khoản của bạn lúc này.')}
                  </p>
                )}

              </div>
            </CardContent>

            <CardFooter className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="border-slate-200 text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4 mr-1.5" />
                {t('Hủy')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium">
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {t('Đang lưu...')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {t('Lưu thay đổi')}
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Tab Content: Đổi mật khẩu */}
        {activeTab === 'PASSWORD' && (
          <div className="animate-in fade-in duration-300">
            <ChangePasswordCard />
          </div>
        )}
      </div>
    </div>
  )
}
