'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Cpu, Route, FlaskConical, MessageSquareCode, Coins } from 'lucide-react'
import { ProviderTab } from '@/components/admin/ai-config/ProviderTab'
import { TaskRoutingTab } from '@/components/admin/ai-config/TaskRoutingTab'
import { TestConnectionTab } from '@/components/admin/ai-config/TestConnectionTab'
import { SystemPromptTab } from '@/components/admin/ai-config/SystemPromptTab'
import { CreditQuotaTab } from '@/components/admin/ai-config/CreditQuotaTab'
import { useI18n } from '@/lib/i18n/i18n-context'

export default function AdminAiConfigPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('providers')

  const aiConfigTabs = [
    {
      id: 'providers',
      label: t('Nhà cung cấp & API Keys'),
      tabletLabel: t('Nhà cung cấp & Keys'),
      icon: Cpu,
    },
    {
      id: 'tasks',
      label: t('Định tuyến Tác vụ'),
      tabletLabel: t('Định tuyến Tác vụ'),
      icon: Route,
    },
    {
      id: 'system-prompts',
      label: 'System Prompts',
      tabletLabel: 'System Prompts',
      icon: MessageSquareCode,
    },
    {
      id: 'test-connection',
      label: t('Kiểm tra Kết nối'),
      tabletLabel: t('Kiểm tra Kết nối'),
      icon: FlaskConical,
    },
    {
      id: 'credit',
      label: t('Hạn mức Credit'),
      tabletLabel: t('Hạn mức Credit'),
      icon: Coins,
    },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* ── Synchronized Header ── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Cpu className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t('Cấu hình Dịch vụ AI')}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t('Quản lý nhà cung cấp AI, định tuyến tác vụ AI, System Prompts, thử nghiệm kết nối và hạn mức Credit.')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            {/* ── Mobile Selector (< sm) ── */}
            <div className="block sm:hidden">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-800 border-slate-300/80 dark:border-slate-700 shadow-xs rounded-xl text-xs font-semibold px-3.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiConfigTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <SelectItem key={tab.id} value={tab.id} className="py-2.5 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <span>{tab.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* ── Tablet / Desktop Tabs (>= sm) ── */}
            <div className="hidden sm:block w-full overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              <TabsList className="inline-flex w-max min-w-full items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-200/70 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/60 rounded-xl shadow-xs">
                {aiConfigTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex-1 min-w-max h-9 sm:h-10 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 text-xs lg:text-sm font-semibold rounded-lg whitespace-nowrap transition-all border border-transparent data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-slate-200/80 data-[state=active]:shadow-xs hover:text-foreground text-muted-foreground"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="hidden xl:inline">{tab.label}</span>
                      <span className="inline xl:hidden">{tab.tabletLabel}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            <TabsContent value="providers" className="space-y-4">
              <ProviderTab />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <TaskRoutingTab />
            </TabsContent>

            <TabsContent value="system-prompts" className="space-y-4">
              <SystemPromptTab />
            </TabsContent>

            <TabsContent value="test-connection" className="space-y-4">
              <TestConnectionTab />
            </TabsContent>

            <TabsContent value="credit" className="space-y-4">
              <CreditQuotaTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
