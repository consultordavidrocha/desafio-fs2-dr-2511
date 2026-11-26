import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SlowServerNotice } from '@/components/ui/SlowServerNotice'
import { ApiError } from '@/lib/api-client'
import { CommunicationCard } from '../components/CommunicationCard'
import { FiltersBar } from '../components/FiltersBar'
import { Pagination } from '../components/Pagination'
import { SummaryModal } from '../components/SummaryModal'
import {
  CommunicationListSkeleton,
  EmptyState,
  ErrorState,
  PageSkeleton,
} from '../components/states'
import type { Communication } from '../api'
import { useCommunicationFilters, useCommunications, useCourts } from '../hooks'

/** Tela "Comunicações" (/comunicacoes): filtros na URL + lista paginada. */
export function CommunicationsPage() {
  const { filters, updateFilters } = useCommunicationFilters()
  const courts = useCourts()
  const communications = useCommunications(filters)
  const [summarizing, setSummarizing] = useState<Communication | null>(null)

  // Primeiro carregamento: skeleton da página inteira, como no Figma.
  const firstLoad = communications.isPending || courts.isPending

  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-6">
        {firstLoad ? (
          <>
            <SlowServerNotice active={firstLoad} />
            <PageSkeleton />
          </>
        ) : (
          <>
            <Card className="flex flex-col gap-2">
              <h1 className="text-xl leading-6 font-bold">Comunicações</h1>
              <p className="text-label">
                Acompanhe as comunicações processuais obtidas do Diário de Justiça Eletrônico
                Nacional, organizadas e salvas automaticamente para sua consulta.
              </p>
            </Card>

            <FiltersBar filters={filters} courts={courts.data ?? []} onChange={updateFilters} />

            <Results
              query={communications}
              onSummarize={setSummarizing}
              onPageChange={(page) => {
                updateFilters({ page })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </>
        )}
      </div>
      <SummaryModal communication={summarizing} onClose={() => setSummarizing(null)} />
    </AppShell>
  )
}

function Results({
  query,
  onSummarize,
  onPageChange,
}: {
  query: ReturnType<typeof useCommunications>
  onSummarize: (communication: Communication) => void
  onPageChange: (page: number) => void
}) {
  // Troca de filtro/página: skeleton só na lista (os filtros continuam usáveis).
  if (query.isPlaceholderData && query.isFetching) return <CommunicationListSkeleton />

  if (query.isError) {
    // Erro 4xx tem mensagem útil da API; 5xx/rede vira mensagem amigável.
    const message =
      query.error instanceof ApiError && query.error.status >= 400 && query.error.status < 500
        ? query.error.message
        : 'Tivemos um problema temporário. Tente novamente em instantes.'
    return <ErrorState message={message} onRetry={() => void query.refetch()} />
  }

  const page = query.data
  if (!page || page.data.length === 0) return <EmptyState />

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {page.meta.total} comunicações encontradas
      </p>
      <ul className="flex flex-col gap-4">
        {page.data.map((communication) => (
          <li key={communication.id}>
            <CommunicationCard communication={communication} onSummarize={onSummarize} />
          </li>
        ))}
      </ul>
      <Pagination page={page.meta.page} totalPages={page.meta.totalPages} onPageChange={onPageChange} />
    </>
  )
}
