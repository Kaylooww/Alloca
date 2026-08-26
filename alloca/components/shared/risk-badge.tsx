import { Badge } from '@/components/ui/badge'
import { RISK_COPY } from '@/lib/calculations/spending-risk'
import type { RiskLevel } from '@/types/reports'

const VARIANT: Record<RiskLevel, 'success' | 'warning' | 'destructive'> = {
  SAFE: 'success',
  WATCH: 'warning',
  AT_RISK: 'destructive',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge variant={VARIANT[level]}>{RISK_COPY[level].label}</Badge>
}
