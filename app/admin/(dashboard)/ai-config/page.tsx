'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Cpu, Sparkles, FlaskConical, MessageSquareCode, Coins } from 'lucide-react'
import { ProviderTab } from '@/components/admin/ai-config/ProviderTab'
import { TaskRoutingTab } from '@/components/admin/ai-config/TaskRoutingTab'
import { TestConnectionTab } from '@/components/admin/ai-config/TestConnectionTab'
import { SystemPromptTab } from '@/components/admin/ai-config/SystemPromptTab'
import { CreditQuotaTab } from '@/components/admin/ai-config/CreditQuotaTab'

export default function AdminAiConfigPage() {
  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Cấu hình AI Services</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Quản lý nhà cung cấp AI, định tuyến tác vụ hệ thống, System Prompts, thử nghiệm kết nối và hạn mức Credit.
          </p>
        </div>
      </div>

      <Tabs defaultValue="providers" className="space-y-4 sm:space-y-6">
        <TabsList className="flex flex-wrap h-auto w-full max-w-5xl gap-1.5 p-1.5 bg-muted/80 rounded-xl">
          <TabsTrigger
            value="providers"
            className="flex-1 min-w-[140px] sm:min-w-[170px] h-9 sm:h-10 flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:shadow-sm"
          >
            <Cpu className="h-4 w-4 shrink-0" />
            <span>Nhà cung cấp & Keys</span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="flex-1 min-w-[140px] sm:min-w-[170px] h-9 sm:h-10 flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:shadow-sm"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Định tuyến Tác vụ</span>
          </TabsTrigger>
          <TabsTrigger
            value="system-prompts"
            className="flex-1 min-w-[140px] sm:min-w-[170px] h-9 sm:h-10 flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:shadow-sm"
          >
            <MessageSquareCode className="h-4 w-4 shrink-0" />
            <span>System Prompts</span>
          </TabsTrigger>
          <TabsTrigger
            value="test-connection"
            className="flex-1 min-w-[140px] sm:min-w-[170px] h-9 sm:h-10 flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:shadow-sm"
          >
            <FlaskConical className="h-4 w-4 shrink-0" />
            <span>Kiểm tra Kết nối</span>
          </TabsTrigger>
          <TabsTrigger
            value="credit"
            className="flex-1 min-w-[140px] sm:min-w-[170px] h-9 sm:h-10 flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap data-[state=active]:shadow-sm"
          >
            <Coins className="h-4 w-4 shrink-0" />
            <span>Credit & Hạn mức</span>
          </TabsTrigger>
        </TabsList>

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
  )
}
