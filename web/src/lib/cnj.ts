/**
 * Número CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos).
 * A API aceita com ou sem máscara; no front aplicamos a máscara enquanto o
 * usuário digita e só buscamos quando o número está completo.
 */
export const CNJ_DIGITS = 20

/** Mantém só os dígitos (no máximo 20). */
export function cnjDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, CNJ_DIGITS)
}

/** Aplica a máscara de forma progressiva: '1234567891' → '1234567-89.1'. */
export function maskCnj(value: string): string {
  const digits = cnjDigits(value)
  const parts: [number, string][] = [
    [7, ''],
    [9, '-'],
    [13, '.'],
    [14, '.'],
    [16, '.'],
    [20, '.'],
  ]
  let result = ''
  let start = 0
  for (const [end, separator] of parts) {
    if (digits.length <= start) break
    result += (start > 0 ? separator : '') + digits.slice(start, end)
    start = end
  }
  return result
}

export const isCompleteCnj = (value: string): boolean => cnjDigits(value).length === CNJ_DIGITS
