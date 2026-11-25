import {
  CalendarDays,
  FileText,
  Gavel,
  Info,
  Scale,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { formatDateBR } from '@/lib/dates'
import type { Communication } from '../api'

interface CommunicationCardProps {
  communication: Communication
  onSummarize?: (communication: Communication) => void
}

/** Card de uma comunicação (Figma: grade de 2 colunas + conteúdo truncado). */
export function CommunicationCard({ communication: c, onSummarize }: CommunicationCardProps) {
  const lawsuit = c.lawsuitClass ? `${c.lawsuitNumber} - ${c.lawsuitClass}` : c.lawsuitNumber
  const recipients = c.recipients.map((r) => r.name).join(', ') || '—'

  return (
    <Card className="transition-shadow hover:shadow-md">
      <article className="flex flex-col gap-4" aria-labelledby={`communication-${c.id}`}>
        {/* Figma: no celular o "Resumir" vem primeiro (topo, à esquerda) e os campos em 1 coluna. */}
        <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start">
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <Field icon={Scale} label="Processo" id={`communication-${c.id}`}>
              <span className="break-words">{lawsuit}</span>
            </Field>
            <Field icon={CalendarDays} label="Data">
              <time dateTime={c.availabilityDate}>{formatDateBR(c.availabilityDate)}</time>
            </Field>
            <Field icon={Gavel} label="Tribunal">{c.court}</Field>
            <Field icon={Info} label="Tipo da comunicação">{c.type}</Field>
          </div>
          {onSummarize && (
            <button
              type="button"
              onClick={() => onSummarize(c)}
              className="flex h-8 items-center gap-1 self-start rounded-lg border border-border px-3 hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Sparkles className="size-3" strokeWidth={1.75} aria-hidden />
              Resumir
            </button>
          )}
        </div>

        <Field icon={Users} label="Destinatários">{recipients}</Field>

        <div className="flex flex-col gap-2">
          <FieldLabel icon={FileText} label="Conteúdo" gap="gap-2" />
          <ExpandableText text={c.content} />
        </div>
      </article>
    </Card>
  )
}

function FieldLabel({ icon: Icon, label, gap = 'gap-1' }: { icon: LucideIcon; label: string; gap?: string }) {
  return (
    <p className={`flex items-center ${gap} font-bold text-muted`}>
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {label}
    </p>
  )
}

function Field({ icon, label, id, children }: { icon: LucideIcon; label: string; id?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <FieldLabel icon={icon} label={label} />
      <p id={id} className="text-label">
        {children}
      </p>
    </div>
  )
}

/**
 * Texto limitado a 3 linhas com "Ler mais". O botão só aparece se o texto
 * realmente passar de 3 linhas (medido no DOM, não por contagem de caracteres).
 */
function ExpandableText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || expanded) return
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, expanded])

  return (
    <div className="flex flex-col items-start gap-1">
      <p ref={ref} className={`text-label whitespace-pre-line break-words ${expanded ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="text-link hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {expanded ? 'Ler menos' : 'Ler mais'}
        </button>
      )}
    </div>
  )
}
