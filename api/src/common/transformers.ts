import type { TransformFnParams } from 'class-transformer';
import { normalizeCnj } from './cnj';

/** Remove espaços nas pontas de valores string (para usar com @Transform). */
export const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** trim + minúsculas: e-mail é único sem diferenciar maiúsculas. */
export const normalizeEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** String vazia (ou só espaços) vira `undefined`: `?tribunal=` equivale a não filtrar. */
export const emptyToUndefined = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/**
 * Número CNJ → 20 dígitos. Vazio vira `undefined` (sem filtro); número
 * inválido vira '' para falhar na validação seguinte; não-string (ex.:
 * parâmetro repetido) segue como veio e também falha na validação.
 */
export const toCnjDigits = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  if (!value.trim()) return undefined;
  return normalizeCnj(value) ?? '';
};

/** trim + maiúsculas (ex.: sigla de tribunal); vazio vira `undefined`. */
export const toUpperTrimmed = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim() ? value.trim().toUpperCase() : undefined;
};
