import type { Communication, Page } from '@/features/communications/api'
import { apiRequest } from '@/lib/api-client'

export interface LawsuitCommunication extends Communication {
  /** O texto menciona trânsito em julgado. */
  mentionsFinalJudgment: boolean
}

export interface LawsuitDetail {
  lawsuit: {
    number: string
    className: string | null
    court: string
    recipients: string[]
    totalCommunications: number
    /** Alguma comunicação do processo menciona trânsito em julgado. */
    finalJudgment: boolean
  }
  communications: LawsuitCommunication[]
  meta: Page<unknown>['meta']
}

export const LAWSUIT_PAGE_SIZE = 10

export const lawsuitsApi = {
  get: (number: string, page: number, signal?: AbortSignal) =>
    apiRequest<LawsuitDetail>(`/processos/${encodeURIComponent(number)}`, {
      query: { page, pageSize: LAWSUIT_PAGE_SIZE },
      signal,
    }),
}
