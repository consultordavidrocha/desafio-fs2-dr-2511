import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import logoDark from '@/assets/images/logo-dark.webp'
import { Card } from '@/components/ui/Card'
import {
  BLOCKS,
  DEMO_ACCOUNT,
  EXTRAS,
  PRODUCTION_LINKS,
  PROBLEMS,
  RUN_LOCALLY,
  repoFile,
  repoTree,
  TESTS,
  type GuideLink,
} from '../content'

const SECTIONS = [
  { id: 'links', title: 'Aplicação e repositório' },
  { id: 'blocos', title: 'Onde avaliar cada bloco' },
  { id: 'parte-2', title: 'Parte 2: problemas P1 a P7' },
  { id: 'testes', title: 'Testes' },
  { id: 'alem', title: 'Além do enunciado' },
]

/** Guia do avaliador (/guia): página pública, sem login, com o mapa da entrega. */
export function GuidePage() {
  const totalTests = TESTS.reduce((sum, t) => sum + t.count, 0)

  return (
    <div className="min-h-dvh bg-page">
      <header className="flex h-16 items-center border-b border-border bg-surface px-4">
        <Link
          to="/comunicacoes"
          aria-label="JusCash — abrir a aplicação"
          className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <img src={logoDark} alt="JusCash" width={124} height={19} className="block" />
        </Link>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 text-label md:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-title font-bold text-brand-navy">Guia do avaliador</h1>
          <p className="text-muted">Case Dev Full Stack Pleno · JusCash (FS2) · David Rocha</p>
          <p>
            Atalho para avaliar a entrega: onde está cada parte pedida no case, como testar e o que foi além do
            enunciado. Todos os links levam à aplicação no ar ou ao repositório público.
          </p>
          <nav aria-label="Seções do guia" className="flex flex-wrap gap-x-4 gap-y-1">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-link hover:underline">
                {s.title}
              </a>
            ))}
          </nav>
        </div>

        <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-bold">Testar agora</p>
            <p>
              Conta de demonstração: <code className="rounded bg-page px-1">{DEMO_ACCOUNT.email}</code> /{' '}
              <code className="rounded bg-page px-1">{DEMO_ACCOUNT.password}</code>
            </p>
            <p className="text-body text-muted">
              Se a primeira resposta demorar, a tela avisa que o servidor está ligando (até 1 minuto).
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-body text-surface hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Abrir a aplicação
          </Link>
        </Card>

        <Section id="links" title="Aplicação e repositório">
          {/* Lista, não tabela: no celular cada item empilha; a partir de md vira 3 colunas. */}
          <ul className="flex flex-col">
            {PRODUCTION_LINKS.map((l) => (
              <li
                key={l.label}
                className="flex flex-col gap-1 border-b border-border py-2 md:grid md:grid-cols-[120px_1fr_1fr] md:gap-4"
              >
                <span className="font-bold">{l.label}</span>
                <ExtLink href={l.href} className="break-all">
                  {l.href.replace(/^https:\/\//, '')}
                </ExtLink>
                <span className="text-muted">{l.note}</span>
              </li>
            ))}
          </ul>
          <p className="text-body text-muted">
            Para rodar na sua máquina (um comando sobe banco + API com os dados):{' '}
            <ExtLink href={RUN_LOCALLY}>Como rodar, no README</ExtLink>.
          </p>
        </Section>

        <Section id="blocos" title="Onde avaliar cada bloco">
          <ul className="flex flex-col gap-3">
            {BLOCKS.map((b) => (
              <li key={b.name} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{b.name}</span>
                  <span className="rounded-lg bg-page px-2 text-body text-muted">peso {b.weight}</span>
                </p>
                <p>{b.highlights}</p>
                <LinkList links={b.links} />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="parte-2" title="Parte 2: problemas P1 a P7">
          <p>
            Os arquivos de cada problema são o material original do case, sem alterações (
            <ExtLink href={repoTree('problemas')}>pasta problemas/</ExtLink>). As respostas estão no{' '}
            <ExtLink href={repoFile('RESPOSTAS.md')}>RESPOSTAS.md</ExtLink>.
          </p>
          <ul className="flex flex-col">
            {PROBLEMS.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-1 border-b border-border py-2 md:grid md:grid-cols-[40px_1fr_200px_140px] md:gap-4"
              >
                <span className="font-bold">
                  {p.id}
                  <span className="font-normal md:hidden"> · {p.title}</span>
                </span>
                <span className="hidden md:block">{p.title}</span>
                <span className="flex flex-wrap gap-x-4 md:contents">
                  {p.material ? (
                    <ExtLink href={repoTree(p.material)}>material: {p.material.replace('problemas/', '')}/</ExtLink>
                  ) : (
                    <span className="text-muted">material: só texto</span>
                  )}
                  <ExtLink href={repoFile('RESPOSTAS.md', p.answerAnchor)}>ler a resposta</ExtLink>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="testes" title="Testes">
          <Table head={['Camada', 'Ferramenta', 'Testes']}>
            {TESTS.map((t) => (
              <tr key={t.layer}>
                <Td>{t.layer}</Td>
                <Td>{t.tool}</Td>
                <Td className="text-right tabular-nums">{t.count}</Td>
              </tr>
            ))}
            <tr>
              <Td className="font-bold">Total</Td>
              <Td />
              <Td className="text-right font-bold tabular-nums">{totalTests}</Td>
            </tr>
          </Table>
          <p className="text-body text-muted">
            Todos rodam no CI a cada push, junto com uma trava de 500 linhas por arquivo.{' '}
            <ExtLink href={repoFile('README.md', 'testes')}>Como rodar cada suíte</ExtLink>.
          </p>
        </Section>

        <Section id="alem" title="Além do enunciado">
          <ul className="grid gap-3 md:grid-cols-2">
            {EXTRAS.map((e) => (
              <li key={e.label} className="flex flex-col gap-1 rounded-lg border border-border p-4">
                <ExtLink href={e.href} className="font-bold">
                  {e.label}
                </ExtLink>
                <p>{e.text}</p>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-4">
      <Card className="flex flex-col gap-4">
        <h2 id={`${id}-titulo`} className="text-[20px] leading-6 font-bold text-primary">
          {title}
        </h2>
        {children}
      </Card>
    </section>
  )
}

function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-link hover:underline ${className ?? ''}`}
    >
      {children}
      <ExternalLink className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  )
}

function LinkList({ links }: { links: GuideLink[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {links.map((l) => (
        <li key={l.label}>
          <ExtLink href={l.href}>{l.label}</ExtLink>
        </li>
      ))}
    </ul>
  )
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="border-b border-border px-2 py-2 text-body font-bold text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-border px-2 py-2 align-top ${className ?? ''}`}>{children}</td>
}
