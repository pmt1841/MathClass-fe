'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authStorage } from '@/lib/auth-storage'
import { DashboardHeader } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardFooter } from '@/components/layout/footer'
import { CreateClassModal } from '@/components/dashboard/create-class-modal'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [createClassOpen, setCreateClassOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    if (!authStorage.getToken()) {
      setIsAuthenticated(false)
      router.replace('/')
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  if (isAuthenticated !== true) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
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
