/**
 * Detecção de "trânsito em julgado" no texto de uma comunicação.
 *
 * Cobre as formas comuns: "transitou em julgado", "trânsito em julgado",
 * "transitada em julgado", "transitado em julgado" (com ou sem acento).
 *
 * A mesma regra existe em duas versões que precisam ficar sincronizadas:
 * - JS: marca cada movimentação da página;
 * - SQL (Postgres, `~*`): diz se *alguma* movimentação do processo tem a
 *   expressão, sem trazer todos os textos do banco só para isso.
 */
export const FINAL_JUDGMENT_REGEX = /tr[âa]nsit\w*\s+em\s+julgado/i;

/** Equivalente em POSIX regex do Postgres (\w → [[:alnum:]_], \s → [[:space:]]). */
export const FINAL_JUDGMENT_SQL_PATTERN =
  'tr[âa]nsit[[:alnum:]_]*[[:space:]]+em[[:space:]]+julgado';

export const mentionsFinalJudgment = (text: string): boolean =>
  FINAL_JUDGMENT_REGEX.test(text);
