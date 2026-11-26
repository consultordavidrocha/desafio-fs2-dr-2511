# Auditoria de segurança — 26/11/2026

Varredura do front, da API e da configuração de produção, feita depois de o sistema estar no ar.
**Método:** inventário por `grep`, segredos procurados pelo **valor literal** em todo o histórico do
Git, `npm audit` triado por vetor e, principalmente, **testes contra o sistema vivo**. Cada
proteção foi medida com duas chamadas: a credencial fraca precisa falhar **e** a forte precisa
funcionar. Se as duas falham, o resultado é "inconclusivo", não aprovação.

Isto é uma análise adversarial com testes dinâmicos, não um pentest profissional. A seção
"O que não foi coberto" lista os limites.

**Reproduzir:** `node scripts/auditoria/sonda-seguranca.mjs` (produção) ou
`API=http://localhost:8888 WEB=http://localhost:3099 node scripts/auditoria/sonda-seguranca.mjs`.
O script não cria dados; ele esgota o rate limit de login do seu IP por cerca de 1 minuto.

## Achados corrigidos

| # | Achado | Como se explorava | Correção | Teste |
|---|---|---|---|---|
| 0 | **Rate limit contava pelo IP errado** (o mais grave) | Medido com uma rota de diagnóstico temporária: a requisição chega como `X-Forwarded-For: IP real, 172.x, 10.x`. Com `trust proxy: 1`, a API usava o `10.x`, um balanceador interno do Render que muda entre requisições. Resultado: poucos contadores **compartilhados por todos os usuários**. Um atacante ganhava algumas vezes o limite, e um usuário legítimo podia ser bloqueado pelas tentativas de outra pessoa | `trust proxy: 'loopback, uniquelocal'` no `setupApp`: o Express pula os saltos internos e para no primeiro IP público, o real. Não depende de quantos proxies há; um IP inventado pelo cliente fica à esquerda e é ignorado (medido: o `CF-Connecting-IP` falso é recusado pela própria Cloudflare) | e2e: "conta por cliente real, não pelo balanceador" e "ignora IP inventado". Os 2 **falham** com a configuração antiga |
| 1 | `page=99999999999999999999` devolvia **500** em `/comunicacoes` e `/processos/:numero` | 1e20 passa no `@IsInt` (é "inteiro" para o JavaScript) e o Prisma recusa o offset. Não vazava dado (resposta genérica), mas gerava erro interno sob demanda e poluía os logs | Teto `MAX_PAGE = 10_000` com `@Max` nos dois DTOs → 400 com mensagem clara | e2e: `page gigante`, `page acima do teto` |
| 2 | API **sem cabeçalhos de segurança** e com `x-powered-by: Express` | Revelava a stack. O Swagger (`/docs`, única página HTML da API) podia ser embutido em iframe de outro site | `helmet()` no `setupApp`: nosniff, `X-Frame-Options`, HSTS, Referrer-Policy e CSP `default-src 'self'`; Swagger conferido no navegador, sem erros | e2e: `envia cabeçalhos de segurança` |
| 3 | Front **sem CSP, anti-frame e nosniff** (só o HSTS da Vercel) | Sem CSP, um XSS futuro roda script de qualquer origem e lê o token do `localStorage`; sem anti-frame, a tela de login pode ser embutida num site falso (clickjacking) | Cabeçalhos no `vercel.json`: CSP estrita (`script-src 'self'`, sem `unsafe-inline`; `connect-src` só a API), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy. O `vite preview` aplica os mesmos cabeçalhos, então a **suíte Playwright inteira roda sob a CSP de produção** | Playwright: `seguranca.spec.ts` (cabeçalhos + fluxo sem violação; o detector foi validado com uma violação proposital) |

## O que foi medido e está protegido

| Área | Resultado medido (produção, 26/11) |
|---|---|
| Rotas protegidas | `/comunicacoes`, `/processos/:numero`, `/auth/me`, `POST /comunicacoes/:id/resumo`: **401 sem token e 200 com token** |
| JWT forjado | `alg: none`, assinatura com outro segredo, payload alterado, lixo e esquema `Basic`: todos **401** |
| Conteúdo do JWT | Só `sub`, `name`, `email`, `iat` e `exp`; nada de senha ou hash |
| SQL injection | Na produção, o WAF da Cloudflare (na frente do Render) barra antes (403). Na API local, sem o WAF, a validação recusa com **400** antes de qualquer consulta, e o único SQL cru (`$queryRaw`) é parametrizado (*tagged template*) |
| Validação | `pageSize` > 50, `page` negativa, parâmetro extra ou duplicado, data inexistente, CNJ inválido, *path traversal*: **400**. JSON malformado: 400 sem *stack trace*. Corpo de 2 MB: **413** |
| *Mass assignment* | Cadastro com `role`/`id` extras: **400** pela whitelist, sem criar nada |
| Enumeração no login | E-mail inexistente e senha errada dão a **mesma** mensagem; o hash *dummy* iguala o tempo de resposta |
| Rate limit | Depois da correção 0: um contador por cliente (o restante só diminui) e, após o primeiro 429, nenhuma tentativa passa. Antes, um 429 aparecia às vezes, por sorte, e a primeira versão da sonda aceitou isso como prova |
| CORS | Preflight de origem estranha: **sem** `Access-Control-Allow-Origin`; a origem da Vercel é liberada |
| Segredos | Nenhum valor real (JWT secret, senha do banco, tokens) no histórico do Git; nenhum segredo no bundle JS de produção; source maps não publicados |
| XSS no front | Nenhum `dangerouslySetInnerHTML`/`innerHTML`/`eval`. O destaque de "transitou em julgado" monta elementos React, que escapam o texto |
| *Open redirect* | O "voltar para a página pedida" usa o *state* do React Router, que um link externo não consegue preencher |

## Riscos aceitos (decisão consciente, com motivo)

| Risco | Por que fica | O que faria em produção real |
|---|---|---|
| `npm audit`: 4 "high" no **CLI do Prisma** (`effect`, `deepmerge-ts`, via `@prisma/config`) | O CLI só roda as migrations quando o container sobe e lê apenas arquivos nossos; nenhuma entrada de usuário chega a ele. O `@prisma/client` (caminho das requisições) não é afetado. A correção exige o Prisma 7 (*major*, com mudanças de API) | Migrar para o Prisma 7 numa tarefa própria, com a suíte e2e como rede |
| Token no `localStorage` | Contrato com Bearer token; simples e sobrevive ao recarregar. A CSP estrita reduz muito o risco de XSS, que é o vetor que roubaria o token | Cookie `httpOnly` + `SameSite` com proteção a CSRF, ou *refresh token* rotativo |
| JWT sem revogação (validade de 1 dia) | Stateless, sem tabela de sessões; "Sair" apaga o token do navegador | Validade curta + *refresh token* revogável |
| Cadastro aberto | Exigido pelo case (`POST /auth/cadastro`). Tem rate limit de 5/min por IP | Confirmação de e-mail e captcha |
| Cadastro revela se o e-mail existe (409) | Necessário para a mensagem "Este e-mail já está cadastrado." do Figma; o rate limit reduz a varredura | Mensagem neutra + e-mail de confirmação |
| Swagger público em `/docs` | Facilita a avaliação; não expõe nada além do contrato, que já é público | Esconder em produção ou proteger com autenticação |
| Sem rate limit no resumo | É extrativo (regex, sem LLM pago), exige login e o texto tem tamanho limitado | Cota por usuário se passasse a usar LLM pago |
| CORS aberto se `CORS_ORIGIN` não estiver definido | Facilita o desenvolvimento local; em produção a variável está definida e foi medida | Falhar o boot em produção sem `CORS_ORIGIN` |

## O que não foi coberto

- Ferramentas de pentest automatizado (OWASP ZAP, Burp) e fuzzing amplo.
- Negação de serviço e carga: o plano gratuito não aguenta, e testar derrubaria o ambiente de avaliação.
- A infraestrutura dos provedores (Render, Vercel, Neon, Cloudflare), aceita como está.
- O tempo de resposta do login (proteção contra enumeração por tempo) foi conferido no código e
  nos testes, não medido estatisticamente na produção: o rate limit corta antes de juntar amostras.
- RLS e permissões no banco: a API acessa o banco com um único usuário, e não há múltiplos
  clientes (*multi-tenant*) nem dado por usuário além da própria conta.
- O rate limit local fica em 1000 de propósito (a suíte faz muitos logins); o corte foi medido na produção.
