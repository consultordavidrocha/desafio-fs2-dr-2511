import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { ApiError } from '@/lib/api-client'
import { communicationsApi, type Communication } from '../api'

interface SummaryModalProps {
  communication: Communication | null
  onClose: () => void
}

/** Modal "Resumo com IA" (bônus): busca o resumo só quando é aberto e guarda em cache. */
export function SummaryModal({ communication, onClose }: SummaryModalProps) {
  const id = communication?.id
  const summary = useQuery({
    queryKey: ['communication-summary', id],
    queryFn: ({ signal }) => communicationsApi.summarize(id!, signal),
    enabled: id !== undefined,
    staleTime: Infinity, // o conteúdo de uma comunicação não muda
  })

  return (
    <Modal open={communication !== null} title="Resumo com IA" onClose={onClose}>
      {summary.isPending ? (
        <div role="status" className="flex items-center justify-center gap-2 py-12 text-muted">
          <Spinner label="Gerando resumo" />
          Gerando resumo...
        </div>
      ) : summary.isError ? (
        <p role="alert" className="py-6 text-danger">
          {summary.error instanceof ApiError
            ? summary.error.message
            : 'Não foi possível gerar o resumo agora. Tente novamente.'}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {summary.data.highlights.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Destaques">
              {summary.data.highlights.map((highlight) => (
                <li key={highlight} className="rounded-md bg-primary/10 px-2 py-1 font-bold text-primary">
                  {highlight}
                </li>
              ))}
            </ul>
          )}
          <p className="text-label whitespace-pre-line">{summary.data.summary}</p>
          <p className="text-muted">
            Resumo automático: trechos mais relevantes selecionados do texto original da
            comunicação. Confira sempre o conteúdo integral.
          </p>
        </div>
      )}
    </Modal>
  )
}
