import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Modal do Figma ("modal (dialog)": 640px, raio 16, cabeçalho, corpo rolável e
 * rodapé com "Fechar"). Usa o <dialog> nativo com showModal(): o navegador já
 * cuida de foco preso no modal, tecla Esc e camada de fundo (::backdrop).
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clique no fundo (fora da caixa) fecha o modal.
      onClick={(event) => event.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className="m-auto flex max-h-[min(691px,calc(100dvh-32px))] w-[min(640px,calc(100vw-32px))] flex-col rounded-2xl border border-border bg-surface p-0 text-ink shadow-[0_4px_6px_-4px_rgb(0_0_0/0.1),0_10px_15px_-3px_rgb(0_0_0/0.1)] backdrop:bg-black/20 [&:not([open])]:hidden"
    >
      <header className="flex items-start gap-2 p-6">
        <h2 id="modal-title" className="flex-1 text-xl leading-6 font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex size-6 items-center justify-center rounded-md hover:bg-page"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6">{children}</div>
      <footer className="flex justify-end p-6">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-lg border border-border px-4 hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
        >
          Fechar
        </button>
      </footer>
    </dialog>
  )
}
