import { CalendarDays, FileText, Gavel, Info, Scale, Users } from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '@/components/ui/Card'
import { cnjDigits } from '@/lib/cnj'
import { formatDateBR } from '@/lib/dates'
import type { Communication } from '../api'
import { ExpandableText, Field, FieldLabel, SummarizeButton } from './fields'

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
              {/* Figma: o card leva aos detalhes do processo (bônus). */}
              <Link
                to={`/processos/${cnjDigits(c.lawsuitNumber)}`}
                className="break-words hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {lawsuit}
              </Link>
            </Field>
            <Field icon={CalendarDays} label="Data">
              <time dateTime={c.availabilityDate}>{formatDateBR(c.availabilityDate)}</time>
            </Field>
            <Field icon={Gavel} label="Tribunal">{c.court}</Field>
            <Field icon={Info} label="Tipo da comunicação">{c.type}</Field>
          </div>
          {onSummarize && <SummarizeButton onClick={() => onSummarize(c)} />}
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
