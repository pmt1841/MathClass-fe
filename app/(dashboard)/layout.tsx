'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardHeader } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardFooter } from '@/components/layout/footer'
import { CreateClassModal } from '@/components/dashboard/create-class-modal'
import { GlobalPresenceTracker } from '@/components/chat/GlobalPresenceTracker'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [createClassOpen, setCreateClassOpen] = useState(false)
  const { isAuthenticated, isInitializing } = useAuth()

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace('/')
    }
  }, [isInitializing, isAuthenticated, router])

  if (isInitializing || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <GlobalPresenceTracker />
      <DashboardHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar onCreateClass={() => setCreateClassOpen(true)} />

        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>

      <DashboardFooter />

      <CreateClassModal
        open={createClassOpen}
        onClose={() => setCreateClassOpen(false)}
        onSuccess={(data) => {
          setCreateClassOpen(false)
        }}
      />
    </div>
  )
}
