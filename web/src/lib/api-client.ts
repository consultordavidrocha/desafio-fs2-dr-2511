/**
 * Cliente HTTP da API. Centraliza: URL base, token de acesso, JSON e erros.
 */
import { tokenStorage } from './token-storage'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8888').replace(/\/$/, '')

/** Erro de resposta da API, com o status HTTP e a mensagem já pronta para exibir. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Evento disparado quando a API responde 401 numa rota autenticada (sessão expirada). */
export const UNAUTHORIZED_EVENT = 'api:unauthorized'

type QueryValue = string | number | undefined | null

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

/** O NestJS devolve `message` como string ou lista de strings (erros de validação). */
function extractMessage(payload: unknown, fallback: string): string {
  const message = (payload as { message?: unknown } | null)?.message
  if (Array.isArray(message)) return message.join(' ')
  return typeof message === 'string' ? message : fallback
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_URL}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    // Parâmetro vazio não é enviado: a API trata ausência como "sem filtro".
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStorage.get()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.')
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(
      response.status,
      extractMessage(payload, 'Algo deu errado. Tente novamente em instantes.'),
    )
  }
  return payload as T
}
