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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cấu hình AI Services</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý nhà cung cấp AI, định tuyến tác vụ hệ thống, System Prompts, thử nghiệm kết nối và hạn mức Credit.
          </p>
        </div>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>Nhà cung cấp & Keys</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Định tuyến Tác vụ</span>
          </TabsTrigger>
          <TabsTrigger value="system-prompts" className="flex items-center gap-2">
            <MessageSquareCode className="h-4 w-4" />
            <span>System Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="test-connection" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            <span>Kiểm tra Kết nối</span>
          </TabsTrigger>
          <TabsTrigger value="credit" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
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
