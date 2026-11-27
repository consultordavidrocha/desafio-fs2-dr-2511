import { CalendarDays, FileText, Gavel, Info, Scale, Users } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router'
import { Card } from '@/components/ui/Card'
import { cnjDigits } from '@/lib/cnj'
import { formatDateBR } from '@/lib/dates'
import type { Communication } from '../api'
import { ExpandableText, Field, FieldLabel, SummarizeButton } from './fields'
import { useExpandableText } from './useExpandableText'

interface CommunicationCardProps {
  communication: Communication
  onSummarize?: (communication: Communication) => void
}

/** Card de uma comunicação (Figma: grade de 2 colunas + conteúdo truncado). */
export function CommunicationCard({ communication: c, onSummarize }: CommunicationCardProps) {
  const lawsuit = c.lawsuitClass ? `${c.lawsuitNumber} - ${c.lawsuitClass}` : c.lawsuitNumber
  const recipients = c.recipients.map((r) => r.name).join(', ') || '—'
  const content = useExpandableText(c.content)

  /**
   * Clique em qualquer parte do card faz o mesmo que "Ler mais"/"Ler menos".
   * Fica de fora: botões e links (Resumir, o próprio Ler mais, o link do processo)
   * e o fim de uma seleção de texto, para quem quer copiar um trecho.
   * Teclado e leitor de tela continuam usando o botão "Ler mais", que é o controle acessível.
   */
  function handleCardClick(event: MouseEvent<HTMLDivElement>) {
    if (!content.canToggle) return
    if ((event.target as Element).closest('a, button, input, select, textarea')) return
    if (window.getSelection()?.toString()) return
    content.toggle()
  }

  return (
    <Card
      onClick={handleCardClick}
      className={`transition-shadow hover:shadow-md ${content.canToggle ? 'cursor-pointer' : ''}`}
    >
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
          <ExpandableText text={c.content} state={content} />
        </div>
      </article>
    </Card>
  )
}
