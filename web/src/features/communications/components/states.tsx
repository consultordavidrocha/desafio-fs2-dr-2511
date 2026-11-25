import { RotateCw, Search, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/** Barra cinza do skeleton (Figma: 16px de altura, raio 8, #F5F5F5). */
export function Bone({ className }: { className?: string }) {
  return <div className={cn('h-4 animate-pulse rounded-lg bg-page', className)} />
}

/** Skeleton de um card de comunicação (mesma estrutura do Figma). */
export function CommunicationCardSkeleton() {
  return (
    <Card className="flex flex-col gap-2" aria-hidden>
      <div className="flex justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="w-1/2 max-w-[260px]" />
          <Bone className="w-full" />
        </div>
        <div className="flex flex-1 flex-col items-end gap-2">
          <Bone className="w-1/3 max-w-[160px]" />
          <Bone className="w-1/2 max-w-[207px]" />
        </div>
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex flex-col gap-2">
          <Bone className="w-1/3 max-w-[260px]" />
          <Bone className="w-full" />
        </div>
      ))}
    </Card>
  )
}

export function CommunicationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando comunicações" className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <CommunicationCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton da página inteira no primeiro carregamento (Figma: cabeçalho e filtros também). */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2" aria-hidden>
        <Bone className="w-[260px] max-w-full" />
        <Bone className="w-1/2" />
      </Card>
      <Card className="flex gap-4" aria-hidden>
        <Bone className="flex-1" />
        <Bone className="w-[260px]" />
      </Card>
      <CommunicationListSkeleton count={2} />
    </div>
  )
}

interface FeedbackProps {
  icon: LucideIcon
  title: string
  description: string
  tone?: 'neutral' | 'danger'
  action?: ReactNode
}

/** Bloco centralizado de ícone + título + descrição (Figma: "Empty State"). */
function Feedback({ icon: Icon, title, description, tone = 'neutral', action }: FeedbackProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div
        className={cn(
          'flex size-12 items-center justify-center rounded-xl',
          tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-neutral-200',
        )}
      >
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="flex max-w-[300px] flex-col gap-2">
        <p className="font-bold">{title}</p>
        <p className="text-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function EmptyState() {
  return (
    <Feedback
      icon={Search}
      title="Nenhuma comunicação encontrada"
      description="Não encontramos resultados para os filtros aplicados. Tente ajustar os critérios de busca."
    />
  )
}

/** Não existe no Figma: segue o mesmo padrão visual do estado vazio. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert">
      <Feedback
        icon={TriangleAlert}
        tone="danger"
        title="Não foi possível carregar as comunicações"
        description={message}
        action={
          <button
            type="button"
            onClick={onRetry}
            className="flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-3 hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
          >
            <RotateCw className="size-3" strokeWidth={2} aria-hidden />
            Tentar novamente
          </button>
        }
      />
    </div>
  )
}
