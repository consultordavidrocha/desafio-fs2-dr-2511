import { useEffect, useState } from 'react'

/** Depois de quanto tempo esperando a API vale explicar a demora ao usuário. */
export const SLOW_HINT_DELAY_MS = 5_000

/**
 * `true` quando `active` (ex.: uma requisição em andamento) já dura mais que `delayMs`.
 * Usado para explicar o "acordar" da API no plano gratuito do Render (~50 s no
 * primeiro acesso depois de um tempo parada), em vez de deixar a tela parecer travada.
 */
export function useSlowHint(active: boolean, delayMs = SLOW_HINT_DELAY_MS): boolean {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setSlow(true), delayMs)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [active, delayMs])

  return active && slow
}
