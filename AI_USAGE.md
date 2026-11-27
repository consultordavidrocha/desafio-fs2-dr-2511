# Uso de IA

> Seja específico e honesto. Um relato real, com os erros, vale mais do que um texto bonito.

## Ferramentas
<!-- assistentes, modelos, IDE -->
- **Claude Code** (modelo Claude Opus 5.5), na extensão do VS Code, como par de programação durante
  todo o case: leitura do enunciado, plano, código, testes, documentação e revisão.
- **API do Figma** (token pessoal só de leitura): extração de textos, estados, medidas e renders das
  telas, usados para construir e conferir o front.
- **Playwright + Chrome**: screenshots automatizados para comparar o front com o Figma e testar fluxos
  em produção.
- Skills e MCP oficiais do **Neon** (banco), lidos/instalados durante o deploy.

## O que você delegou e o que fez sozinho
| Parte | Delegado à IA | Feito/decidido por você |
|---|---|---|
| API | Scaffold NestJS/Prisma/Docker; código de auth, filtros, seed, bônus e rate limit; testes unitários e e2e | Prioridades pelos pesos da avaliação; convenções (código em inglês, contrato e mensagens em português); portas; casos de borda a cobrir; escolha de Neon/Render/Vercel |
| Front | Componentes a partir das medidas do Figma; estados; responsivo; comparação lado a lado | Achei as telas no Figma (a IA concluiu que só havia a capa); conferência visual final; o que fazer onde o Figma não define (estado de erro, menu do usuário) |
| Problemas (Parte 2) | Primeira versão das respostas e do código da P1, com conferência dos limites de tamanho e dos números de linha citados | Revisão e ajuste de cada resposta; decisões da P1 que dependem de critério (o que rejeitar × corrigir com aviso) |

## Prompts mais importantes
<!-- 2 a 4 prompts (pode resumir): objetivo, o que voltou, como você iterou -->
1. **"Leia o PDF do desafio e vamos criar um plano."** Voltou um plano por dia, pesos da avaliação
   e bloqueios (repositório privado). Iterei pedindo para começar pelo que não dependia do acesso:
   API, P5 e P7.
2. **"Coloque os dados em inglês, interno, na API; boas práticas, cuidar com arquivos grandes,
   documentar bem."** Mudou o schema e os DTOs já escritos e virou regra do projeto (depois
   reforçada no CI com a trava de 500 linhas por arquivo).
3. **Comparação com o Figma** — "extraia as medidas do frame X, gere screenshots nos 5 tamanhos e
   compare lado a lado". Cada rodada achava diferenças (texto de apoio a mais no cadastro, cards 2 px
   mais altos, breakpoints errados) e voltava para correção.
4. **"Fetch the Neon skill … instale o que falta e preserve minha configuração."** A IA leu a skill,
   instalou skills e MCP, e descobriu que a CLI tinha gravado no perfil errado; corrigiu e provou,
   comparando com backup, que o arquivo do outro perfil ficou idêntico ao original.

## Onde a IA errou
<!-- pelo menos um caso concreto: o que ela sugeriu, como você percebeu, o que fez -->
| Erro | Como foi percebido | O que foi feito |
|---|---|---|
| Concluiu que o Figma só tinha a capa e sugeriu avisar o recrutamento | **Eu** abri os links diretos dos nós e as telas estavam lá | Mensagem ao recrutamento corrigida antes do envio |
| Tentou instalar `@nestjs/swagger@12` num projeto Nest 11 | Erro de dependências do npm | Versões fixadas compatíveis com o Nest 11 |
| Subiu o Postgres numa porta já usada por outro projeto meu | Falha de autenticação ao migrar (era outro banco) | Porta própria e configurável; nada foi alterado no outro banco |
| Usou `@Validate` com uma função (API inexistente no class-validator) | Revisão antes de rodar | Regra `dataInicio <= dataFim` no serviço, com teste |
| Code splitting quebrou o dev server ("React duplicado") | Screenshot automatizado mostrou a tela de erro | `optimizeDeps.include` com as dependências das páginas lazy |
| Cadastro mostrava "Mínimo de 8 caracteres" junto com "As senhas não coincidem" | Comparação com o render do Figma | Texto de apoio some nesse estado, como no Figma |
| Cards 2 px mais altos que no Figma (borda interna no Figma, somada no CSS) | Comparação lado a lado | Padding de 23 px (1 px de borda + 23 = 24) |
| Breakpoints responsivos "chutados" | Extração das regras dos frames "Responsivos" | Filtros em linha só ≥ 1024 px; celular sem logo/sidebar |
| Regex de frases do resumo quebrava em "art. 4º" | Teste unitário falhou | Lookbehind incluindo o ponto da abreviação |
| Teste contra o banco de produção rodou um build antigo (rota 404) | O próprio teste acusou a rota faltando | Recompilar antes de testar |
| Primeiro CI falhou: lockfile gerado no Windows sem dependências do Linux | Job do GitHub Actions | Lockfile regenerado; CI verde |
| O mesmo erro **voltou** ao adicionar o Playwright: regenerar no Windows não resolve de vez (o npm resolve a dependência *peer* do `@napi-rs/wasm-runtime` de forma diferente por plataforma) | CI falhou de novo no `npm ci` | Causa investigada no lock; agora o lock é gerado num container Linux (`scripts/regenerar-lock.sh`), validado com `npm ci` no Linux e no Windows, e documentado no README |
| A CLI do Neon gravou o MCP no perfil errado do Claude | Conferência dos arquivos contra backup | Registro no lugar certo; outro perfil restaurado |
| Contou errado as palavras da P5 (149 → 155 com contagem rigorosa) | Script de conferência dos limites | Resposta enxugada para 147 |
| Configurou `trust proxy: 1` para o Render sem medir quantos proxies havia: o rate limit contava pelo balanceador interno, não pelo usuário. E a primeira sonda aceitou um 429 "de sorte" como prova | Na auditoria, os contadores de rate limit não batiam entre si (`remaining` 0 e depois 4; `retry-after` diferentes) | Rota de diagnóstico temporária mostrou a cadeia real de proxies. A **primeira correção também errou**: a máscara que usei para não expor IPs chamou de privado todo `172.*`, mas o salto era da Cloudflare (`172.64/13`). A sonda reforçada pegou de novo. Correção final: confiar em rede privada + faixas oficiais da Cloudflare; 2 testes e2e que falham com as duas configurações anteriores |
| Na auditoria de segurança, a sonda leu como "vazamento" o 403 em HTML que a Cloudflare devolve ao barrar SQL injection | O texto da resposta era a página da Cloudflare, não da API | Resultado tratado como **inconclusivo** (barrado na borda); os mesmos payloads repetidos na API local, sem o WAF, deram 400 pela validação |
| P6: a primeira resposta criava uma coluna gerada, o que reescreveria a tabela de 2,1 milhões de linhas com ela travada; P4 não apontava que, sem `cpf`, o Prisma ignora o filtro e a rota de período lista todos os clientes | Revisão final das respostas contra os artefatos | P6 trocada por índice de expressão (a consulta A não muda), conferida no Postgres local com `EXPLAIN`: Index Scan, sem Sort; P4 com o vazamento no comentário 7 |
| Implementou um pedido de UX ("clicar no card expande o texto") sem conferir o Figma: o protótipo liga o card inteiro à tela de detalhes do processo. Testes passaram e a mudança foi para produção | **Eu**, revisando o Figma: a seta do protótipo sai do card, não do número | Clique no card voltou a abrir o processo, como no protótipo; "Ler mais" segue só expandindo; teste e2e reescrito. Regra que ficou: conferir frames **e** interações do Figma antes de mudar comportamento de tela |
| Keep-alive confiado só ao agendador do GitHub | **Eu** vi o primeiro acesso lento de novo; o GitHub não tinha rodado nenhum agendamento em 1h20 | Ping principal num pinger externo (cron-job.org); GitHub Actions como reserva, documentado no README |

## Como você validou o que foi gerado
<!-- testes, execução, comparação com o Figma, leitura de documentação... -->
- **Testes automatizados** rodando no CI (GitHub Actions) a cada push: API com 37 unitários e 60 e2e
  contra Postgres real (todos os status do contrato, filtros, paginação, rate limit), front com 41
  unitários, **31 testes de navegador com Playwright** contra a stack real (Postgres + API + front),
  P1 com 37 testes pytest, e a trava de 500 linhas por arquivo.
- **Teste manual** (meu): roteiro com checklist em `docs/roteiro-testes-manuais.md` — fidelidade ao
  Figma, teclado, celular real, produção e Swagger. O automático vem primeiro; o manual confirma.
- **Lint e build** sem avisos a cada etapa.
- **Fidelidade ao Figma**: renders do Figma × screenshots do front, lado a lado, nos 5 tamanhos.
- **Execução real**: `docker compose up` do zero; fluxo completo no navegador contra a produção
  (Vercel + Render + Neon), inclusive com CORS restrito; seed rodado duas vezes (idempotência).
- **Banco de produção**: migrations testadas antes num branch temporário do Neon.
- **Parte 2**: números de linha citados conferidos contra o diff e o código; limites de palavras e
  linhas conferidos por script; a P1 roda sobre o `legado.csv` real.
- **Auditoria de segurança** (`docs/auditoria-seguranca.md`): cada proteção medida contra o sistema
  no ar, com chamada de controle (a credencial fraca falha e a forte funciona). Achou 4 problemas
  (rate limit contando pelo IP de um balanceador interno, 500 com `page` gigante, API sem cabeçalhos de segurança, front sem CSP), todos corrigidos com teste.
- **Leitura do código** antes de cada commit: o que eu não conseguia explicar não entrava.

## Onde você preferiu não usar IA, e por quê
- **Segredos**: a connection string do banco, o token do Figma e as chaves nunca passaram pela
  conversa — foram colados direto nos painéis (Render, Vercel) ou em arquivos locais. Pelo mesmo
  motivo criei o serviço no Render pelo painel, e não pelo MCP: a própria Render avisa que o MCP não
  garante que segredos fiquem fora do contexto da IA (o mesmo raciocínio da P7).
- **Contas e permissões**: criar contas, escolher a conta do GitHub, liberar escopos e tornar o
  Kanban público foram ações minhas.
- **Decisões que não são técnicas**: nome do repositório diante de instruções conflitantes,
  prioridades, e o que fica como melhoria futura em vez de ser implementado.
- **Revisão automática de PR com IA**: documentada como melhoria, mas não ligada — exigiria uma chave
  de API e custo, e o PDF pede o essencial.

## O que você ensinaria ao time sobre usar IA neste tipo de trabalho
1. **O teste é o juiz**: peça os testes junto com o código e rode de verdade — quase todos os erros
   acima foram pegos por teste, lint, CI ou comparação automática.
2. **Dê contexto e restrições cedo** (convenções, portas, versões): corrigir depois custa retrabalho.
3. **Verifique visualmente o que é visual**: "pixel perfect" sem screenshot lado a lado é opinião.
4. **Segredos e dados pessoais nunca entram no prompt** — use variável de ambiente, arquivo local ou
   o painel da plataforma.
5. **Desconfie de conclusões negativas** ("não tem", "não dá") e confira por conta própria.
6. **Você responde pelo que entrega**: leia tudo, entenda as decisões e saiba explicá-las.
