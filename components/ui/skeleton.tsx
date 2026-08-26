import { cn } from '@/lib/utils/cn'

/** Placeholder block shown while a suspended server component streams in. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} {...props} />
}

export { Skeleton }
