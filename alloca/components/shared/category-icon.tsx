'use client'

import {
  BookOpen,
  Bus,
  Coffee,
  Gamepad2,
  GraduationCap,
  Hammer,
  HeartPulse,
  Shirt,
  ShoppingBag,
  Smartphone,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils/cn'

/** Only the icons the category manager offers are bundled. */
const ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Bus,
  Hammer,
  Gamepad2,
  GraduationCap,
  Wallet,
  Coffee,
  ShoppingBag,
  BookOpen,
  Shirt,
  HeartPulse,
  Smartphone,
}

export function CategoryIcon({
  icon,
  color,
  className,
  size = 'default',
}: {
  icon: string
  color?: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
}) {
  const Icon = ICONS[icon] ?? Wallet
  const box = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-14' : 'size-10'
  const glyph = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-6' : 'size-5'

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-xl', box, className)}
      style={
        color
          ? { backgroundColor: `hsl(var(--${color}) / 0.14)`, color: `hsl(var(--${color}))` }
          : undefined
      }
      aria-hidden
    >
      <Icon className={glyph} />
    </span>
  )
}
