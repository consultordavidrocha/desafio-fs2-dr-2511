import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Converte "YYYY-MM-DD" em Date (meia-noite UTC) ou devolve `null` se a
 * string não estiver no formato ou não for uma data real (ex.: 2025-02-30).
 */
export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  // Date "corrige" datas inexistentes (30/02 vira 02/03); comparamos de volta.
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    ? date
    : null;
}

/** Valida uma data no formato YYYY-MM-DD que exista no calendário. */
export function IsDateOnly(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) =>
    registerDecorator({
      name: 'isDateOnly',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: {
        message: `${propertyName.toString()} deve ser uma data válida no formato YYYY-MM-DD.`,
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && parseDateOnly(value) !== null,
      },
    });
}
