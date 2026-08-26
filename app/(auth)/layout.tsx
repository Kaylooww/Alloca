import type { ReactNode } from 'react'

/** Centred, distraction-free frame for sign-in and sign-up. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <main id="main" className="w-full max-w-md">
        {children}
      </main>
    </div>
  )
}
