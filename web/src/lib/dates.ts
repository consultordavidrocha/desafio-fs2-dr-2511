/**
 * Datas "puras" (sem hora) no formato ISO YYYY-MM-DD, como a API usa.
 *
 * Tudo é feito com strings e Date em UTC para não sofrer com fuso horário:
 * `new Date('2025-08-15')` à meia-noite local pode virar dia 14 no Brasil (UTC-3).
 */

export type IsoDate = string // 'YYYY-MM-DD'

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
export const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

/** '2025-08-15' → '15/08/2025' */
export function formatDateBR(iso: IsoDate): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

/** Monta o ISO de um dia, com zeros à esquerda. `month` começa em 0 (como no Date). */
export function toIsoDate(year: number, month: number, day: number): IsoDate {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Data de hoje no fuso do navegador, em ISO. */
export function todayIso(): IsoDate {
  const now = new Date()
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Valida 'YYYY-MM-DD' e se o dia existe (rejeita 2025-02-30). */
export function isValidIsoDate(value: string | null | undefined): value is IsoDate {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

export interface CalendarDay {
  iso: IsoDate
  day: number
  /** Dia de outro mês, exibido só para completar a grade. */
  outside: boolean
}

/** Mês de referência (ano + mês 0-11) com navegação que vira o ano. */
export interface YearMonth {
  year: number
  month: number
}

export function addMonths({ year, month }: YearMonth, amount: number): YearMonth {
  const total = year * 12 + month + amount
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

/**
 * Grade do calendário: semanas começando no domingo, completando com dias
 * do mês anterior/seguinte. Gera só as semanas necessárias (4 a 6).
 */
export function buildMonthGrid({ year, month }: YearMonth): CalendarDay[][] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7

  const weeks: CalendarDay[][] = []
  for (let cell = 0; cell < totalCells; cell++) {
    const date = new Date(Date.UTC(year, month, cell - firstWeekday + 1))
    const day: CalendarDay = {
      iso: toIsoDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      day: date.getUTCDate(),
      outside: date.getUTCMonth() !== month,
    }
    if (cell % 7 === 0) weeks.push([])
    weeks[weeks.length - 1].push(day)
  }
  return weeks
}

/**
 * Fim do período a desenhar no calendário. Com as duas datas escolhidas, é a
 * data final. Com só a inicial, é o dia sob o mouse (prévia do período, como no
 * Airbnb), desde que depois da inicial: antes dela, o clique recomeça a seleção.
 */
export function rangeEndToShow(start?: IsoDate, end?: IsoDate, hovered?: IsoDate): IsoDate | undefined {
  if (end) return end
  if (start && hovered && hovered > start) return hovered
  return undefined
}
