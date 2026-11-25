/**
 * Número único de processo no padrão CNJ (Resolução 65/2008):
 *   NNNNNNN-DD.AAAA.J.TR.OOOO  →  20 dígitos.
 *
 * No banco guardamos só os dígitos; a máscara é aplicada na saída.
 */
export const CNJ_DIGITS = 20;

const MASKED_OR_PLAIN = /^(\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4})$/;

/**
 * Remove a máscara de um número CNJ. Aceita o número com ou sem máscara
 * (inclusive máscara parcial) e devolve `null` se não for um número CNJ.
 */
export function normalizeCnj(value: string): string | null {
  const trimmed = value.trim();
  if (!MASKED_OR_PLAIN.test(trimmed)) return null;
  return trimmed.replace(/\D/g, '');
}

/** Aplica a máscara NNNNNNN-DD.AAAA.J.TR.OOOO a um número de 20 dígitos. */
export function formatCnj(digits: string): string {
  if (!/^\d{20}$/.test(digits)) return digits;
  return digits.replace(
    /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/,
    '$1-$2.$3.$4.$5.$6',
  );
}
