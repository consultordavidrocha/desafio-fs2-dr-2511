import type { ReactNode } from 'react'
import illustration685 from '@/assets/images/login-illustration-685w.webp'
import illustration1370 from '@/assets/images/login-illustration-1370w.webp'
import illustration2740 from '@/assets/images/login-illustration-2740w.webp'
import logoDark from '@/assets/images/logo-dark.webp'
import logoLight from '@/assets/images/logo-light.webp'

const TAGLINE = 'Antecipe honorários advocatícios com a JusCash'

/**
 * Moldura das telas de login e cadastro (Figma: "Login e cadastro").
 * - A partir de 1024px: ilustração à esquerda e card à direita.
 * - Abaixo disso: logo escuro + slogan acima do card, sem ilustração.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center lg:flex-row lg:items-stretch lg:justify-between">
      <aside className="hidden p-6 pr-0 lg:flex lg:w-[52.5%] lg:shrink-0">
        <div className="relative w-full overflow-hidden rounded-2xl bg-brand-navy">
          <img
            src={illustration1370}
            srcSet={`${illustration685} 685w, ${illustration1370} 1370w, ${illustration2740} 2740w`}
            sizes="(min-width: 1024px) 53vw, 1px"
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div className="relative flex flex-col gap-4 p-8">
            <img src={logoLight} alt="JusCash" width={199} height={30} />
            <p className="text-surface">{TAGLINE}</p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col items-center justify-center lg:flex-1 lg:px-6 xl:px-24">
        <header className="flex w-full flex-col items-center gap-4 p-8 text-center lg:hidden">
          <img src={logoDark} alt="JusCash" width={199} height={30} />
          <p>{TAGLINE}</p>
        </header>

        <div className="flex w-full flex-col items-center gap-12 px-6 lg:px-0">
          {/* p-[23px]: borda interna do Figma (1px de borda + 23px = 24px). */}
          <section className="w-full rounded-lg border border-border bg-surface p-[23px] shadow-card lg:max-w-[460px]">
            {children}
          </section>
          <footer className="w-full text-center text-muted lg:max-w-[460px]">
            © 2026 • Juscash Administração de Pagamentos e Recebimentos SA
          </footer>
        </div>
      </main>
    </div>
  )
}

/** Título + subtítulo do card (Figma: 25px bold / 13px cinza, centralizados). */
export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-title font-bold">{title}</h1>
      <p className="text-muted">{subtitle}</p>
    </div>
  )
}
