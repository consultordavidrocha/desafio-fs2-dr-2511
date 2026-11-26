import { cn } from '@/lib/cn'
import { useSlowHint } from '@/lib/use-slow-hint'

/**
 * Aviso exibido quando a API demora (> 5 s) para responder: no plano gratuito do
 * Render, o primeiro acesso depois de um tempo parado leva até ~1 minuto.
 * Não aparece em respostas normais (rápidas).
 */
export function SlowServerNotice({ active, className }: { active: boolean; className?: string }) {
  const slow = useSlowHint(active)
  if (!slow) return null
  return (
    <p role="status" className={cn('text-center text-muted', className)}>
      Estamos ligando o servidor — no primeiro acesso depois de um tempo parado, isso pode levar até
      1 minuto.
    </p>
  )
}
