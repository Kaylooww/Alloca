'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/utils/api-client'

export function LogoutButton({ full = false }: { full?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    try {
      await api.post('/api/auth/logout')
      router.replace('/login')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant={full ? 'outline' : 'ghost'}
      size={full ? 'default' : 'sm'}
      onClick={signOut}
      loading={busy}
      className={full ? 'w-full sm:w-auto' : undefined}
    >
      <LogOut aria-hidden />
      Sign out
    </Button>
  )
}
