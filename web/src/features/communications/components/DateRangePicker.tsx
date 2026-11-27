import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  addMonths,
  buildMonthGrid,
  formatDateBR,
  MONTH_NAMES,
  rangeEndToShow,
  todayIso,
  WEEKDAY_NAMES,
  type CalendarDay,
  type IsoDate,
  type YearMonth,
} from '@/lib/dates'

export interface DateRange {
  start?: IsoDate
  end?: IsoDate
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const monthOf = (iso: IsoDate): YearMonth => ({
  year: Number(iso.slice(0, 4)),
  month: Number(iso.slice(5, 7)) - 1,
})

/**
 * Seletor de período com dois meses lado a lado (Figma: "date picker").
 * 1º clique = data inicial, 2º clique = data final (se for anterior à inicial,
 * recomeça a seleção). O filtro só é aplicado quando o período está completo.
 */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange>(value)
  // Dia sob o mouse (ou com foco): com só a data inicial, desenha a prévia do período.
  const [hovered, setHovered] = useState<IsoDate>()
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>(() =>
    monthOf(value.start ?? todayIso()),
  )
  const containerRef = useRef<HTMLDivElement>(null)

  const openPicker = () => {
    setDraft(value)
    setHovered(undefined)
    setVisibleMonth(monthOf(value.start ?? todayIso()))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const selectDay = (iso: IsoDate) => {
    if (!draft.start || draft.end || iso < draft.start) {
      setDraft({ start: iso })
      return
    }
    const range = { start: draft.start, end: iso }
    setDraft(range)
    onChange(range)
    setOpen(false)
  }

  // O que o calendário desenha: o rascunho, com a prévia até o dia sob o mouse.
  const shown: DateRange = { start: draft.start, end: rangeEndToShow(draft.start, draft.end, hovered) }
  const isPreview = Boolean(draft.start && !draft.end && shown.end)

  const hasValue = Boolean(value.start && value.end)
  const label = hasValue
    ? `${formatDateBR(value.start!)} - ${formatDateBR(value.end!)}`
    : 'Data inicial - Data final'

  return (
    <div ref={containerRef} className="relative">
      <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary/40">
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={hasValue ? `Período: ${label}. Alterar` : 'Filtrar por período'}
          className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
        >
          <CalendarDays className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className={cn('truncate', !hasValue && 'text-muted')}>{label}</span>
        </button>
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange({})}
            aria-label="Limpar período"
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Selecionar período"
          className="absolute right-0 top-full z-20 rounded-lg border border-border bg-surface p-4 shadow-[0_2px_4px_-2px_rgb(0_0_0/0.1),0_4px_6px_-1px_rgb(0_0_0/0.1)]"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <MonthNavButton direction="prev" onClick={() => setVisibleMonth((m) => addMonths(m, -1))} />
              <div className="flex flex-1">
                {[0, 1].map((offset) => {
                  const m = addMonths(visibleMonth, offset)
                  return (
                    <p
                      key={offset}
                      className={cn('flex-1 text-center', offset === 1 && 'hidden sm:block')}
                      aria-live="polite"
                    >
                      {MONTH_NAMES[m.month]} {m.year}
                    </p>
                  )
                })}
              </div>
              <MonthNavButton direction="next" onClick={() => setVisibleMonth((m) => addMonths(m, 1))} />
            </div>
            <div className="flex gap-4" onMouseLeave={() => setHovered(undefined)}>
              <MonthGrid month={visibleMonth} range={shown} preview={isPreview} onSelect={selectDay} onHover={setHovered} />
              <div className="hidden sm:block">
                <MonthGrid
                  month={addMonths(visibleMonth, 1)}
                  range={shown}
                  preview={isPreview}
                  onSelect={selectDay}
                  onHover={setHovered}
                />
              </div>
            </div>
            {draft.start && !draft.end && (
              <p className="text-center text-muted">Selecione a data final</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MonthNavButton({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Mês anterior' : 'Próximo mês'}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-page"
    >
      <Icon className="size-4" strokeWidth={1.75} aria-hidden />
    </button>
  )
}

interface MonthGridProps {
  month: YearMonth
  range: DateRange
  /** `range.end` ainda não foi escolhido: é o dia sob o mouse. */
  preview: boolean
  onSelect: (iso: IsoDate) => void
  onHover: (iso: IsoDate) => void
}

function MonthGrid({ month, range, preview, onSelect, onHover }: MonthGridProps) {
  const weeks = buildMonthGrid(month)
  return (
    <table className="border-separate border-spacing-y-px" role="grid">
      <thead>
        <tr>
          {WEEKDAY_NAMES.map((name) => (
            <th key={name} scope="col" className="size-8 text-[10px] leading-3 font-normal text-muted">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0].iso}>
            {week.map((day) => (
              <td key={day.iso} className="p-0">
                <DayButton day={day} range={range} preview={preview} onSelect={onSelect} onHover={onHover} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface DayButtonProps {
  day: CalendarDay
  range: DateRange
  preview: boolean
  onSelect: (iso: IsoDate) => void
  onHover: (iso: IsoDate) => void
}

function DayButton({ day, range, preview, onSelect, onHover }: DayButtonProps) {
  const { start, end } = range
  const isStart = day.iso === start
  const isEnd = day.iso === end && !preview
  // Prévia: o dia sob o mouse fecha a faixa cinza, com contorno verde de "data final".
  const isPreviewEnd = preview && day.iso === end
  const inRange = Boolean(start && end && day.iso > start && day.iso < end)
  // Dias de fora do mês só aparecem para completar a grade (como no Figma).
  const showSelection = !day.outside

  return (
    <button
      type="button"
      onClick={() => onSelect(day.iso)}
      onMouseEnter={() => onHover(day.iso)}
      onFocus={() => onHover(day.iso)}
      aria-label={formatDateBR(day.iso)}
      aria-pressed={showSelection && (isStart || isEnd)}
      className={cn(
        'flex size-8 items-center justify-center text-body',
        day.outside ? 'text-neutral-400' : 'text-ink',
        showSelection && inRange && 'bg-neutral-200',
        showSelection && isPreviewEnd && 'rounded-r-[5px] bg-neutral-200 ring-1 ring-inset ring-[#008633]',
        showSelection && (isStart || isEnd) && 'bg-[#008633] text-surface',
        showSelection && isStart && 'rounded-l-[5px]',
        showSelection && isEnd && 'rounded-r-[5px]',
        !(showSelection && (isStart || isEnd || inRange || isPreviewEnd)) && 'rounded-[5px] hover:bg-page',
      )}
    >
      {day.day}
    </button>
  )
}
