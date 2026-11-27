import { describe, expect, it } from 'vitest'
import { addMonths, buildMonthGrid, formatDateBR, isValidIsoDate, rangeEndToShow } from '../dates'

describe('formatDateBR', () => {
  it('converte ISO para dd/mm/aaaa sem passar por fuso horário', () => {
    expect(formatDateBR('2025-08-15')).toBe('15/08/2025')
  })
})

describe('isValidIsoDate', () => {
  it.each([
    ['2025-08-15', true],
    ['2024-02-29', true], // ano bissexto
    ['2025-02-29', false],
    ['2025-02-30', false],
    ['15/08/2025', false],
    ['', false],
  ])('%s → %s', (value, expected) => {
    expect(isValidIsoDate(value)).toBe(expected)
  })
})

describe('addMonths', () => {
  it('vira o ano nos dois sentidos', () => {
    expect(addMonths({ year: 2025, month: 11 }, 1)).toEqual({ year: 2026, month: 0 })
    expect(addMonths({ year: 2025, month: 0 }, -1)).toEqual({ year: 2024, month: 11 })
  })
})

describe('buildMonthGrid', () => {
  // Igual ao Figma: janeiro/2025 começa numa quarta e vai até 01/02.
  it('monta janeiro/2025 começando no domingo 29/12/2024', () => {
    const weeks = buildMonthGrid({ year: 2025, month: 0 })

    expect(weeks).toHaveLength(5)
    expect(weeks[0].map((d) => d.day)).toEqual([29, 30, 31, 1, 2, 3, 4])
    expect(weeks[0][0]).toEqual({ iso: '2024-12-29', day: 29, outside: true })
    expect(weeks[4].map((d) => d.day)).toEqual([26, 27, 28, 29, 30, 31, 1])
    expect(weeks[4][6].outside).toBe(true)
  })

  it('fevereiro/2025 (começa no sábado) tem 5 semanas', () => {
    const weeks = buildMonthGrid({ year: 2025, month: 1 })
    expect(weeks[0].map((d) => d.day)).toEqual([26, 27, 28, 29, 30, 31, 1])
    expect(weeks.flat().filter((d) => !d.outside)).toHaveLength(28)
  })
})

describe('rangeEndToShow (prévia do período ao passar o mouse)', () => {
  it('com as duas datas escolhidas, desenha até a data final (ignora o mouse)', () => {
    expect(rangeEndToShow('2025-08-01', '2025-08-10', '2025-08-20')).toBe('2025-08-10')
  })
  it('com só a inicial, desenha até o dia sob o mouse', () => {
    expect(rangeEndToShow('2025-08-01', undefined, '2025-09-15')).toBe('2025-09-15')
  })
  it('sem prévia com o mouse na própria data inicial, antes dela ou fora do calendário', () => {
    expect(rangeEndToShow('2025-08-10', undefined, '2025-08-10')).toBeUndefined()
    expect(rangeEndToShow('2025-08-10', undefined, '2025-08-01')).toBeUndefined()
    expect(rangeEndToShow('2025-08-10', undefined, undefined)).toBeUndefined()
  })
  it('sem data inicial, não há prévia', () => {
    expect(rangeEndToShow(undefined, undefined, '2025-08-10')).toBeUndefined()
  })
})
