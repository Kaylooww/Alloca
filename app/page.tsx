import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, PiggyBank, Receipt, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BrandLockup } from '@/components/shared/brand-mark'
import { getSession } from '@/lib/auth/session'
import { APP_DESCRIPTION, APP_TAGLINE } from '@/lib/constants/app'

const FEATURES = [
  {
    icon: Receipt,
    title: 'Three taps to log',
    body: 'Category, amount, done. Built for the ₱40 jeep fare you would normally forget.',
  },
  {
    icon: TrendingUp,
    title: 'Know the pace',
    body: 'Alloca warns you when the week is going faster than the money.',
  },
  {
    icon: PiggyBank,
    title: 'Surplus with a purpose',
    body: 'Whatever survives the week goes toward something you actually want.',
  },
]

/** Landing page. Signed-in visitors go straight to their dashboard. */
export default async function HomePage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <BrandLockup />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8 sm:py-20">
        <section className="space-y-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            For students on a weekly allowance
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            {APP_TAGLINE}
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {APP_DESCRIPTION}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/register">
                Create your account
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/login">I already have one</Link>
            </Button>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="space-y-2">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-5" aria-hidden />
              </span>
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <p>
            Alloca does not connect to banks, GCash or cards. Everything is entered by hand,
            which is exactly the point: the small cash purchases are the ones that quietly
            empty an allowance.
          </p>
        </section>
      </main>

      <footer className="px-5 py-8 text-center text-xs text-muted-foreground sm:px-8">
        Alloca — an academic project built around the weekly allowance cycle.
      </footer>
    </div>
  )
}
