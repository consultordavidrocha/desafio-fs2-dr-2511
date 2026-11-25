import { TriangleAlert } from 'lucide-react'

/** Mensagem de erro do formulário inteiro (ex.: "E-mail ou senha incorretos"). */
export function FormAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-center gap-2 text-danger">
      <TriangleAlert className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <p>{message}</p>
    </div>
  )
}
