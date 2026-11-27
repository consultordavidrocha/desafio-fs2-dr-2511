import { apiRequest } from '@/lib/api-client'

export interface Court {
  acronym: string
  name: string
}

export interface Recipient {
  name: string
  side: string | null
}

export interface Communication {
  id: number
  /** Número CNJ já com máscara. */
  lawsuitNumber: string
  lawsuitClass: string | null
  court: string
  /** YYYY-MM-DD */
  availabilityDate: string
  type: string
  documentType: string | null
  courtUnit: string | null
  content: string
  link: string | null
  recipients: Recipient[]
}

/** Item de GET /comunicacoes: inclui a situação do processo da comunicação. */
export interface CommunicationListItem extends Communication {
  /** O processo transitou em julgado (alguma comunicação dele menciona, não só esta). */
  lawsuitFinalJudgment: boolean
}

export interface Page<T> {
  data: T[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

/** Filtros com os nomes de parâmetro do contrato da API. */
export interface CommunicationFilters {
  numeroProcesso?: string
  tribunal?: string
  dataInicio?: string
  dataFim?: string
  page: number
}

export interface CommunicationSummary {
  highlights: string[]
  summary: string
}

export const PAGE_SIZE = 10

export const communicationsApi = {
  list: (filters: CommunicationFilters, signal?: AbortSignal) =>
    apiRequest<Page<CommunicationListItem>>('/comunicacoes', {
      query: { ...filters, pageSize: PAGE_SIZE },
      signal,
    }),

  courts: (signal?: AbortSignal) => apiRequest<Court[]>('/tribunais', { signal }),

  summarize: (id: number, signal?: AbortSignal) =>
    apiRequest<CommunicationSummary>(`/comunicacoes/${id}/resumo`, { method: 'POST', signal }),
}
