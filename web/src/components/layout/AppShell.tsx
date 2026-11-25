import { House, PanelLeft, Send, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router'
import logoDark from '@/assets/images/logo-dark.webp'
import { cn } from '@/lib/cn'
import { UserMenu } from './UserMenu'

interface NavItem {
  label: string
  icon: LucideIcon
  to?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Comunicações', icon: House, to: '/comunicacoes' },
  // No Figma, mas fora do escopo do case: exibido como "em breve".
  { label: 'Enviar processo (em breve)', icon: Send },
]

/**
 * Estrutura das telas logadas (Figma: navbar 64px + sidebar 72px).
 * O botão do painel expande a sidebar mostrando os rótulos; no celular,
 * a sidebar fica escondida e o mesmo botão a abre por cima do conteúdo.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-2 py-4 md:px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
            aria-expanded={expanded}
            aria-controls="app-sidebar"
            className="flex size-8 items-center justify-center rounded-lg hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
          >
            <PanelLeft className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
          {/* Figma: no celular a barra mostra só o botão do menu, sem o logo. */}
          <img src={logoDark} alt="JusCash" width={124} height={19} className="hidden md:block" />
        </div>
        <UserMenu />
      </header>

      <div className="flex flex-1">
        <nav
          id="app-sidebar"
          aria-label="Menu principal"
          className={cn(
            'z-20 shrink-0 border-r border-border bg-surface px-4 py-2',
            'fixed top-16 bottom-0 left-0 md:sticky md:h-[calc(100dvh-4rem)]',
            expanded ? 'flex w-56' : 'hidden w-[72px] md:flex',
          )}
        >
          <ul className="flex w-full flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <SidebarItem item={item} expanded={expanded} />
              </li>
            ))}
          </ul>
        </nav>

        {expanded && (
          // Celular: a sidebar abre por cima do conteúdo; clicar fora fecha.
          <div
            aria-hidden
            onClick={() => setExpanded(false)}
            className="fixed inset-0 top-16 z-10 bg-black/20 md:hidden"
          />
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

function SidebarItem({ item, expanded }: { item: NavItem; expanded: boolean }) {
  const Icon = item.icon
  const content = (
    <>
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className={expanded ? 'truncate' : 'sr-only'}>{item.label}</span>
    </>
  )
  const base = 'flex h-9 items-center gap-2 rounded-md px-3'

  if (!item.to) {
    return (
      <span aria-disabled="true" title={item.label} className={cn(base, 'cursor-not-allowed text-ink')}>
        {content}
      </span>
    )
  }
  return (
    <NavLink
      to={item.to}
      title={item.label}
      className={({ isActive }) =>
        cn(base, 'hover:bg-page focus-visible:outline-2 focus-visible:outline-primary', isActive && 'bg-page')
      }
    >
      {content}
    </NavLink>
  )
}
