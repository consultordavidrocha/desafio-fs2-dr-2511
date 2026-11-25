import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes, type Ref } from 'react'
import { cn } from '@/lib/cn'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Texto de apoio exibido abaixo do campo (substituído pelo erro, se houver). */
  helperText?: string
  /** Mensagem de erro do campo. */
  error?: string
  /** Marca o campo como inválido sem exibir mensagem (ex.: erro geral do login). */
  invalid?: boolean
  ref?: Ref<HTMLInputElement>
}

/**
 * Campo de texto do Figma: label 16px, input 36px com raio 8 e texto de apoio.
 * Em `type="password"` ganha o botão de mostrar/ocultar senha.
 */
export function TextField({
  label,
  helperText,
  error,
  invalid,
  type = 'text',
  className,
  ref,
  ...props
}: TextFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const hasError = Boolean(error) || invalid
  const message = error ?? helperText
  const messageId = message ? `${id}-message` : undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-label text-ink">
        {label}
      </label>

      <div
        className={cn(
          'flex h-9 items-center gap-2 rounded-lg border bg-surface px-3',
          'focus-within:outline-2 focus-within:outline-offset-1',
          hasError
            ? 'border-danger focus-within:outline-danger/40'
            : 'border-border focus-within:outline-primary/40',
        )}
      >
        <input
          {...props}
          ref={ref}
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={hasError || undefined}
          aria-describedby={messageId}
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-muted"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={revealed}
            className="flex size-5 shrink-0 items-center justify-center rounded text-ink"
          >
            {revealed ? (
              <EyeOff className="size-4" strokeWidth={1.75} aria-hidden />
            ) : (
              <Eye className="size-4" strokeWidth={1.75} aria-hidden />
            )}
          </button>
        )}
      </div>

      {message && (
        <p id={messageId} className={cn('text-body', error ? 'text-danger' : 'text-muted')}>
          {message}
        </p>
      )}
    </div>
  )
}
