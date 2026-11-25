import { cn } from '@/lib/cn'

interface SpinnerProps {
  className?: string
  /** Texto para leitores de tela. */
  label?: string
}

/** Indicador de carregamento circular (16px, cor herdada do texto). */
export function Spinner({ className, label = 'Carregando' }: SpinnerProps) {
  return (
    <svg
      className={cn('size-4 animate-spin', className)}
      viewBox="0 0 16 16"
      fill="none"
      role="status"
      aria-label={label}
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
