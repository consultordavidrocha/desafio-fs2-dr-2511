import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageNumbers } from './page-numbers'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const button =
  'flex h-8 items-center justify-center gap-1 rounded-lg px-3 hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50'

/** Paginação do Figma: "< Anterior", números (atual com borda), "Próximo >". */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-end gap-1">
      <button type="button" className={button} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="size-3" strokeWidth={2} aria-hidden />
        Anterior
      </button>
      {pageNumbers(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Página ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(button, 'w-8 px-0', p === page && 'border border-border')}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className={button}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próximo
        <ChevronRight className="size-3" strokeWidth={2} aria-hidden />
      </button>
    </nav>
  )
}
