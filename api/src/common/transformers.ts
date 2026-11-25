import type { TransformFnParams } from 'class-transformer';

/** Remove espaços nas pontas de valores string (para usar com @Transform). */
export const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** trim + minúsculas: e-mail é único sem diferenciar maiúsculas. */
export const normalizeEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
