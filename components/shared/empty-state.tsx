import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * Reusable empty state. Every list in Alloca uses this rather than rendering
 * nothing, so a new account still explains itself.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
