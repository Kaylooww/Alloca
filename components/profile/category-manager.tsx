'use client'

import { useState } from 'react'
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CategoryIcon } from '@/components/shared/category-icon'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useCategories } from '@/hooks/use-categories'
import { CATEGORY_COLORS } from '@/lib/constants/categories'
import { cn } from '@/lib/utils/cn'
import type { Category } from '@/types/category'

/**
 * Add, rename, hide and restore categories.
 *
 * A category that already has transactions is hidden rather than deleted, so
 * old entries keep their label — the UI says so rather than failing silently.
 */
export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const { categories, createCategory, updateCategory, hideCategory, restoreCategory, removeCategory, error } =
    useCategories({ includeHidden: true }, initialCategories)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(CATEGORY_COLORS[0])
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const visible = categories.filter((category) => !category.isHidden)
  const hidden = categories.filter((category) => category.isHidden)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (newName.trim().length < 2) return
    setBusy(true)
    const created = await createCategory({ name: newName.trim(), color: newColor })
    setBusy(false)
    if (created) setNewName('')
  }

  async function saveRename(id: string) {
    if (editingName.trim().length >= 2) {
      await updateCategory(id, { name: editingName.trim() })
    }
    setEditingId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <p className="text-sm text-muted-foreground">
          Categories with history are hidden instead of deleted, so past entries keep their labels.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <ul className="divide-y divide-border">
          {visible.map((category) => (
            <li key={category.id} className="flex items-center gap-3 py-2.5">
              <CategoryIcon icon={category.icon} color={category.color} size="sm" />

              {editingId === category.id ? (
                <Input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={() => saveRename(category.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveRename(category.id)
                    if (event.key === 'Escape') setEditingId(null)
                  }}
                  aria-label={`Rename ${category.name}`}
                  className="h-9 flex-1"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(category.id)
                    setEditingName(category.name)
                  }}
                  className="flex-1 truncate text-left text-sm font-medium hover:underline"
                >
                  {category.name}
                  {category.isDefault ? (
                    <Badge variant="secondary" className="ml-2">
                      Default
                    </Badge>
                  ) : null}
                </button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground"
                onClick={() => hideCategory(category.id)}
              >
                <EyeOff aria-hidden />
                <span className="sr-only">Hide {category.name}</span>
              </Button>

              {!category.isDefault ? (
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
                      <Trash2 aria-hidden />
                      <span className="sr-only">Delete {category.name}</span>
                    </Button>
                  }
                  title={`Delete “${category.name}”?`}
                  description="If it already has expenses it will be hidden instead, so your history stays intact."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={() => removeCategory(category.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>

        {hidden.length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hidden
            </h3>
            <ul className="space-y-1">
              {hidden.map((category) => (
                <li key={category.id} className="flex items-center gap-3">
                  <CategoryIcon icon={category.icon} color={category.color} size="sm" className="opacity-60" />
                  <span className="flex-1 truncate text-sm text-muted-foreground">
                    {category.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => restoreCategory(category.id)}>
                    <Eye aria-hidden />
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <form onSubmit={handleCreate} className="space-y-3 border-t border-border pt-4">
          <label htmlFor="new-category" className="text-sm font-medium">
            Add a category
          </label>
          <div className="flex gap-2">
            <Input
              id="new-category"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Laundry"
              maxLength={24}
            />
            <Button type="submit" loading={busy} disabled={newName.trim().length < 2}>
              <Plus aria-hidden />
              Add
            </Button>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs text-muted-foreground">Colour</legend>
            <div className="flex gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use colour ${color}`}
                  aria-pressed={newColor === color}
                  onClick={() => setNewColor(color)}
                  className={cn(
                    'size-7 rounded-full border-2 transition-transform',
                    newColor === color ? 'border-foreground scale-110' : 'border-transparent',
                  )}
                  style={{ backgroundColor: `hsl(var(--${color}))` }}
                />
              ))}
            </div>
          </fieldset>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
