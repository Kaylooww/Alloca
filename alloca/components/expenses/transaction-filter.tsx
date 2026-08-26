'use client'

import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category } from '@/types/category'
import type { TransactionFilter as Filter } from '@/types/transaction'

/** Type, category, cycle and free-text filters for the transaction list. */
export function TransactionFilter({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: Filter
  onChange: (next: Filter) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">Search</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="filter-search"
            className="pl-9"
            placeholder="Notes…"
            value={value.search ?? ''}
            onChange={(event) => onChange({ ...value, search: event.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-type">Type</Label>
        <Select
          value={value.type ?? 'ALL'}
          onValueChange={(next) => onChange({ ...value, type: next as Filter['type'] })}
        >
          <SelectTrigger id="filter-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Everything</SelectItem>
            <SelectItem value="EXPENSE">Expenses</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-category">Category</Label>
        <Select
          value={value.categoryId ?? 'ALL'}
          onValueChange={(next) => onChange({ ...value, categoryId: next })}
        >
          <SelectTrigger id="filter-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-cycle">Period</Label>
        <Select
          value={typeof value.cycleId === 'string' ? value.cycleId : 'CURRENT'}
          onValueChange={(next) => onChange({ ...value, cycleId: next })}
        >
          <SelectTrigger id="filter-cycle">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CURRENT">This cycle</SelectItem>
            <SelectItem value="ALL">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
