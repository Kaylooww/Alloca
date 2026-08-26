import Link from 'next/link'
import type { Metadata } from 'next'

import { AuthCard } from '@/components/auth/auth-card'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = { title: 'Create your account' }

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Set your allowance once — Alloca handles the weekly reset from there."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}
