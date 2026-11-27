import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { isCompleteCnj } from '@/lib/cnj'
import { isValidIsoDate } from '@/lib/dates'
import { communicationsApi, type CommunicationFilters } from './api'

/**
 * Filtros guardados na URL (?tribunal=TJSP&page=2...): o usuário pode
 * compartilhar o link, recarregar a página e usar o botão "voltar".
 * Valores inválidos digitados na URL são ignorados em vez de quebrar a tela.
 */
export function useCommunicationFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<CommunicationFilters>(() => {
    const numero = params.get('numeroProcesso') ?? ''
    const inicio = params.get('dataInicio')
    const fim = params.get('dataFim')
    const page = Number(params.get('page'))
    return {
      numeroProcesso: isCompleteCnj(numero) ? numero : undefined,
      tribunal: params.get('tribunal') || undefined,
      dataInicio: isValidIsoDate(inicio) ? inicio : undefined,
      dataFim: isValidIsoDate(fim) ? fim : undefined,
      page: Number.isInteger(page) && page > 0 ? page : 1,
    }
  }, [params])

  /** Atualiza filtros; qualquer mudança de filtro volta para a página 1. */
  const updateFilters = useCallback(
    (changes: Partial<CommunicationFilters>) => {
      setParams((current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === '') next.delete(key)
          else next.set(key, String(value))
        }
        if (!('page' in changes)) next.delete('page')
        if (next.get('page') === '1') next.delete('page')
        return next
      }, { preventScrollReset: true }) // a mudança de filtro não leva ao topo (ver RootLayout)
    },
    [setParams],
  )

  return { filters, updateFilters }
}

export function useCommunications(filters: CommunicationFilters) {
  return useQuery({
    queryKey: ['communications', filters],
    queryFn: ({ signal }) => communicationsApi.list(filters, signal),
    // Mantém a página anterior visível enquanto a próxima carrega (sem "piscar").
    placeholderData: keepPreviousData,
  })
}

export function useCourts() {
  return useQuery({
    queryKey: ['courts'],
    queryFn: ({ signal }) => communicationsApi.courts(signal),
    staleTime: Infinity, // a lista de tribunais praticamente não muda
  })
}
