import { Sparkles, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ExpandableTextState } from './useExpandableText'

/** Peças compartilhadas pelos cards de comunicação e de movimentação do processo. */

export function SummarizeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 shrink-0 items-center gap-1 self-start rounded-lg border border-border px-3 hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Sparkles className="size-3" strokeWidth={1.75} aria-hidden />
      Resumir
    </button>
  )
}

export function FieldLabel({ icon: Icon, label, gap = 'gap-1' }: { icon: LucideIcon; label: string; gap?: string }) {
  return (
    <p className={`flex items-center ${gap} font-bold text-muted`}>
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {label}
    </p>
  )
}

export function Field({ icon, label, id, children }: { icon: LucideIcon; label: string; id?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <FieldLabel icon={icon} label={label} />
      <p id={id} className="text-label">
        {children}
      </p>
    </div>
  )
}

/** Texto limitado a 3 linhas com "Ler mais" / "Ler menos". */
export function ExpandableText({ text, state }: { text: string; state: ExpandableTextState }) {
  const { ref, expanded, canToggle, toggle } = state
  return (
    <div className="flex flex-col items-start gap-1">
      <p ref={ref} className={`text-label whitespace-pre-line break-words ${expanded ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      {canToggle && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className="text-link hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {expanded ? 'Ler menos' : 'Ler mais'}
        </button>
      )}
    </div>
  )
}
