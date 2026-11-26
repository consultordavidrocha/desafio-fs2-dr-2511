import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronRight, FileText, History, Scale, Users, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SlowServerNotice } from '@/components/ui/SlowServerNotice'
import type { Communication } from '@/features/communications/api'
import { Field, FieldLabel, SummarizeButton } from '@/features/communications/components/fields'
import { Pagination } from '@/features/communications/components/Pagination'
import { SummaryModal } from '@/features/communications/components/SummaryModal'
import { Bone, CommunicationListSkeleton, ErrorState } from '@/features/communications/components/states'
import { ApiError } from '@/lib/api-client'
import { formatDateBR } from '@/lib/dates'
import { lawsuitsApi, type LawsuitCommunication, type LawsuitDetail } from '../api'
import { FinalJudgmentBadge, HighlightFinalJudgment } from '../components/FinalJudgment'

/** Tela "Detalhes do processo" (/processos/:numero, bônus). */
export function LawsuitPage() {
  const { numero = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [summarizing, setSummarizing] = useState<Communication | null>(null)

  const query = useQuery({
    queryKey: ['lawsuit', numero, page],
    queryFn: ({ signal }) => lawsuitsApi.get(numero, page, signal),
    placeholderData: keepPreviousData,
  })

  const goToPage = (next: number) => {
    setParams(next > 1 ? { page: String(next) } : {})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppShell>
      <nav aria-label="Navegação estrutural" className="px-6 pt-4">
        <ol className="flex h-9 items-center gap-2 px-3">
          <li>
            <Link to="/comunicacoes" className="text-muted hover:text-ink hover:underline">
              Diário Oficial
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </li>
          <li aria-current="page" className="font-bold">
            Detalhes do processo
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-4 p-6">
        <PageContent query={query} onSummarize={setSummarizing} onPageChange={goToPage} />
      </div>
      <SummaryModal communication={summarizing} onClose={() => setSummarizing(null)} />
    </AppShell>
  )
}

function PageContent({
  query,
  onSummarize,
  onPageChange,
}: {
  query: ReturnType<typeof useQuery<LawsuitDetail>>
  onSummarize: (communication: Communication) => void
  onPageChange: (page: number) => void
}) {
  if (query.isPending) {
    return (
      <>
        <SlowServerNotice active />
        <Card className="flex flex-col gap-5" aria-hidden>
          <Bone className="w-1/2" />
          <Bone className="w-2/3" />
        </Card>
        <CommunicationListSkeleton count={2} />
      </>
    )
  }

  if (query.isError) {
    if (query.error instanceof ApiError && [400, 404].includes(query.error.status)) {
      return <NotFound />
    }
    return (
      <ErrorState
        message="Tivemos um problema temporário. Tente novamente em instantes."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const { lawsuit, communications, meta } = query.data
  const loadingPage = query.isPlaceholderData && query.isFetching

  return (
    <>
      <LawsuitHeader lawsuit={lawsuit} />
      {loadingPage ? (
        <CommunicationListSkeleton count={2} />
      ) : (
        <ul className="flex flex-col gap-4">
          {communications.map((communication) => (
            <li key={communication.id}>
              <MovementCard communication={communication} onSummarize={onSummarize} />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />
    </>
  )
}

function LawsuitHeader({ lawsuit }: { lawsuit: LawsuitDetail['lawsuit'] }) {
  const title = lawsuit.className ? `${lawsuit.number} - ${lawsuit.className}` : lawsuit.number
  const updates = lawsuit.totalCommunications
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:gap-6">
        <h1 className="flex-1 text-xl leading-6 font-bold break-words">{title}</h1>
        {lawsuit.finalJudgment && <FinalJudgmentBadge />}
      </div>
      {/* Figma: tribunal | destinatários | atualizações, separados por linhas verticais. */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-label">
        <Meta icon={Scale} label="Tribunal">{lawsuit.court}</Meta>
        <Divider />
        <Meta icon={Users} label="Destinatários">{lawsuit.recipients.join(', ') || '—'}</Meta>
        <Divider />
        <Meta icon={History} label="Atualizações">
          {updates} {updates === 1 ? 'atualização' : 'atualizações'}
        </Meta>
      </ul>
    </Card>
  )
}

function Meta({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-center gap-3">
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-label={label} />
      <span className="break-words">{children}</span>
    </li>
  )
}

const Divider = () => <li aria-hidden className="hidden h-[18px] border-l border-border sm:block" />

/** Movimentação: data, destinatários e conteúdo completo (sem "Ler mais", como no Figma). */
function MovementCard({
  communication: c,
  onSummarize,
}: {
  communication: LawsuitCommunication
  onSummarize: (communication: Communication) => void
}) {
  return (
    <Card>
      <article className="flex flex-col gap-4">
        <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start">
          <div className="flex-1">
            <Field icon={CalendarDays} label="Data">
              <time dateTime={c.availabilityDate}>{formatDateBR(c.availabilityDate)}</time>
            </Field>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {c.mentionsFinalJudgment && <FinalJudgmentBadge />}
            <SummarizeButton onClick={() => onSummarize(c)} />
          </div>
        </div>
        <Field icon={Users} label="Destinatários">
          {c.recipients.map((r) => r.name).join(', ') || '—'}
        </Field>
        <div className="flex flex-col gap-2">
          <FieldLabel icon={FileText} label="Conteúdo da movimentação" gap="gap-2" />
          <p className="text-label whitespace-pre-line break-words">
            {c.mentionsFinalJudgment ? <HighlightFinalJudgment text={c.content} /> : c.content}
          </p>
        </div>
      </article>
    </Card>
  )
}

function NotFound() {
  return (
    <Card className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="font-bold">Processo não encontrado</p>
      <p className="text-muted">Verifique o número informado ou volte para as comunicações.</p>
      <Link to="/comunicacoes" className="mt-2 text-link hover:underline">
        Voltar para Comunicações
      </Link>
    </Card>
  )
}
