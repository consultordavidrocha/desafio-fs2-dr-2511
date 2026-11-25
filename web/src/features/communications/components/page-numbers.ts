/**
 * Números exibidos: primeira, última e vizinhas da atual, com "…" nos saltos.
 * Ex.: página 6 de 20 → 1 … 5 6 7 … 20
 */
export function pageNumbers(page: number, totalPages: number): (number | 'gap')[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap' as const, p] : [p]))
}
