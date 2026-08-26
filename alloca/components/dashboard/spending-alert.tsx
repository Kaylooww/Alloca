import { AlertTriangle, Info, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Alert as AlertModel } from '@/types/reports'

const PRESENTATION = {
  AT_RISK: { variant: 'destructive' as const, Icon: TriangleAlert },
  WATCH: { variant: 'warning' as const, Icon: AlertTriangle },
  SAFE: { variant: 'success' as const, Icon: Info },
  INFO: { variant: 'info' as const, Icon: Info },
}

/** Renders whatever the alert service decided is worth saying today. */
export function SpendingAlert({ alerts }: { alerts: AlertModel[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const { variant, Icon } = PRESENTATION[alert.level]
        return (
          <Alert key={alert.id} variant={variant}>
            <Icon aria-hidden />
            <div className="space-y-0.5">
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </div>
          </Alert>
        )
      })}
    </div>
  )
}
