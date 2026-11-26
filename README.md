# JusCash Comunicações — Case FS2

Aplicação para advogados acompanharem **comunicações processuais** (intimações, citações,
editais) publicadas no Diário de Justiça Eletrônico Nacional: criar conta, entrar, consultar e
filtrar comunicações, ver o detalhe de um processo e gerar um resumo do conteúdo.

| Parte | Stack |
|---|---|
| API (`api/`) | Node.js 24 · NestJS 11 · TypeScript · PostgreSQL 16 · Prisma 6 · JWT · Swagger |
| Front (`web/`) | React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · React Router 8 · TanStack Query · React Hook Form + Zod |
| Infra | Docker Compose (Postgres + API com dados carregados) |

> **Links de produção:** _a preencher após o deploy_ (front, API e Swagger).

---

## Sumário

1. [Como rodar](#1-como-rodar)
2. [Funcionalidades](#2-funcionalidades)
3. [API — rotas e exemplos](#3-api--rotas-e-exemplos)
4. [Arquitetura e decisões](#4-arquitetura-e-decisões)
5. [Testes](#5-testes)
6. [Fluxo de trabalho (Kanban)](#6-fluxo-de-trabalho-kanban)
7. [Premissas, bloqueios e o que ficou de fora](#7-premissas-bloqueios-e-o-que-ficou-de-fora)
8. [Horas gastas](#8-horas-gastas)
9. [Estrutura do repositório](#9-estrutura-do-repositório)

---

## 1. Como rodar

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

### 1.1 Banco + API (Docker) — um comando

```bash
docker compose up -d --build
```

Isso sobe o Postgres, aplica as migrations, **carrega `dados/tribunais.json` e
`dados/comunicacoes.json`** (seed idempotente) e inicia a API.

- API: <http://localhost:8888>
- Swagger: <http://localhost:8888/docs>
- Saúde: <http://localhost:8888/health>

### 1.2 Front

```bash
cd web
cp .env.example .env.local   # VITE_API_URL=http://localhost:8888
npm install
npm run dev                  # http://localhost:3099
```

### 1.3 API fora do Docker (desenvolvimento)

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

---

## 2. Funcionalidades

| Tela | Rota | Estados implementados |
|---|---|---|
| Login | `/login` | padrão · erro "E-mail ou senha incorretos…" · carregando · mostrar/ocultar senha |
| Cadastro | `/cadastro` | padrão · e-mail inválido · senha curta · senhas diferentes · e-mail já cadastrado · carregando |
| Comunicações (protegida) | `/comunicacoes` | lista · filtros (número, tribunal, período com calendário de 2 meses) · paginação · "Ler mais" · skeleton · vazio · erro · iniciais no avatar |
| Detalhes do processo (bônus) | `/processos/:numero` | selo "Transitou em julgado" · movimentações · skeleton · não encontrado · erro |
| Resumo com IA (bônus) | modal | carregando · resumo com destaques · erro |

- Sem sessão, rotas protegidas redirecionam para o login (e voltam para a página pedida após entrar).
- Filtros ficam na URL: link compartilhável, recarregar mantém o estado, botão "voltar" funciona.
- Responsivo nos 5 tamanhos do Figma (1920, 1024, 768, 430, 360).

---

## 3. API — rotas e exemplos

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
| GET | `/health` | pública | API e banco no ar | 200 |

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
#   "recipients":[{"name":"…","side":"P"}], …}],
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

## 4. Arquitetura e decisões

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
já na ordem da listagem (`availability_date DESC, id DESC`).

| Decisão | Motivo |
|---|---|
| **Guard JWT global** + `@Public()` | Rota nova nasce protegida; esquecer o decorator gera 401, não vazamento |
| **bcrypt** (custo 10), senha de 8 a 72 caracteres | bcrypt ignora bytes após o 72º; rejeitar evita senha "truncada" sem aviso |
| **Mesma resposta** para e-mail inexistente e senha errada (com hash "dummy") | Não revela quais e-mails estão cadastrados, nem pelo tempo de resposta |
| **409 pela constraint única** do banco | Sem corrida entre dois cadastros simultâneos ("consultar e inserir" teria) |
| `ValidationPipe` com `whitelist` + `forbidNonWhitelisted` | Campo não previsto → 400; nada inesperado chega ao serviço |
| Variáveis de ambiente validadas na subida | Configuração faltando derruba a API logo, não em produção às 3h |
| **Seed idempotente, em lotes**, rejeitando registros inválidos com motivo no log | Pode rodar a cada subida; dado sujo não derruba a importação |
| **Resumo extrativo** (sem LLM) | Não envia dados de processos (nomes, CPF) a terceiros; sem chave/custo; determinístico e testável. Seleciona as frases mais relevantes por termos jurídicos e destaca prazo, audiência e trânsito em julgado |
| Trânsito em julgado detectado por regex (no Postgres com `~*` e em JS) | O selo do processo considera **todas** as comunicações, não só a página exibida |

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
| **Calendário próprio** (sem biblioteca) | Visual idêntico ao Figma; datas como string ISO/`Date.UTC`, sem bug de fuso |
| Filtros na **URL** | Link compartilhável e navegação do navegador funcionando |
| Retry só em 5xx/rede | Repetir um 4xx não muda o resultado |
| **Code splitting por rota** | Bundle inicial ~112 KB gzip; ilustração do login em WebP com `srcset` (2,9 MB → 7–46 KB) |
| `<dialog>` nativo no modal | Foco preso, Esc e backdrop sem biblioteca |
| Token no `localStorage` | Simples e persiste ao recarregar. **Trade-off:** legível por JS em caso de XSS; o ideal seria cookie httpOnly, mas o contrato fixa o token no corpo do login |

---

## 5. Testes

| Onde | Comando | O que cobre |
|---|---|---|
| API — unitários | `cd api && npm test` | AuthService, máscara/normalização CNJ, mapper do seed, resumidor, detecção de trânsito em julgado |
| API — e2e | `cd api && npm run test:e2e` | Postgres real (`juscash_test`): todos os status do contrato, filtros isolados e combinados, limites inclusivos, paginação estável, processos e resumo |
| Front — unitários | `cd web && npm test` | máscara CNJ, datas/grade do calendário, iniciais, paginação |

Os testes e2e exigem o Postgres do compose (`docker compose up -d db`); o banco de teste é
criado automaticamente e o `api/.env.test` já está versionado (sem segredos reais).

> **Windows:** se o projeto for aberto com a letra do drive em minúsculo (`c:\…`), o Vitest pode
> carregar duas instâncias de si mesmo e falhar com `reading 'config'`. Rode a partir de `C:\…`.

---

## 6. Fluxo de trabalho (Kanban)

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

## 7. Premissas, bloqueios e o que ficou de fora

**Premissas**
- O formato de `dados/comunicacoes.json` segue a API pública de comunicações do CNJ
  (`items[]`, `numero_processo`, `siglaTribunal`, `data_disponibilizacao`, `destinatarios[]`…).
  O mapeamento fica isolado em `api/src/database/seed/cnj-mapper.ts`.
- Tribunal citado numa comunicação mas ausente de `tribunais.json` é criado com a sigla como nome.
- "Transitou em julgado quando identificado" = alguma comunicação do processo contém a expressão
  (transitou/trânsito/transitada em julgado).

**Bloqueios**
- O repositório base do case estava privado no início; dados reais e artefatos da Parte 2
  dependiam do acesso. _Atualizar conforme liberação._

**O que ficou de fora (e como eu faria)**
- Rate limit no login (`@nestjs/throttler`, ex.: 5 tentativas/min por IP + e-mail).
- Refresh token e sessão em cookie httpOnly.
- Paginação por cursor (keyset) para volumes muito grandes; hoje é `OFFSET`.
- Resumo com LLM (com anonimização antes do envio e cache por comunicação).
- Imagem Docker menor (~710 MB, quase toda do Prisma CLI usado no `migrate deploy`): migrar num
  job separado.

---

## 8. Horas gastas

Desenvolvimento com IA como par de programação (ver [AI_USAGE.md](AI_USAGE.md)): as horas
abaixo incluem leitura do enunciado, decisões, revisão do que foi gerado e validação.

| Data | Horas | Atividades |
|---|---|---|
| 25/11/2026 | ~4 h | Leitura do case e do Figma, plano; API completa (auth, filtros, seed, bônus); front (login, cadastro, comunicações, processo, resumo); testes; README; PDFs; preparação do deploy |
| **Total** | **~4 h** | _atualizado até a entrega_ |

---

## 9. Estrutura do repositório

```
├── api/                 API NestJS (Dockerfile, prisma/, src/, test/)
├── web/                 Front React
├── dados/               comunicacoes.json e tribunais.json (lidos pelo seed)
├── problemas/           Parte 2 (01-migracao/solucao/ …)
├── docs/                Manual do usuário e documentação técnica (PDF)
├── docker-compose.yml
├── RESPOSTAS.md         Parte 2
└── AI_USAGE.md          Uso de IA
```
