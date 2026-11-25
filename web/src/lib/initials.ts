/**
 * Iniciais para o avatar: primeira letra do primeiro e do último nome.
 * Ignora partículas ("de", "da", "dos"...) para "Amélia de Jesus" virar "AJ".
 */
const PARTICLES = new Set(['de', 'da', 'das', 'do', 'dos', 'e'])

export function getInitials(name: string | undefined): string {
  const words = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !PARTICLES.has(word.toLowerCase()))
  if (words.length === 0) return ''
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toLocaleUpperCase('pt-BR')
}
