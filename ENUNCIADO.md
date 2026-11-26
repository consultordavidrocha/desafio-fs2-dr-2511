# Case técnico — Dev Full Stack · JusCash

Olá! Este case tem duas partes independentes:

1. **Construção:** uma API e um front, este último seguindo o Figma à risca.
2. **Resolução de problemas:** sete situações do dia a dia de engenharia. Você diz como resolveria cada uma.

Os dados e os problemas são fictícios, mas inspirados em situações reais.

| Parte | O que você faz | Prazo  |
|---|---|---|
| **1. Construção** | API (NestJS) + front (React) pixel perfect a partir do Figma |  |
| **2. Resolução de problemas** | 7 problemas com respostas curtas; código só onde pedimos |  |
| | |  · prazo de **5 dias corridos** |

> **Priorize.** Faça primeiro o que é obrigatório; bônus só depois. 

**IA é permitida em todo o case** (veja [Uso de IA](#uso-de-ia)). Depois da entrega, fazemos uma
conversa técnica de 60 min sobre o que você construiu e respondeu.

## O que tem neste repositório

```
ENUNCIADO.md        ← este arquivo
README.md           ← template: vira o README do SEU projeto
RESPOSTAS.md        ← template: suas respostas da Parte 2
AI_USAGE.md         ← template: como você usou IA
dados/              ← dados para a API (comunicacoes.json, tribunais.json)
problemas/          ← artefatos da Parte 2 (código, logs, manifests, CSV...)
```

---

## Parte 1 — Construção: "JusCash Comunicações" 

Advogados acompanham **comunicações processuais**, como intimações, citações e editais, publicadas no
Diário de Justiça Eletrônico Nacional. Você vai construir a aplicação que permite criar conta, entrar e
consultar essas comunicações.

### 1.1 Telas (Figma)

Arquivo: **[Figma — Case](https://www.figma.com/design/y8N01zjkPgv1rwc6W4xlt1/Case)**.


| Tela | Estados que precisam existir | |
|---|---|---|
| **Login** (`/login`) | padrão · erro "E-mail ou senha incorretos…" · carregando · mostrar/ocultar senha | **obrigatória** |
| **Cadastro** (`/cadastro`) | padrão · "Informe um e-mail válido." · "A senha deve ter no mínimo 8 caracteres." · "As senhas não coincidem." · carregando | **obrigatória** |
| **Comunicações** (`/comunicacoes`, protegida) | lista · filtros (busca por número do processo, tribunal, período com calendário de 2 meses) · paginação · conteúdo truncado com "Ler mais" · carregando (skeleton) · vazio ("Nenhuma comunicação encontrada") · erro · iniciais do usuário no avatar | **obrigatória** |
| Detalhes do processo (`/processos/:numero`) | cabeçalho com selo "Transitou em julgado" quando identificado e lista de movimentações | **obrigatória** |
| Modal "Resumo com IA" | botão "Resumir" → modal com o resumo e estado de carregando | bônus |



### 1.2 API — contrato

**Stack:** Node.js + **NestJS** + TypeScript + **PostgreSQL**. O ORM é livre (sugerimos Prisma).

O contrato abaixo fixa **rotas, parâmetros, formato da resposta e status HTTP**. Modelagem do banco,
arquitetura, formato das mensagens de erro e endpoints bônus são **decisão sua**.

| Método e rota | Autenticação | O que faz |
|---|---|---|
| `POST /auth/cadastro` | não | Cria a conta. Valida e-mail e senha (mínimo 8 caracteres); e-mail é único; a senha é guardada com hash |
| `POST /auth/login` | não | Devolve `{ "accessToken": "<JWT>" }` |
| `GET /tribunais` | Bearer | Lista de tribunais (para o filtro) |
| `GET /comunicacoes` | Bearer | Lista paginada com filtros (abaixo) |
| `GET /processos/:numero` | Bearer | *(bônus)* Detalhe do processo e suas comunicações |
| `POST /comunicacoes/:id/resumo` | Bearer | *(bônus)* Resumo do conteúdo. Pode usar um LLM (com a sua chave) ou algo simples; documente |

**Status esperados:**
- `400`: dados inválidos;
- `401`: sem token, token inválido ou login errado;
- `409`: e-mail já cadastrado.

**Filtros de `GET /comunicacoes`:**

| Parâmetro | Regra |
|---|---|
| `numeroProcesso` | número CNJ **com ou sem máscara** (`0000000-00.0000.0.00.0000` ou 20 dígitos) |
| `tribunal` | sigla (ex.: `TJSP`) |
| `dataInicio`, `dataFim` | `YYYY-MM-DD`, **inclusivos** |
| `page`, `pageSize` | padrão `1` e `10`; `pageSize` máximo `50` (acima disso: `400`) |

A lista vem ordenada da comunicação mais recente para a mais antiga.



**Dados:**
- Carregue `dados/comunicacoes.json` e `dados/tribunais.json` no banco, via seed ou importação.
- O formato do JSON é inspirado na API pública de comunicações do CNJ. Mapear esse formato para o seu modelo faz parte do trabalho.

**Obrigatório na API:**
- autenticação JWT nas rotas protegidas;
- senha com hash;
- validação de entrada;
- testes unitários e/ou de integração (pelo menos de autenticação e filtros);
- `docker compose up` subindo o banco e a API, com os dados carregados.

### 1.3 Front

- **React** + TypeScript. Build tool e biblioteca de UI são livres.
- **Rotas:** `/login`, `/cadastro` e `/comunicacoes`. A última é protegida: sem sessão, redireciona para
  o login.
- **API:** o front consome a sua API.


---

## Parte 2 — Resolução de problemas 

Responda no **`RESPOSTAS.md`**: o template já tem o tempo e o limite de tamanho de cada problema.
Queremos **o seu raciocínio**: diagnóstico, solução, prioridade e trade-offs. Código só onde pedimos.
Respostas longas e sem prioridade valem menos do que respostas curtas e certeiras.

### Problemas aprofundados

**P1 — Migração entre bancos com estruturas diferentes** ·  artefatos em `problemas/01-migracao/`

O sistema antigo guardava as negociações numa tabela larga do MySQL (`transacao`). O banco novo
(PostgreSQL) é normalizado em `cliente`, `processo` e `negocio`. Leia `acordos.md`, `legado.csv`
(uma amostra suja) e `schema-novo.sql`. Entregue:
- **(a)** Os problemas que você encontrou nos dados e a decisão para cada um (tabela).
- **(b)** Em **Python**, em `problemas/01-migracao/solucao/`: os DTOs e a transformação de
  `legado.csv` para um `saida.json` com `clientes`, `processos`, `negocios` e `rejeitados` (com o motivo),
  mais **pelo menos 3 testes** (pytest) das regras mais arriscadas.
- **(c)** Em até 10 linhas: como você rodaria isso em produção, com **800 mil linhas** e o sistema antigo
  **ainda recebendo alterações** até a virada.

**P2 — Fila RabbitMQ perdendo e duplicando mensagens** · `problemas/02-fila/`

Leia `consumer.ts` e `sintomas.md`. Entregue:
- **(a)** A causa de cada sintoma, apontando as linhas do código.
- **(b)** Um trecho corrigido em TypeScript (até 40 linhas).
- **(c)** Como garantir que cada comunicação seja gravada **uma única vez**, mesmo com reentregas e várias
  réplicas.

**P3 — Kubernetes: API instável depois de um deploy** ·`problemas/03-kubernetes/`

Leia `evidencias.md`, `deployment.yaml` e `hpa.yaml`. Entregue:
- **(a)** A cadeia de causas, em até 8 linhas.
- **(b)** As 3 ações que você faria agora, em ordem.
- **(c)** O que mudar nos manifests (pode ser um diff).
- **(d)** Por que homolog não pegou o problema e o que você mudaria no processo.
- **(e)** Uma mensagem para o time de suporte (CS), em até 5 linhas e sem jargão.

**P4 — Code review de um PR feito com IA** ·  `problemas/04-code-review/pr-142.diff`

Faça a revisão como faria no GitHub:
- até **8 comentários priorizados**, cada um com arquivo:linha, severidade (bloqueante, importante ou
  sugestão) e o que fazer;
- a sua decisão: aprovar ou pedir mudanças;
- 2–3 linhas de feedback para quem abriu o PR.

### Problemas rápidos (até 150 palavras cada)

**P5 — Integração externa instável** 

Toda segunda, das 08:00 às 09:00, um job consulta num fornecedor externo a situação de **20.000
processos**. O fornecedor aceita **100 requisições por minuto**. Hoje o job:
- dispara as chamadas em paralelo;
- recebe muitos `429` e timeouts;
- quando falha, **recomeça do zero**.

O fornecedor também envia webhooks de movimentação, e às vezes um evento antigo chega **depois** de um
mais novo e sobrescreve o status do processo. Como você redesenharia o job e o recebimento dos webhooks?

**P6 — Consulta lenta no banco** · `problemas/06-consulta-lenta/`

Leia `consulta.sql` e `explain.txt`. Explique por que as consultas A, B e C estão lentas e como
corrigiria cada uma (com SQL), além de como validaria a melhora.

**P7 — Dados sensíveis e IA** · 

Advogados não conseguem entrar com certificado digital em produção. Para ganhar tempo, um colega quer
colar num chat de IA público o log de produção do erro. O log tem:
- nome, CPF e OAB dos advogados;
- o token JWT da sessão;
- um trecho da **chave privada do certificado**, que aparece na mensagem de erro.

O que você faz agora? Como usaria IA com segurança nesse caso? E em que situações não usaria?

---

## Uso de IA

- **Pode usar** qualquer assistente (Copilot, Claude, ChatGPT, Cursor…) em qualquer parte do case.
- **Registre** no `AI_USAGE.md`: ferramentas, o que delegou, prompts importantes, onde a IA errou, como
  você validou e o que ensinaria ao time.


## Entrega



**1. Repositório no GitHub**

O código completo deve ser versionado em um repositório público  no GitHub com o nome case-fullstack-<suas-iniciais>..


Commits: incrementais, ao longo do trabalho. Não um único commit no fim.

Na raiz: api/, web/, docker-compose.yml, README.md preenchido (como rodar · decisões · premissas, bloqueios e o que ficou de fora · horas gastas), RESPOSTAS.md, AI_USAGE.md e problemas/01-migracao/solucao/.

**2. Deploy**

Deverá ser feito o deploy completo do projeto, incluindo:

Frontend: Disponível em um ambiente de produção e integrado ao backend.

Prototipo: O frontend deverá ser fiel ao prototipo.

Backend: Hospedado em um ambiente acessível publicamente, com a API funcionando conforme especificado.

Banco de Dados: Configurado para o ambiente de produção, acessível e funcional.

**3. Documentação**

Manual de Produto (em PDF): Descrição funcional do sistema, incluindo instruções de uso para usuários finais .

Documentação Técnica (em PDF):

Documentações da Rota da API (ex.: Swagger/OpenAPI).

Estrutura do banco de dados (diagramas e explicações).


Dependências e instruções de configuração.

**4. README Bem Estruturado**

Visão geral do projeto.

Requisitos para execução local.

Instruções de instalação e execução.

Exemplos de requisições à API.

Explicação do fluxo de trabalho do Kanban.

## Como vamos avaliar

| Bloco | Peso |
|---|---|
| Construção da API (contrato, segurança, modelagem, validação) | 20 |
| Front pixel perfect (fidelidade ao Figma, estados, responsivo) | 25 |
| Qualidade de código, testes, Git e README | 15 |
| Resolução de problemas (P1 a P7) | 30 |
| Uso de IA | 10 |

Os bônus valem no máximo +5. A **conversa técnica** confirma cada bloco: o que você não consegue explicar não conta.

**Dúvidas:** responda o e-mail do recrutamento. 
Boa sorte! 🚀
