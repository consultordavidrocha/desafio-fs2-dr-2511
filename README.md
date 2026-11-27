# JusCash Comunicações — David Rocha - FS2

[![CI](https://github.com/consultordavidrocha/desafio-fs2-dr-2511/actions/workflows/ci.yml/badge.svg)](https://github.com/consultordavidrocha/desafio-fs2-dr-2511/actions/workflows/ci.yml)

Aplicação para advogados acompanharem **comunicações processuais** (intimações, citações,
editais) publicadas no Diário de Justiça Eletrônico Nacional: criar conta, entrar, consultar e
filtrar comunicações, ver o detalhe de um processo e gerar um resumo do conteúdo.

| Parte | Stack |
|---|---|
| API (`api/`) | Node.js 24 · NestJS 11 · TypeScript · PostgreSQL 16 · Prisma 6 · JWT · Swagger |
| Front (`web/`) | React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · React Router 8 · TanStack Query · React Hook Form + Zod |
| Infra | Docker Compose (Postgres + API com dados carregados) |

### Produção

| | URL |
|---|---|
| **Aplicação** | <https://desafio-fs2-dr-2511.vercel.app> |
| **API** | <https://juscash-api-3xep.onrender.com> |
| **Swagger** | <https://juscash-api-3xep.onrender.com/docs> |
| **Kanban** | <https://github.com/users/consultordavidrocha/projects/1> |
| **Guia do avaliador** | <https://desafio-fs2-dr-2511.vercel.app/guia>: onde avaliar cada bloco, sem precisar de login |

> A API está no plano gratuito do Render, que "dorme" após ~15 min sem uso. Um ping a cada 10 min
> a mantém acordada (ver [Infraestrutura e deploy](#infraestrutura-e-deploy)); se ainda assim o
> primeiro acesso demorar (~50 s), a tela avisa que o servidor está ligando.

---

---

## Sumário

1. [Como rodar](#como-rodar)
2. [Decisões técnicas](#decisões-técnicas)
3. [Premissas, bloqueios e o que ficou de fora](#premissas-bloqueios-e-o-que-ficou-de-fora)
4. [Funcionalidades](#funcionalidades)
5. [API — rotas e exemplos](#api--rotas-e-exemplos)
6. [Fluxo de trabalho (Kanban)](#fluxo-de-trabalho-kanban)
7. [Horas gastas](#horas-gastas)
8. [Estrutura do repositório](#estrutura-do-repositório)

---

## Como rodar

### Requisitos

- **Docker** e **Docker Compose** (para banco + API)
- **Node.js 24+** e **npm** (para o front e para rodar a API/testes fora do Docker)

### Portas

| Serviço | Porta | Variável para trocar |
|---|---|---|
| API | `8888` | `API_HOST_PORT` |
| Front | `3099` | — (`web/vite.config.ts`) |
| Postgres | `5434` | `DB_HOST_PORT` |

As portas fogem das padrão (3000/5432) para não conflitar com outros projetos locais.

### Banco + API (Docker) — um comando

```bash
docker compose up -d --build
```

Isso sobe o Postgres, aplica as migrations, **carrega `dados/tribunais.json` e
`dados/comunicacoes.json`** (seed idempotente) e inicia a API.

- API: <http://localhost:8888>
- Swagger: <http://localhost:8888/docs>
- Saúde: <http://localhost:8888/health>

### Usuário de teste

O seed cria uma conta de demonstração (local e produção):

| E-mail | Senha |
|---|---|
| `demo@exemplo.com` | `demo12345` |

Os dados do case são fictícios; a conta pode ser desligada com `SEED_DEMO_USER=false` ou trocada com
`DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`.

### Front

```bash
cd web
cp .env.example .env.local   # VITE_API_URL=http://localhost:8888
npm install
npm run dev                  # http://localhost:3099
```

### API fora do Docker (desenvolvimento)

```bash
docker compose up -d db      # só o Postgres
cd api
cp .env.example .env         # troque o JWT_SECRET (instruções no arquivo)
npm install
npx prisma migrate deploy
npm run seed:dev             # carrega ../dados
npm run start:dev            # http://localhost:8888
```

### Variáveis de ambiente

**API** (`api/.env.example`): `DATABASE_URL`, `JWT_SECRET` (mín. 32 caracteres, a API não sobe
sem ele), `JWT_EXPIRES_IN` (padrão `1d`), `CORS_ORIGIN` (origens separadas por vírgula),
`PORT`, `SEED_DATA_DIR` (pasta dos JSONs; padrão `../dados`).

**Front** (`web/.env.example`): `VITE_API_URL`.

### Testes

| Onde | Comando | O que cobre |
|---|---|---|
| API — unitários | `cd api && npm test` | AuthService, máscara/normalização CNJ, mapper do seed, resumidor, detecção de trânsito em julgado |
| API — e2e | `cd api && npm run test:e2e` | Postgres real (`juscash_test`): todos os status do contrato, filtros isolados e combinados, limites inclusivos, paginação estável, processos, resumo, rate limit e cabeçalhos de segurança |
| Front — unitários | `cd web && npm test` | máscara CNJ, datas/grade do calendário, iniciais, paginação |
| **E2E no navegador** | `cd web && npm run test:e2e` | Playwright contra a stack real (Postgres + API + build do front): login, erros e validações do cadastro, sessão e logout, lista e paginação, filtros (número com máscara, tribunal, calendário de 2 meses), vazio, erro com "Tentar novamente", "Ler mais", clique no card abrindo o processo (sem atrapalhar "Ler mais", "Resumir" e a seleção de texto), modal de resumo, detalhes do processo com selo, celular, aviso de servidor lento (aparece só com a API demorando), cabeçalhos de segurança e **nenhuma violação da CSP** (o preview aplica os mesmos cabeçalhos da Vercel) |
| P1 — migração | `cd problemas/01-migracao/solucao && python -m pytest` | regras de dinheiro, deságio, status, CPF/CNJ e o `legado.csv` completo |
| Segurança (sonda) | `node scripts/auditoria/sonda-seguranca.mjs` | contra o ambiente vivo: rotas sem token, JWT forjado, injeção, CORS, rate limit, cabeçalhos, segredos no bundle ([relatório](docs/auditoria-seguranca.md)) |
| Tamanho de arquivo | `node scripts/check-file-size.mjs` | nenhum arquivo de código acima de 500 linhas |
| **Manual** | [`docs/roteiro-testes-manuais.md`](docs/roteiro-testes-manuais.md) | roteiro com checklist: fidelidade ao Figma, teclado, celular real, produção e Swagger |

**CI (GitHub Actions):** a cada push na `main` e em todo PR rodam, em paralelo: API (lint, unitários,
e2e com Postgres 16, build), front (lint, unitários, build), **e2e no navegador** (sobe banco e API com
`docker compose`, roda o Playwright e guarda relatório e trace se falhar), P1 (pytest) e a trava de
500 linhas ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

**Como rodar o e2e do navegador localmente:**

```bash
AUTH_RATE_LIMIT=1000 docker compose up -d --build --wait   # banco + API com os dados (limite alto: a suíte faz vários logins)
cd web && npx playwright install chromium                  # só na primeira vez (ou use o Chrome instalado)
npm run test:e2e                                           # builda o front, sobe o preview na 3099 e roda os 24 testes
```

Contra a **produção**, rode arquivos isolados — a suíte inteira faz dezenas de logins e o rate limit de
produção (5/min por IP) bloqueia, como deve:

```bash
E2E_BASE_URL=https://desafio-fs2-dr-2511.vercel.app npx playwright test e2e/processo.spec.ts
```

Nesse modo os tempos de espera são maiores, para cobrir os ~50 s da API acordando no plano gratuito.

Os testes e2e da API exigem o Postgres do compose (`docker compose up -d db`); o banco de teste é
criado automaticamente e o `api/.env.test` já está versionado (sem segredos reais).

> **Dependências novas no front/API:** depois de `npm install <pacote>`, rode
> `bash scripts/regenerar-lock.sh web` (ou `api`). Ele regenera o `package-lock.json` num container
> Linux: o lock gerado no Windows pode não ter as dependências opcionais que o Linux do CI, do Render
> e da Vercel esperam, e o `npm ci` falha.

> **Windows:** se o projeto for aberto com a letra do drive em minúsculo (`c:\…`), o Vitest pode
> carregar duas instâncias de si mesmo e falhar com `reading 'config'`. Rode a partir de `C:\…`.

---

## Decisões técnicas

### API

```
api/src/
├── auth/            cadastro, login, guard JWT global, DTOs
├── courts/          GET /tribunais
├── communications/  GET /comunicacoes, resumo (summary/)
├── lawsuits/        GET /processos/:numero, detecção de trânsito em julgado
├── database/seed/   importação dos JSONs (mapper formato CNJ → modelo)
├── common/          CNJ, validadores e transformações reutilizáveis
├── config/          validação das variáveis de ambiente
└── prisma/          PrismaService
```

**Modelo de dados** (`api/prisma/schema.prisma`): `users`, `courts`, `lawsuits`,
`communications`, `recipients`. Identificadores em inglês; tabelas em `snake_case`. O número
CNJ é guardado só com dígitos (máscara aplicada na saída). Índices compostos cobrem os filtros
já na ordem da listagem (`availability_date DESC, id DESC`). Diagramas de **antes e depois**
(o JSON do CNJ → estas tabelas, e o legado da P1 → o banco novo) em
[`docs/banco-de-dados.md`](docs/banco-de-dados.md).

| Decisão | Motivo |
|---|---|
| **Guard JWT global** + `@Public()` | Rota nova nasce protegida; esquecer o decorator gera 401, não vazamento |
| **bcrypt** (custo 10), senha de 8 a 72 caracteres | bcrypt ignora bytes após o 72º; rejeitar evita senha "truncada" sem aviso |
| **Mesma resposta** para e-mail inexistente e senha errada (com hash "dummy") | Não revela quais e-mails estão cadastrados, nem pelo tempo de resposta |
| **Rate limit** em login e cadastro (5/min por IP, `@nestjs/throttler`) + `trust proxy` | Freia força bruta; atrás do proxy do Render, o limite vale por IP real do cliente |
| **409 pela constraint única** do banco | Sem corrida entre dois cadastros simultâneos ("consultar e inserir" teria) |
| `ValidationPipe` com `whitelist` + `forbidNonWhitelisted` | Campo não previsto → 400; nada inesperado chega ao serviço |
| Variáveis de ambiente validadas na subida | Configuração faltando derruba a API logo, não em produção às 3h |
| **Seed idempotente, em lotes**, rejeitando registros inválidos com motivo no log | Pode rodar a cada subida; dado sujo não derruba a importação |
| **Resumo extrativo** (sem LLM) | Não envia dados de processos (nomes, CPF) a terceiros; sem chave/custo; determinístico e testável. Seleciona as frases mais relevantes por termos jurídicos e destaca prazo, audiência e trânsito em julgado |
| Trânsito em julgado detectado por regex (no Postgres com `~*` e em JS) | O selo do processo considera **todas** as comunicações, não só a página exibida |

### Infraestrutura e deploy

| Peça | Escolha | Motivo |
|---|---|---|
| Banco | **Neon** (Postgres serverless, `aws-us-east-1`) | Do provedor só preciso de Postgres (auth e regras ficam na API). Plano gratuito que religa sozinho após ociosidade e **branching** (cópia do banco em segundos) para testar migrations. Usado como Postgres puro — só `DATABASE_URL` + Prisma —, então trocar de provedor é um `pg_dump`/restore |
| API | **Render** (Docker, `virginia`) | Roda a mesma imagem do `docker compose`; na **mesma região do banco**, porque cada requisição faz várias consultas em sequência e a distância API ↔ banco é o que mais pesa na latência |
| Front | **Vercel** | Build do Vite e SPA estática com rewrite para o `index.html` |

**Alternativa considerada — Supabase:** excelente quando se usa a plataforma inteira (Auth,
Storage, Realtime, API automática via PostgREST + RLS). Aqui não usaria nada disso, e no plano
gratuito o projeto pausa após uma semana sem uso. As Edge Functions (Supabase) e as Neon Functions
também não se aplicam: a API é NestJS. Em produção para usuários no Brasil, o ideal seria API e
banco em São Paulo (o Neon tem Postgres em `aws-sa-east-1`; o Render não tem região no Brasil).

**Primeiro acesso lento (plano gratuito).** O Render desliga a API após ~15 min sem tráfego (~50 s
para acordar) e o Neon suspende o banco após ~5 min (religa em menos de 1 s). Diagnosticado pelos
eventos do Neon (`suspend_compute` / `start_compute`) num acesso real. Duas mitigações:

| Mitigação | Como |
|---|---|
| **Keep-alive** | Um pinger externo (**cron-job.org**, cron `*/10 * * * *`) chama `GET /live` a cada 10 min, **24 h por dia**. Um serviço ligado o mês inteiro gasta 720–744 h, dentro das 750 h gratuitas do Render por workspace. O GitHub Actions ([`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml)) faz o mesmo como reserva. O `/live` **não consulta o banco**: o Neon continua desligando quando ocioso e não gasta a cota de processamento |
| **Aviso na tela** | Se a API demorar mais de 5 s (login, cadastro, lista ou processo), aparece "Estamos ligando o servidor — … pode levar até 1 minuto", em vez de a tela parecer travada |

Por que um pinger externo: o agendamento do GitHub é "melhor esforço". Pode atrasar ou pular
execuções, e no dia em que foi criado passou mais de 1 h sem rodar. Por isso ficou só como reserva,
nos minutos 7, 17, 27…, longe da virada de hora. Ele também é pausado após 60 dias sem commits. O
cron-job.org fica fora do repositório (configurado no painel dele). Em produção paga, nada disso
seria preciso, porque o plano pago do Render não dorme. Se o ping falhar, o primeiro acesso volta a
levar ~50 s, com o aviso na tela.

### Segurança

Auditoria feita com o sistema no ar, medindo cada proteção contra o ambiente vivo
([relatório completo](docs/auditoria-seguranca.md), sonda reproduzível em
[`scripts/auditoria/`](scripts/auditoria/sonda-seguranca.mjs)).

- **Já existia:** JWT em todas as rotas, exceto as marcadas `@Public()` (*guard* global); bcrypt; a mesma
  mensagem e o mesmo tempo para e-mail inexistente e senha errada; rate limit no login e no cadastro;
  whitelist que recusa campos extras; SQL só parametrizado; CORS restrito à origem da Vercel.
- **Corrigido na auditoria:** o rate limit contava pelo IP de um balanceador interno do Render, e não
  pelo do usuário (medido com uma rota de diagnóstico temporária; agora a API confia só nos proxies conhecidos, rede
  privada e faixas da Cloudflare, e usa o primeiro IP de fora deles); `page` gigante devolvia 500 (agora 400, com teto de 10 mil); a API ganhou
  cabeçalhos de segurança (`helmet`) e deixou de expor o `x-powered-by`; o front ganhou CSP estrita
  (`script-src 'self'`, sem `unsafe-inline`), anti-frame e nosniff. A suíte Playwright roda sob a mesma CSP.
- **Riscos aceitos, com motivo:** CVEs no CLI do Prisma (só roda nas migrations, sem entrada de usuário;
  a correção exige o Prisma 7), token no `localStorage` (mitigado pela CSP), JWT sem revogação e cadastro
  aberto (exigido pelo case). Os detalhes estão no relatório.

### Front

```
web/src/
├── components/ui/      Button, TextField, Card, Modal, Spinner…
├── components/layout/  AppShell (navbar + sidebar), UserMenu
├── features/auth/      login, cadastro, sessão (AuthProvider)
├── features/communications/  lista, filtros, calendário, resumo
├── features/lawsuits/  detalhes do processo
├── lib/                cliente HTTP, CNJ, datas, iniciais
└── routes/             rotas (lazy) e guards
```

| Decisão | Motivo |
|---|---|
| **Tokens do Figma** em `@theme` (Tailwind) | Cores/tipografia com nome; nada de valor solto no código |
| Medidas extraídas da **API do Figma** e validação por **screenshots lado a lado** | Pixel perfect verificável, não "no olho" |
| Cards com padding 23px | No Figma a borda é interna; no CSS soma ao padding (1px + 23px = 24px) |
| Busca por número dispara só com os **20 dígitos** (máscara ao digitar) | Sem chamada por tecla e sem 400 de número parcial |
| **Calendário próprio** (sem biblioteca) | Visual idêntico ao Figma; datas como string ISO/`Date.UTC`, sem bug de fuso. Depois da data inicial, o mouse mostra a prévia do período no mesmo cinza do Figma |
| **Selo "Transitou em julgado" também no card da lista** (o Figma só o tem no processo) | Pedido de produto: o advogado vê a situação sem abrir o processo. É a situação **do processo** (campo `lawsuitFinalJudgment`, mesma regra do selo do processo), não só do texto do card; uma consulta por página |
| Filtros na **URL** | Link compartilhável e navegação do navegador funcionando |
| `<ScrollRestoration>` + `preventScrollReset` nos filtros | Abrir um processo começa no topo e "voltar" devolve a lista ao mesmo card (importante no celular); trocar filtro não pula para o topo |
| Retry só em 5xx/rede | Repetir um 4xx não muda o resultado |
| **Code splitting por rota** | Bundle inicial ~112 KB gzip; ilustração do login em WebP com `srcset` (2,9 MB → 7–46 KB) |
| `<dialog>` nativo no modal | Foco preso, Esc e backdrop sem biblioteca |
| Token no `localStorage` | Simples e persiste ao recarregar. **Trade-off:** legível por JS em caso de XSS; o ideal seria cookie httpOnly, mas o contrato fixa o token no corpo do login |

---

## Premissas, bloqueios e o que ficou de fora

**Premissas**
- **Nome do repositório:** o PDF do case, enviado junto com o codinome, pede
  `desafio-[codinome]-[iniciais]-[DDMM]`; o `ENUNCIADO.md` do repositório base fala em
  `case-fullstack-<iniciais>`. Segui o PDF, a instrução específica que recebi: `desafio-fs2-dr-2511`.
- **Mapeamento dos dados** (`api/src/database/seed/cnj-mapper.ts`): o JSON segue a API pública do
  CNJ. Persisto o que as telas usam — `id`, `data_disponibilizacao`, `siglaTribunal`,
  `tipoComunicacao`, `nomeOrgao`, `texto`, `numero_processo` (só dígitos), `nomeClasse` e
  `destinatarios[]`. Ficaram de fora `meio`/`meiocompleto` (sempre "D"/DJEN) e
  `destinatarioadvogados` (nenhuma tela mostra; entraria numa tabela de advogados por OAB se o
  produto passar a acompanhar comunicações por OAB).
- Tribunal citado numa comunicação mas ausente de `tribunais.json` seria criado com a sigla como
  nome (nos dados do case, todos os 10 estão na lista).
- "Transitou em julgado quando identificado" = alguma comunicação do processo contém a expressão
  (transitou/trânsito/transitada em julgado) — 8 das 120 comunicações.

**Bloqueios**
- O repositório base do case (dados e artefatos da Parte 2) só foi liberado no 2º dia. Até lá, a
  API e o seed foram construídos sobre o formato público do CNJ e validados com massa fictícia;
  com os dados reais, o seed carregou as 120 comunicações sem nenhum ajuste no mapeamento.
- O `ENUNCIADO.md` dá **5 dias** de prazo; o PDF, 4. Planejei pelos 4.

**O que ficou de fora (e como eu faria)**
- Refresh token e sessão em cookie httpOnly.
- Paginação por cursor (keyset) para volumes muito grandes; hoje é `OFFSET`.
- Resumo com LLM (com anonimização antes do envio e cache por comunicação).
- Imagem Docker menor (~710 MB, quase toda do Prisma CLI usado no `migrate deploy`): migrar num
  job separado.
- Rate limit com storage em Redis: hoje a contagem é em memória (vale para uma instância);
  com várias réplicas, o limite precisa ser compartilhado entre elas.

### Melhorias futuras (crescimento do projeto)

**Filas para trabalho assíncrono.** Hoje tudo acontece dentro da requisição. Com volume real,
três fluxos deveriam ir para uma fila (BullMQ + Redis, ou RabbitMQ):
- **ingestão do DJEN**: um job agendado busca as comunicações novas e enfileira uma tarefa por
  lote, com retry, backoff e fila de erro — se o fornecedor falhar, retoma de onde parou
  (mesmo raciocínio da P5);
- **resumo com LLM**: gerado em segundo plano e cacheado, sem prender a requisição do usuário;
- **notificações** ao advogado quando chega comunicação de um processo que ele acompanha.
  Consumidores idempotentes (chave por id da comunicação), para reentregas não duplicarem
  registros (o tema da P2).

**Análise automática de PRs.** Além do CI que já roda (lint, testes, build e a trava de 500
linhas por arquivo), um revisor automático comentaria cada PR apontando bugs, riscos de segurança
e desvios das convenções do projeto — por exemplo, com o Claude Code no GitHub Actions. O
revisor humano continua aprovando; a IA só antecipa o que é mecânico.

**Trem de PRs (release train) para produção.** Hoje cada merge na `main` vai direto para
produção. Com time maior, o melhor é um "trem" com horário fixo:
1. PRs aprovados entram numa **fila de merge** (merge queue do GitHub), que testa cada PR já
   combinado com os anteriores — evita a `main` quebrar por dois PRs que, sozinhos, passavam;
2. o que entrou na fila vai primeiro para um ambiente de **homologação** (um *branch* do banco no
   Neon serve de cópia de dados);
3. num horário programado (ex.: 10h e 16h, nunca sexta à tarde), um workflow agendado publica o
   lote em produção (deploy hook do Render com o auto-deploy desligado), com nota de versão gerada
   dos PRs;
4. se o health check ou as métricas piorarem, rollback de um clique para o trem anterior.
   Ganha-se previsibilidade (todo mundo sabe quando sai versão), lotes pequenos fáceis de
   reverter e janelas com alguém de plantão.

---

## Funcionalidades

| Tela | Rota | Estados implementados |
|---|---|---|
| Login | `/login` | padrão · erro "E-mail ou senha incorretos…" · carregando · mostrar/ocultar senha |
| Cadastro | `/cadastro` | padrão · e-mail inválido · senha curta · senhas diferentes · e-mail já cadastrado · carregando |
| Comunicações (protegida) | `/comunicacoes` | lista · filtros (número, tribunal, período com calendário de 2 meses) · paginação · "Ler mais" · skeleton · vazio · erro · iniciais no avatar |
| Detalhes do processo (protegida; a rota `GET /processos/:numero` da API é bônus) | `/processos/:numero` | selo "Transitou em julgado" no cabeçalho, só quando identificado · movimentações · skeleton · não encontrado · erro |
| Resumo com IA (bônus) | modal | carregando · resumo com destaques · erro |
| Guia do avaliador (pública, extra) | `/guia` | mapa da entrega para quem avalia: links, blocos, Parte 2, testes |

- Sem sessão, rotas protegidas redirecionam para o login (e voltam para a página pedida após entrar).
- Filtros ficam na URL: link compartilhável, recarregar mantém o estado, botão "voltar" funciona.
- Responsivo nos 5 tamanhos do Figma (1920, 1024, 768, 430, 360).

---

## API — rotas e exemplos

O contrato do case (rotas, parâmetros e status) foi seguido à risca. Documentação interativa
completa em **`/docs`** (Swagger).

| Método | Rota | Auth | Descrição | Status |
|---|---|---|---|---|
| POST | `/auth/cadastro` | pública | Cria a conta | 201 · 400 · 409 |
| POST | `/auth/login` | pública | Devolve `{ "accessToken": "<JWT>" }` | 200 · 400 · 401 |
| GET | `/auth/me` | Bearer | Usuário logado (extra: iniciais do avatar) | 200 · 401 |
| GET | `/tribunais` | Bearer | Lista de tribunais | 200 · 401 |
| GET | `/comunicacoes` | Bearer | Lista paginada com filtros | 200 · 400 · 401 |
| GET | `/processos/:numero` | Bearer | (bônus) Processo + comunicações | 200 · 400 · 401 · 404 |
| POST | `/comunicacoes/:id/resumo` | Bearer | (bônus) Resumo do conteúdo | 200 · 400 · 401 · 404 |
| GET | `/health` | pública | API e banco no ar (healthcheck do Docker e do Render) | 200 |
| GET | `/live` | pública | Só a API, **sem consultar o banco** (keep-alive) | 200 |

### Filtros de `GET /comunicacoes`

| Parâmetro | Regra |
|---|---|
| `numeroProcesso` | número CNJ com ou sem máscara (20 dígitos) |
| `tribunal` | sigla, sem diferenciar maiúsculas (ex.: `TJSP`) |
| `dataInicio`, `dataFim` | `YYYY-MM-DD`, inclusivos; data inexistente ou início > fim → 400 |
| `page`, `pageSize` | padrão `1` e `10`; `pageSize` máximo 50 (acima → 400) |

Ordem: da comunicação mais recente para a mais antiga (o `id` desempata o mesmo dia, para a
paginação não repetir nem pular itens). Parâmetro vazio (`?tribunal=`) equivale a ausente.

### Exemplos

```bash
API=http://localhost:8888

# Cadastro
curl -X POST $API/auth/cadastro -H 'Content-Type: application/json' \
  -d '{"name":"Amélia Macedo","email":"amelia@exemplo.com","password":"senhaSegura123"}'
# 201 {"id":"…","name":"Amélia Macedo","email":"amelia@exemplo.com"}

# Login
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"amelia@exemplo.com","password":"senhaSegura123"}' | jq -r .accessToken)

# Tribunais
curl $API/tribunais -H "Authorization: Bearer $TOKEN"
# [{"acronym":"TJSP","name":"Tribunal de Justiça de São Paulo"}, …]

# Comunicações do TJSP em agosto/2025, página 1
curl "$API/comunicacoes?tribunal=TJSP&dataInicio=2025-08-01&dataFim=2025-08-31&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
# Formato da resposta:
# {"data":[{"id":…,"lawsuitNumber":"NNNNNNN-DD.AAAA.J.TR.OOOO","lawsuitClass":"Procedimento comum",
#   "court":"TJSP","availabilityDate":"2025-08-15","type":"Intimação","content":"…",
#   "recipients":[{"name":"…","side":"P"}],"lawsuitFinalJudgment":false, …}],
#  "meta":{"page":1,"pageSize":10,"total":…,"totalPages":…}}

# Por número do processo (com ou sem máscara)
curl "$API/comunicacoes?numeroProcesso=2458591-85.2024.8.26.0521" -H "Authorization: Bearer $TOKEN"

# Erros do contrato
curl "$API/comunicacoes?pageSize=51" -H "Authorization: Bearer $TOKEN"   # 400
curl "$API/comunicacoes"                                                  # 401

# Detalhe do processo (bônus)
curl "$API/processos/NUMERO_CNJ" -H "Authorization: Bearer $TOKEN"
# {"lawsuit":{"number":"…","className":"…","court":"TJSP","recipients":[…],
#   "totalCommunications":2,"finalJudgment":true},
#  "communications":[{…,"mentionsFinalJudgment":true}], "meta":{…}}

# Resumo (bônus)
curl -X POST "$API/comunicacoes/ID/resumo" -H "Authorization: Bearer $TOKEN"
# {"highlights":["Prazo: 15 dias"],"summary":"Fica a parte intimada para, no prazo de 15 …"}
```

Erros seguem o formato padrão do NestJS: `{ "statusCode": 400, "message": "…", "error": "Bad Request" }`
(`message` em pt-BR, pronta para exibir).

---

## Fluxo de trabalho (Kanban)

**Quadro:** <https://github.com/users/consultordavidrocha/projects/1> (GitHub Projects, ligado
a este repositório; cada cartão é uma issue).

Colunas: **Backlog → A fazer → Em andamento → Em revisão → Concluído**.

| Coluna | Significado |
|---|---|
| Backlog | Mapeado, ainda não priorizado — ou bloqueado (label `bloqueado`) |
| A fazer | Priorizado para a próxima etapa |
| Em andamento | Em execução (um cartão por vez) |
| Em revisão | Pronto, passando por testes, lint e comparação com o Figma |
| Concluído | Validado e commitado; a issue é fechada |

1. Cada entrega do enunciado vira um cartão/issue com labels de área (`api`, `web`, `docs`,
   `infra`, `parte-2`, `bonus`), por exemplo "API: GET /tribunais e GET /comunicacoes" ou "P5".
2. Prioridade pelos pesos da avaliação e pelas dependências: obrigatórios antes de bônus.
3. Um cartão por vez em "Em andamento"; ele só vai para "Concluído" com testes passando,
   lint limpo e (no front) comparação com o Figma.
4. Commits pequenos e temáticos (`feat(api): …`, `feat(web): …`, `docs: …`), um ou mais por
   cartão; a issue lista os commits que a entregaram.

---

## Horas gastas

Desenvolvimento com IA como par de programação (ver [AI_USAGE.md](AI_USAGE.md)): as horas
abaixo incluem leitura do enunciado, decisões, revisão do que foi gerado e validação.

| Data | Horas | Atividades |
|---|---|---|
| 25/11/2026 | ~4 h | **Desenvolvimento:** leitura do case e do Figma, plano; API (auth, filtros, seed, bônus); front (login, cadastro, comunicações, processo, resumo); testes; README; PDFs |
| 26/11/2026 | ~4 h | **Desenvolvimento:** deploy (Neon, Render, Vercel, CORS); rate limit; CI; dados reais e usuário demo; Parte 2 (P1 em Python com testes, P2–P7); E2E com Playwright; README, AI_USAGE e PDFs nos templates |
| 26–27/11/2026 | ~11 h | **Validação, ajustes e estudo:** teste manual pelo roteiro (`docs/roteiro-testes-manuais.md`) e os ajustes que ele revelou (clique no card abrindo o processo, selo no card, prévia do período no calendário, rolagem ao abrir um processo, keep-alive 24 h, Guia do avaliador); revisão das respostas da Parte 2; leitura do código e das decisões para a conversa técnica |
| **Total** | **~19 h** | |

A validação pesa mais que o desenvolvimento de propósito: com a IA gerando boa parte do código, o
trabalho que mais importa é revisar, testar e entender o que foi entregue (ver [AI_USAGE.md](AI_USAGE.md)).

---

## Estrutura do repositório

```
├── api/                 API NestJS (Dockerfile, prisma/, src/, test/)
├── web/                 Front React
├── dados/               comunicacoes.json e tribunais.json (lidos pelo seed)
├── problemas/           Parte 2 (01-migracao/solucao/ …)
├── docs/                Manual, documentação técnica (PDF) e banco de dados: antes e depois
├── docker-compose.yml
├── RESPOSTAS.md         Parte 2
└── AI_USAGE.md          Uso de IA
```
