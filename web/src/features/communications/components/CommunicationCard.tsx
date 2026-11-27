import { CalendarDays, FileText, Gavel, Info, Scale, Users } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Card } from '@/components/ui/Card'
import { cnjDigits } from '@/lib/cnj'
import { formatDateBR } from '@/lib/dates'
import { FinalJudgmentBadge } from '@/features/lawsuits/components/FinalJudgment'
import type { Communication, CommunicationListItem } from '../api'
import { ExpandableText, Field, FieldLabel, SummarizeButton } from './fields'

interface CommunicationCardProps {
  communication: CommunicationListItem
  onSummarize?: (communication: Communication) => void
}

/** Card de uma comunicação (Figma: grade de 2 colunas + conteúdo truncado). */
export function CommunicationCard({ communication: c, onSummarize }: CommunicationCardProps) {
  const lawsuit = c.lawsuitClass ? `${c.lawsuitNumber} - ${c.lawsuitClass}` : c.lawsuitNumber
  const recipients = c.recipients.map((r) => r.name).join(', ') || '—'
  const navigate = useNavigate()
  const lawsuitPath = `/processos/${cnjDigits(c.lawsuitNumber)}`

  /**
   * Figma (protótipo): o card inteiro leva aos detalhes do processo.
   * Fica de fora: botões e links ("Resumir", "Ler mais", o próprio link do número)
   * e o fim de uma seleção de texto, para quem quer copiar um trecho.
   * Ctrl/Cmd + clique abre em outra aba, como num link.
   * Teclado e leitor de tela usam o link do número, que é o controle acessível.
   */
  function handleCardClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as Element).closest('a, button, input, select, textarea')) return
    if (window.getSelection()?.toString()) return
    if (event.ctrlKey || event.metaKey) window.open(lawsuitPath, '_blank', 'noopener')
    else navigate(lawsuitPath)
  }

  return (
    <Card
      onClick={handleCardClick}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <article className="flex flex-col gap-4" aria-labelledby={`communication-${c.id}`}>
        {/* Figma: no celular o "Resumir" vem primeiro (topo, à esquerda) e os campos em 1 coluna. */}
        <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start">
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <Field icon={Scale} label="Processo" id={`communication-${c.id}`}>
              {/* Link de verdade: teclado, leitor de tela e "abrir em nova aba" (o clique no card é atalho de mouse/toque). */}
              <Link
                to={lawsuitPath}
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
          {/* Selo do processo ao lado do "Resumir", como na movimentação do Figma (no card, pedido além do Figma). */}
          <div className="flex flex-wrap items-start gap-2">
            {c.lawsuitFinalJudgment && <FinalJudgmentBadge />}
            {onSummarize && <SummarizeButton onClick={() => onSummarize(c)} />}
          </div>
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
