import { CircleAlert } from 'lucide-react'
import { Fragment } from 'react'

/** Selo "Transitou em julgado" (Figma: fundo #FEF2EC, texto #9D231C, raio 8). */
export function FinalJudgmentBadge() {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-lg bg-[#fef2ec] px-2 text-[#9d231c]">
      <CircleAlert className="size-3" strokeWidth={2} aria-hidden />
      Transitou em julgado
    </span>
  )
}

/** Mesma regra da API (api/src/lawsuits/final-judgment.ts), com grupo para o split. */
const FINAL_JUDGMENT_SPLIT = /(tr[âa]nsit\w*\s+em\s+julgado)/gi

/** Texto com a expressão "transitou em julgado" destacada em negrito vermelho (Figma). */
export function HighlightFinalJudgment({ text }: { text: string }) {
  const parts = text.split(FINAL_JUDGMENT_SPLIT)
  return (
    <>
      {parts.map((part, i) =>
        // No split com grupo, as posições ímpares são os trechos encontrados.
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-danger">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
