import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/cn'

const alertVariants = cva(
  'relative flex gap-3 rounded-xl border p-4 text-sm [&>svg]:size-5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        info: 'border-primary/25 bg-primary/8 text-foreground [&>svg]:text-primary',
        success: 'border-success/25 bg-success/10 text-foreground [&>svg]:text-success',
        warning: 'border-warning/30 bg-warning/12 text-foreground [&>svg]:text-warning',
        destructive:
          'border-destructive/30 bg-destructive/10 text-foreground [&>svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  ),
)
Alert.displayName = 'Alert'

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('font-semibold leading-tight', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
