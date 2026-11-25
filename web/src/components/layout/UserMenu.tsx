import { ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/use-auth'
import { getInitials } from '@/lib/initials'

/** Avatar com as iniciais do usuário + menu com nome, e-mail e "Sair". */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu do usuário${user ? `: ${user.name}` : ''}`}
        className="flex items-center gap-1 rounded-full focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="flex size-8 items-center justify-center rounded-full border border-surface bg-neutral-200 font-bold">
          {getInitials(user?.name)}
        </span>
        <ChevronDown className="size-4" strokeWidth={1.75} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-20 w-60 rounded-lg border border-border bg-surface p-2 shadow-md"
        >
          <div className="px-2 py-1.5">
            <p className="truncate font-bold">{user?.name}</p>
            <p className="truncate text-muted">{user?.email}</p>
          </div>
          <hr className="my-1 border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-page"
          >
            <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
