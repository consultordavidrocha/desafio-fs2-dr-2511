# Uso de IA

> Rascunho em andamento: a estrutura definitiva segue o template do repositório do case.
> Atualizado ao longo do desenvolvimento, não só no fim.

## Ferramentas

- **Claude Code** (modelo Claude Opus 5.5), no VS Code: leitura do enunciado, planejamento,
  geração de código, testes e revisão.
- **API do Figma** (token pessoal só de leitura): extração de textos, estados e medidas das
  telas para o front.

## O que deleguei e o que ficou comigo

| Delegado à IA | Decidido/validado por mim |
|---|---|
| Leitura do PDF e montagem do plano por dia | Prioridades pelos pesos da avaliação (Parte 2 = 30) e ordem de execução |
| Scaffold do NestJS, Prisma, Docker | Convenções: identificadores em inglês, contrato em português, comentários em pt-BR |
| Código de autenticação, filtros, seed e testes | Regras de negócio e casos de borda a testar (ver abaixo) |
| Rascunho de P5 e P7 | Conteúdo final e limite de 150 palavras |

## Prompts importantes

- _"Leia o PDF do desafio e vamos criar um plano para executar esse desafio."_
- _"Coloque os dados em inglês, interno, na API; vamos seguir as boas práticas de
  desenvolvimento, cuidar com arquivos grandes, documentar bem."_ Isso mudou o schema e os DTOs
  já escritos.
- Definição de portas para não conflitar com outros projetos locais: API 8888, front 3099,
  Postgres 5434.

## Onde a IA errou (e como foi pego)

| Erro | Como foi detectado | Correção |
|---|---|---|
| Concluiu que o Figma só tinha a capa e sugeriu avisar o recrutamento | Eu abri os links diretos dos nós e as telas estavam lá | Mensagem ao recrutamento corrigida antes do envio |
| Tentou instalar `@nestjs/swagger@12` num projeto Nest 11 | Erro de dependências do npm (ERESOLVE) | Versões fixadas compatíveis com o Nest 11 |
| Subiu o Postgres numa porta já usada por outro projeto meu | Falha de autenticação ao migrar (estava falando com outro banco) | Porta própria e configurável; nada foi alterado no outro banco |
| Usou `@Validate` com uma função (API inexistente no class-validator) | Revisão do código antes de rodar | Regra `dataInicio <= dataFim` movida para o serviço, com teste |
| Exemplo errado de "máscara parcial" num teste de CNJ | O próprio teste falharia; revisado antes de rodar | Exemplo corrigido |
| Tipagens `any` em testes e transformações | ESLint (`no-unsafe-*`) | Funções nomeadas e tipadas |
| Code splitting das rotas quebrou o dev server ("React duplicado": o Vite reotimizou dependências no meio da sessão) | Screenshot automatizado mostrou a tela de erro em vez do login | `optimizeDeps.include` com as dependências das páginas lazy |
| Cadastro mostrava "Mínimo de 8 caracteres" junto com "As senhas não coincidem" | Comparação lado a lado do screenshot com o render do Figma | Texto de apoio some no estado de senhas diferentes, como no Figma |

## Como validei

- **Testes automatizados**: unitários (serviço de auth, utilitários CNJ, mapper do seed) e e2e
  contra um Postgres real separado (`juscash_test`), cobrindo os status do contrato
  (200/201/400/401/409), filtros, paginação e casos de borda.
- **Lint e build** a cada etapa, sem avisos.
- **Execução real**: `docker compose up` do zero, com cadastro, login e consultas via `curl`,
  e o seed rodado duas vezes para comprovar a idempotência.
- **Fidelidade ao Figma**: telas renderizadas pela API do Figma e comparadas lado a lado com
  screenshots do front (Playwright + Chrome) nos 5 tamanhos do protótipo.
- **Fluxo do front contra a API real**: script automatizado cobrindo rota protegida, cadastro,
  sessão após recarregar, logout, e-mail duplicado, senha errada e mostrar/ocultar senha.
- **Leitura do código** gerado antes de cada commit; o que eu não conseguia explicar não entrava.

## O que eu ensinaria ao time

1. **IA acelera, mas o teste é o juiz**: peça os testes junto com o código e rode-os de verdade.
   Vários erros acima só não chegaram ao repositório por causa disso.
2. **Dê contexto e restrições cedo** (convenções, portas, versões); corrigir depois custa
   retrabalho.
3. **Nunca cole segredos ou dados pessoais** em prompts (ver P7). O token do Figma, por
   exemplo, ficou num arquivo local e nunca entrou na conversa.
4. **Desconfie de conclusões "negativas"** da IA (ex.: "não tem acesso") e verifique por
   conta própria.
