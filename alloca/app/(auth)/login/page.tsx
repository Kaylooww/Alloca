import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'

import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Pick up where your allowance left off."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {/* useSearchParams needs a Suspense boundary during static rendering. */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  )
}
