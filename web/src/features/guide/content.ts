/**
 * Conteúdo do Guia do avaliador (/guia). Só material público: aplicação no ar e
 * repositório no GitHub. Nada de arquivos locais nem de notas pessoais.
 *
 * Links para o repositório passam por repoFile/repoTree: o teste
 * (content.test.ts) confere que cada caminho está versionado e que cada âncora
 * existe no Markdown de destino.
 */

const REPO = 'https://github.com/consultordavidrocha/desafio-fs2-dr-2511'
const API = 'https://juscash-api-3xep.onrender.com'

export const repoFile = (path: string, anchor?: string) =>
  `${REPO}/blob/main/${path}${anchor ? `#${anchor}` : ''}`
export const repoTree = (path: string) => `${REPO}/tree/main/${path}`

export interface GuideLink {
  label: string
  href: string
}

export const DEMO_ACCOUNT = { email: 'demo@exemplo.com', password: 'demo12345' }

export const PRODUCTION_LINKS: (GuideLink & { note: string })[] = [
  { label: 'Aplicação', href: 'https://desafio-fs2-dr-2511.vercel.app', note: 'Front na Vercel' },
  { label: 'API', href: API, note: 'NestJS no Render, banco no Neon' },
  { label: 'Swagger', href: `${API}/docs`, note: 'Rotas, contratos e "Try it out"' },
  { label: 'Health check', href: `${API}/health`, note: 'API + banco' },
  { label: 'Repositório', href: REPO, note: 'Código, documentação e Parte 2' },
  { label: 'Kanban', href: 'https://github.com/users/consultordavidrocha/projects/1', note: '32 cards, Backlog → Concluído' },
  { label: 'CI', href: `${REPO}/actions`, note: '5 jobs a cada push' },
]

export interface Block {
  name: string
  weight: string
  highlights: string
  links: GuideLink[]
}

/** Blocos e pesos da avaliação, como no ENUNCIADO. */
export const BLOCKS: Block[] = [
  {
    name: 'Construção da API',
    weight: '20',
    highlights:
      'Contrato à risca (rotas, filtros, 400/401/409), JWT com guard global, bcrypt, validação, rate limit pelo IP real, seed idempotente com os dados do case e docker compose subindo banco + API.',
    links: [
      { label: 'Rotas e exemplos', href: repoFile('README.md', 'api--rotas-e-exemplos') },
      { label: 'Decisões da API', href: repoFile('README.md', 'api') },
      { label: 'Código (api/)', href: repoTree('api') },
      { label: 'Swagger', href: `${API}/docs` },
    ],
  },
  {
    name: 'Front pixel perfect',
    weight: '25',
    highlights:
      'Login, cadastro, comunicações, detalhes do processo e modal de resumo fiéis ao Figma, com todos os estados (carregando, vazio, erro) e responsivo nos 5 tamanhos do Figma.',
    links: [
      { label: 'Funcionalidades e estados', href: repoFile('README.md', 'funcionalidades') },
      { label: 'Decisões do front', href: repoFile('README.md', 'front-1') },
      { label: 'Manual do usuário (PDF)', href: repoFile('docs/manual-do-usuario.pdf') },
      { label: 'Código (web/)', href: repoTree('web') },
    ],
  },
  {
    name: 'Qualidade, testes, Git e README',
    weight: '15',
    highlights:
      '206 testes automatizados em 5 jobs de CI, commits temáticos, README nas seções do template, Kanban e roteiro de teste manual.',
    links: [
      { label: 'README', href: repoFile('README.md') },
      { label: 'Como rodar os testes', href: repoFile('README.md', 'testes') },
      { label: 'Histórico de commits', href: `${REPO}/commits/main` },
      { label: 'Roteiro de teste manual', href: repoFile('docs/roteiro-testes-manuais.md') },
    ],
  },
  {
    name: 'Resolução de problemas (P1 a P7)',
    weight: '30',
    highlights:
      'Respostas no formato do template, com os limites de tamanho respeitados. P1 resolvida em Python, com 37 testes e a saída gerada versionada.',
    links: [
      { label: 'RESPOSTAS.md', href: repoFile('RESPOSTAS.md') },
      { label: 'Material de cada problema', href: repoTree('problemas') },
      { label: 'Código da P1', href: repoTree('problemas/01-migracao/solucao') },
    ],
  },
  {
    name: 'Uso de IA',
    weight: '10',
    highlights:
      'O que foi delegado à IA em cada parte, prompts, erros reais da IA e como foram pegos, como cada coisa foi validada e onde não usar IA.',
    links: [{ label: 'AI_USAGE.md', href: repoFile('AI_USAGE.md') }],
  },
  {
    name: 'Bônus',
    weight: 'até +5',
    highlights:
      'GET /processos/:numero (com o selo "Transitou em julgado") e POST /comunicacoes/:id/resumo, com o modal "Resumo com IA".',
    links: [
      { label: 'Rotas bônus', href: repoFile('README.md', 'api--rotas-e-exemplos') },
      { label: 'Por que o resumo não usa LLM', href: repoFile('README.md', 'api') },
    ],
  },
]

export interface Problem {
  id: string
  title: string
  answerAnchor: string
  material?: string
}

/** Âncoras dos títulos do RESPOSTAS.md (conferidas pelo teste). */
export const PROBLEMS: Problem[] = [
  { id: 'P1', title: 'Migração entre bancos com estruturas diferentes', answerAnchor: 'p1--migração-entre-bancos-com-estruturas-diferentes-', material: 'problemas/01-migracao' },
  { id: 'P2', title: 'Fila RabbitMQ', answerAnchor: 'p2--fila-rabbitmq-', material: 'problemas/02-fila' },
  { id: 'P3', title: 'Kubernetes', answerAnchor: 'p3--kubernetes-', material: 'problemas/03-kubernetes' },
  { id: 'P4', title: 'Code review do PR #142', answerAnchor: 'p4--code-review-do-pr-142-', material: 'problemas/04-code-review' },
  { id: 'P5', title: 'Integração externa instável', answerAnchor: 'p5--integração-externa-instável---até-150-palavras' },
  { id: 'P6', title: 'Consulta lenta', answerAnchor: 'p6--consulta-lenta--até-150-palavras--sql', material: 'problemas/06-consulta-lenta' },
  { id: 'P7', title: 'Dados sensíveis e IA', answerAnchor: 'p7--dados-sensíveis-e-ia---até-150-palavras' },
]

export const TESTS: { layer: string; tool: string; count: number }[] = [
  { layer: 'API, unitários', tool: 'Jest', count: 37 },
  { layer: 'API, e2e contra Postgres real', tool: 'Jest + supertest', count: 60 },
  { layer: 'Front, unitários', tool: 'Vitest', count: 41 },
  { layer: 'Navegador, contra a stack real e sob a CSP de produção', tool: 'Playwright', count: 31 },
  { layer: 'P1, migração', tool: 'pytest', count: 37 },
]

export const EXTRAS: (GuideLink & { text: string })[] = [
  {
    label: 'Auditoria de segurança medida em produção',
    text: 'Sonda que testa o ambiente no ar (tokens forjados, injeção, CORS, rate limit, cabeçalhos, segredos no bundle). Encontrou e corrigiu 4 problemas, entre eles o rate limit contando pelo IP do proxy.',
    href: repoFile('docs/auditoria-seguranca.md'),
  },
  {
    label: 'Banco de dados: antes e depois',
    text: 'Diagramas do legado da P1 para o banco novo e do JSON do CNJ para as tabelas da aplicação, com o de-para coluna a coluna.',
    href: repoFile('docs/banco-de-dados.md'),
  },
  {
    label: 'Documentação técnica (PDF)',
    text: 'Arquitetura, rotas, banco, importação dos dados, configuração, testes e segurança.',
    href: repoFile('docs/documentacao-tecnica.pdf'),
  },
  {
    label: 'Servidor gratuito sem espera',
    text: 'Ping a cada 10 minutos mantém a API acordada; se ainda assim demorar, a tela avisa que o servidor está ligando, em vez de parecer travada.',
    href: repoFile('README.md', 'infraestrutura-e-deploy'),
  },
  {
    label: 'Decisões além do Figma, documentadas',
    text: 'Selo "Transitou em julgado" também no card da lista, prévia do período no calendário e rolagem ao abrir um processo, cada uma com o motivo.',
    href: repoFile('README.md', 'front-1'),
  },
  {
    label: 'Premissas e o que ficou de fora',
    text: 'O que foi interpretado no enunciado, bloqueios e melhorias futuras.',
    href: repoFile('README.md', 'premissas-bloqueios-e-o-que-ficou-de-fora'),
  },
]

export const RUN_LOCALLY = repoFile('README.md', 'como-rodar')
