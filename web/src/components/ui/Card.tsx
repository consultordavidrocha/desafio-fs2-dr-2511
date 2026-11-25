import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Card padrão do Figma: fundo #FAFAFA, borda #D4D4D4, raio 8, sombra sutil.
 * Padding 23px: no Figma a borda é interna (o conteúdo fica a 24px da borda
 * externa); no CSS a borda soma ao padding, então 1px de borda + 23px = 24px.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('rounded-lg border border-border bg-surface p-[23px] shadow-card', className)}
    />
  )
}
