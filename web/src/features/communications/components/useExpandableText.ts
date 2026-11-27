import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Estado do texto limitado a 3 linhas. Fica fora do <ExpandableText> para que o
 * card inteiro possa expandir/recolher pelo mesmo estado do botão "Ler mais".
 * `canToggle` só é verdadeiro se o texto realmente passar de 3 linhas (medido no
 * DOM, não por contagem de caracteres) ou se já estiver expandido.
 */
export function useExpandableText(text: string) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || expanded) return
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, expanded])

  return { ref, expanded, canToggle: overflows || expanded, toggle: () => setExpanded((value) => !value) }
}

export type ExpandableTextState = ReturnType<typeof useExpandableText>
