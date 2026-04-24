'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ErrorBoundary } from '@/components/error-boundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <PageLoading />
  }

  if (!session) {
    return null
  }

  return (
    <MainLayout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </MainLayout>
  )
}
