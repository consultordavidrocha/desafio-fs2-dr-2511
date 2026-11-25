import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Mostra o spinner no lugar do texto e bloqueia novos cliques. */
  loading?: boolean
}

/** Botão primário do Figma: 36px de altura, azul JusCash, raio 8. */
export function Button({ loading = false, disabled, className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-body text-surface',
        'transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed',
        !loading && 'disabled:opacity-60',
        className,
      )}
    >
      {loading ? <Spinner label="Enviando" /> : children}
    </button>
  )
}
