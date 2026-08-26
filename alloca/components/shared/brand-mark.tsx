import { cn } from '@/lib/utils/cn'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app'

/**
 * The Alloca mark: a peso sign inside a rounded "allocation" square.
 * Drawn inline as SVG so it needs no image request and inherits the theme.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        <path d="M8 18V6h4.2a3.4 3.4 0 0 1 0 6.8H8" />
        <path d="M6 10.5h8.5M6 13.5h8.5" />
      </svg>
    </span>
  )
}

export function BrandLockup({
  className,
  showTagline = false,
}: {
  className?: string
  showTagline?: boolean
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        {showTagline ? (
          <span className="mt-1 text-xs text-muted-foreground">{APP_TAGLINE}</span>
        ) : null}
      </span>
    </span>
  )
}
