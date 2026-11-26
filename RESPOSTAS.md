# Parte 2 — Respostas

> Seja direto: diagnóstico, solução, prioridade e trade-offs. Respeite os limites; o que passar deles
> não será lido.

## P1 — Migração entre bancos com estruturas diferentes ·

### (a) Problemas encontrados e decisões
| Problema nos dados | Linhas (id) | Decisão | Por quê |
|---|---|---|---|
| Tribunal em formatos diferentes (`TJ-SP`, `tjsp`, nome por extenso) | 1001, 1002, 1003 | Normalizar para a sigla (sem pontuação/caixa) ou casar pelo nome da tabela do acordo | É o mesmo tribunal; perder a linha por formatação seria desperdício |
| Tribunal inexistente (`TJXX`) | 1005 | Usar o tribunal codificado no número CNJ (`8.13` = TJMG), com **aviso** | O CNJ identifica o tribunal; a 1012, do mesmo processo, confirma TJMG |
| Tribunal que contradiz o CNJ (regra preventiva) | — | Rejeitar | Não há como saber qual dos dois está certo |
| Número do processo não é CNJ (`ver anexo`) ou incompleto (16 dígitos) | 1004, 1013 | Rejeitar | `processo` é único pelo CNJ; sem ele não há processo |
| Mesmo processo com e sem máscara/espaços | 1001/1002/1010, 1003/1011, 1005/1012 | Só dígitos + **dígito verificador** (módulo 97) | Acordo: único pelo CNJ; o DV barra número digitado errado |
| Mesmo CPF com e sem máscara | 1001/1003/1010, 1002/1007, 1005/1012 | Só dígitos + DV do CPF | Acordo: cliente único pelo CPF |
| CPF inválido (`111.111.111-11`) | 1006 | Rejeitar | CPF falso juntaria pessoas diferentes num único cliente |
| Nome do mesmo cliente em caixas diferentes, com espaços | 1003, 1007 | Um nome por CPF: o bem formatado (nem só maiúsculas nem só minúsculas), da linha mais recente | Um cliente, um nome; a linha mais nova da Paula está em CAIXA ALTA |
| Valor em 4 formatos (`R$ 15.000,00`, `4.750,00`, `15.000`, `1234.5`) | 1001, 1011, 1002, 1003 | Vírgula = decimal (padrão BR); ponto + 3 dígitos = milhar; senão ponto decimal; gravar em centavos | Ler `15.000` como R$ 15,00 seria erro de 1000× no dinheiro |
| Valor vazio | 1008 | `NULL` + aviso | A coluna aceita; o negócio existe |
| Deságio `0,3` sem `%` | 1003 | Ler como fração (30%) + aviso | Todos os outros estão entre 15% e 35%; 0,3% seria um outlier improvável |
| Deságio sem `%` ou com vírgula (`25`, `30,5%`) | 1002, 1007, 1011 | Número com 2 casas | `NUMERIC(5,2)` |
| Status fora do padrão (`concluido`, `perdida`, `CANCELADA após assinatura`) | 1003, 1007, 1008 | De-para sem diferenciar caixa/acento; aceitar o nome do enum | Mesmo significado do acordo |
| Status sem de-para (`Aguardando assistente`) | 1009 | Rejeitar | Inventar um mapeamento é decisão de negócio, não de migração |
| Data em 3 formatos (`15/08/2025`, ISO, ISO com hora) | 1001, 1002, 1003 | Converter para `DATE` | — |
| Data impossível (`0000-00-00`, `31/02/2025`) | 1007, 1008 | `NULL` + aviso | A coluna aceita `NULL`; rejeitar perderia um negócio válido |
| Classe placeholder ou vazia (`não se aplica`, vazio) | 1002, 1011 | `NULL`; o processo fica com a classe preenchida mais recente | Não gravar lixo como classe |
| Duplicata exata (mesmo processo, cliente, valor, deságio, status e data) | 1010 (= 1001) | Rejeitar como duplicata; fica a atualizada por último | Importar as duas dobraria o valor comprado |
| Cliente/processo que só aparece em linhas rejeitadas (cliente João; processos do TJPR e do TJMS) | 1004, 1006, 1009 | Não criar | Evita registro órfão, sem negócio |

Resultado: **8 negócios, 5 clientes, 5 processos, 5 rejeitados (com motivo) e 5 avisos.**
Cada linha rejeitada traz **todos** os seus motivos, para ser corrigida de uma vez.

### (b) Código
<!-- em problemas/01-migracao/solucao/ — DTOs + transformação → saida.json + ≥ 3 testes (pytest). Diga como rodar: -->
Em [`problemas/01-migracao/solucao/`](problemas/01-migracao/solucao/) (Python 3.12, sem dependências
em produção): `dtos.py`, `normalizacao.py` (uma função por campo), `transformacao.py` e `migrar.py`.

```bash
cd problemas/01-migracao/solucao
python migrar.py                                     # ../legado.csv → saida.json
python -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q                        # 37 testes (Windows: .venv\Scripts\...)
```

`saida.json` traz `clientes`, `processos`, `negocios`, `rejeitados` e também `avisos` (correções que
não invalidam a linha, para revisão humana). O CI roda os testes e confere se o `saida.json`
versionado está atualizado.

### (c) Como rodar em produção · até 10 linhas
1. Ensaio completo numa cópia do banco novo (ex.: branch do Postgres), com relatório de rejeitados.
2. Carga inicial a partir de uma réplica de leitura do MySQL, em lotes de ~10 mil linhas por id, em streaming, com checkpoint do último id: se cair, retoma de onde parou.
3. Escrita idempotente: `INSERT ... ON CONFLICT` por `legado_id`, CPF e CNJ — reprocessar não duplica.
4. Até a virada, alterações chegam por CDC (binlog → Debezium) ou, na falta, por delta de `atualizado_em > último checkpoint` (não pega exclusões; CDC pega).
5. Rejeitados e avisos vão para uma tabela de quarentena com dono no negócio; corrige-se na origem e o próximo delta reprocessa.
6. A deduplicação consulta o banco novo (assinatura do negócio), não só o lote, porque duplicatas podem chegar em deltas diferentes.
7. Reconciliação a cada carga: contagem e soma de valores por status, legado × novo.
8. Virada: congelar escrita no legado por alguns minutos, aplicar o último delta, reconciliar e trocar a aplicação.
9. Legado fica somente leitura por algumas semanas, como plano de volta.

## P2 — Fila RabbitMQ · 

### (a) Causa de cada sintoma (aponte as linhas)
1. **Fila só cresce, 0 consumidores:** a linha 12 só registra o `close`; não reconecta nem encerra. Canal e consumo morrem com a conexão, mas o `setInterval` da linha 39 mantém o processo vivo (`Running`, só "[worker] vivo"), então o Kubernetes não reinicia nada.
2. **Duplicatas:** consulta-e-insere não atômico (linhas 22–30) com 4 réplicas e `prefetch(500)` (linha 15). Na reentrega *at-least-once*, duas réplicas processam o mesmo `idExterno` ao mesmo tempo (created_at com milissegundos de diferença), ambas não acham registro e ambas inserem — e `id_externo` não é `UNIQUE`.
3. **DLQ vazia:** a routing key da linha 8 está digitada errada (`.dql`; o binding é `.dlq`). A mensagem não é roteada e é descartada ("unroutable, dropped 38/s"), e a linha 35 dá `ack` mesmo assim: a mensagem é perdida para sempre.

### (b) Trecho corrigido · até 40 linhas
```ts
// Pré-requisitos: UNIQUE(id_externo) no banco e dead-letter configurado por policy no broker:
// rabbitmqctl set_policy dlx "^comunicacoes.capturadas$" \
//   '{"dead-letter-exchange":"captura","dead-letter-routing-key":"comunicacao.capturada.dlq"}'
async function main() {
  const conexao = await amqp.connect(process.env.RABBITMQ_URL!);
  // Sem conexão não há consumo: encerra e deixa o Kubernetes reiniciar (e reconectar).
  conexao.on('close', () => { console.error('[rabbitmq] conexão fechada; encerrando'); process.exit(1); });
  conexao.on('error', (erro) => console.error('[rabbitmq] erro', erro));

  const canal = await conexao.createChannel();
  canal.on('close', () => process.exit(1));
  await canal.prefetch(50); // vazão por réplica; menos mensagens "em voo" para reentregar

  await canal.consume(FILA, async (msg) => {
    if (!msg) return process.exit(1); // consumo cancelado pelo broker
    let evento: any;
    try {
      evento = JSON.parse(msg.content.toString());
      // Idempotente e atômico: ON CONFLICT (id_externo) DO NOTHING — reentrega vira no-op.
      // (Se o mapper criar destinatários aninhados, createMany não serve: create + P2002 = duplicata, ack.)
      await prisma.comunicacao.createMany({ data: [mapearComunicacao(evento)], skipDuplicates: true });
      canal.ack(msg); // só depois do commit
    } catch (erro) {
      console.error('[consumer] falhou; mensagem vai para a DLQ', { idExterno: evento?.idExterno, erro });
      canal.nack(msg, false, false); // o broker roteia para a DLQ (policy): sem typo, sem perda
    }
  });
}
```
Saúde do worker: a liveness deve checar se há consumo ativo (não um `setInterval`). Erro transitório
(banco fora) mereceria retry com atraso antes da DLQ; a DLQ é para mensagem que nunca vai passar.

### (c) Como garantir gravação única
A garantia tem de estar **no banco**, não no código: `UNIQUE (id_externo)` (criado com
`CREATE UNIQUE INDEX CONCURRENTLY` depois de remover as duplicatas atuais, mantendo a de menor id) e
`INSERT ... ON CONFLICT (id_externo) DO NOTHING`. Com isso, reentregas e N réplicas concorrendo dão
sempre um único registro, sem lock na aplicação. O `ack` só sai depois do commit: se o worker cair
antes, a mensagem volta e o insert vira no-op. *At-least-once* na entrega + consumidor idempotente =
efeito de exatamente uma vez. Se o evento puder trazer versões novas da mesma comunicação, trocar por
`ON CONFLICT DO UPDATE ... WHERE versao_nova > versao_atual`.

## P3 — Kubernetes · 

### (a) Cadeia de causas · até 8 linhas
1. O cache do PR #311 (`Map` sem limite nem expiração) cresce com o pico de segunda até o limite de 256Mi.
2. `--max-old-space-size=1024` é maior que o limite: o V8 não coleta a tempo e o kernel mata o contêiner (`OOMKilled`).
3. GC e reinícios elevam a CPU; o HPA, que escala por CPU, sobe de 3 para 10 pods — cada um com cache vazio, repetindo o ciclo.
4. 10 pods × `connection_limit=20` = 200 conexões, contra ~75 livres (100 − 25 de outros serviços): `too many clients`.
5. A liveness faz `SELECT 1`; sem conexão ela estoura o timeout de 1 s e o kubelet reinicia pods **saudáveis**.
6. Menos pods prontos → mais carga nos restantes → mais falhas: espiral até 31% de 502/504.
7. `:latest` + `rollout restart` deixaram o deploy sem versão identificável, atrasando o rollback.

### (b) 3 ações agora, em ordem
1. Rollback para a imagem anterior ao PR #311, fixada por digest — remove a causa (vazamento de memória).
2. Conter as conexões: limitar o HPA a 3 réplicas temporariamente e reduzir o `connection_limit` para caber nas ~75 livres.
3. Desacoplar a liveness do banco (`/live` sem consulta ao Postgres) para parar de reiniciar pods saudáveis; avisar o CS assim que estabilizar.

### (c) Mudanças nos manifests
```yaml
# deployment.yaml
-          image: registry.exemplo.com/comunicacoes/api:latest
-          imagePullPolicy: Always
+          image: registry.exemplo.com/comunicacoes/api:1.42.3   # versão/digest, nunca :latest
+          imagePullPolicy: IfNotPresent
           env:
             - name: DATABASE_URL
-              value: "postgresql://app:S3nh4Forte!@postgres.interno:5432/app?connection_limit=20"
+              valueFrom: { secretKeyRef: { name: api-db, key: url } }   # credencial fora do manifest; connection_limit=10
             - name: NODE_OPTIONS
-              value: "--max-old-space-size=1024"
+              value: "--max-old-space-size=384"   # ~75% do limite de memória
           resources:
-            requests: { cpu: 200m, memory: 256Mi }
-            limits:   { cpu: "1",  memory: 256Mi }
+            requests: { cpu: 250m, memory: 512Mi }
+            limits:   { cpu: "1",  memory: 512Mi }
+          startupProbe:  { httpGet: { path: /live, port: 3000 }, periodSeconds: 5, failureThreshold: 12 }
           livenessProbe:
-            httpGet: { path: /health, port: 3000 }   # faz SELECT 1 no Postgres
-            timeoutSeconds: 1
+            httpGet: { path: /live, port: 3000 }     # só "o processo responde"; sem banco
+            timeoutSeconds: 3
           readinessProbe:
-            httpGet: { path: /health, port: 3000 }
-            timeoutSeconds: 1
+            httpGet: { path: /ready, port: 3000 }    # aqui sim checa o banco: tira do tráfego, não reinicia
+            timeoutSeconds: 3
+  strategy: { rollingUpdate: { maxSurge: 1, maxUnavailable: 0 } }
# hpa.yaml
-  maxReplicas: 10
+  maxReplicas: 6          # 6 × 10 conexões = 60 ≤ ~75 livres (ou PgBouncer na frente do Postgres)
+  behavior: { scaleUp: { stabilizationWindowSeconds: 120 } }
```
E no código: cache com limite e TTL (LRU) — ou cache compartilhado (Redis) — em vez de `Map` sem fim.
A senha que estava no manifest foi parar no Git: trocá-la no Postgres, não só movê-la para o Secret.

### (d) Por que homolog não pegou, e o que muda no processo
Homolog tinha 1 réplica, 2 mil comunicações e nenhum pico: o cache nunca chegou a 256Mi e 1 × 20
conexões nunca chega perto do limite do Postgres. O problema só existe com volume e concorrência de
produção. Mudanças: teste de carga com volume próximo do real (base anonimizada) para PRs que mexem em
cache, memória ou pool; checklist de capacidade (réplicas máximas × pool ≤ conexões livres); alertas de
memória e de conexões; imagens versionadas com canário; e nada de deploy sexta à noite sem alguém de
plantão no pico de segunda.

### (e) Mensagem para o CS · até 5 linhas, sem jargão
Desde as 8h de hoje, parte dos clientes não conseguiu ver as comunicações por causa de uma atualização
feita na sexta. Já desfizemos essa atualização e o acesso está sendo normalizado. Nenhuma comunicação
foi perdida: os dados estão seguros. Se um cliente ainda tiver problema, peça que recarregue a página em
alguns minutos. Mandamos novo aviso até as 11h confirmando a normalização.

## P4 — Code review do PR #142 · 

| # | Arquivo:linha | Severidade | Comentário |
|---|---|---|---|
| 1 | `clientes-comunicacoes.service.ts:10-13` | **Bloqueante** | SQL injection: o CPF da query string é interpolado em `$queryRawUnsafe` (`' OR '1'='1` lista tudo). Use o query builder do Prisma ou `$queryRaw` com template parametrizado, e valide o CPF antes. |
| 2 | `clientes-comunicacoes.controller.ts:6-8` | **Bloqueante** | Rota sem autenticação: o `ComunicacoesController` usa `@UseGuards(JwtAuthGuard)` na classe; o novo controller não. Qualquer pessoa na internet consulta comunicações por CPF (dado pessoal, LGPD). Adicione o guard e restrinja ao perfil do CS. |
| 3 | `clientes-comunicacoes.controller.ts:16` | **Bloqueante** | O log grava o CPF e **todos os headers**, incluindo o `Authorization` (JWT): quem lê log vira o usuário. Remova; logue só um id de requisição e o CPF mascarado. |
| 4 | `prisma/schema.prisma:17` | **Importante** | Coluna `cpf` sem migration no PR, sem índice (busca por CPF vira varredura completa) e sem definição de origem do dado. Inclua a migration com índice e alinhe com o DPO a necessidade de guardar CPF em texto puro. |
| 5 | `clientes-comunicacoes.service.ts:24-25` | **Importante** | O `catch` engole qualquer erro e devolve `[]`: banco fora vira "cliente sem comunicações", sem alerta. Deixe a exceção subir (ou registre e lance). |
| 6 | `clientes-comunicacoes.service.ts:17-20` | **Importante** | N+1: uma consulta de destinatários por comunicação, e sem limite/paginação. Use `findMany` com `include` e `take`/`skip`, como já faz o `listarPorPeriodo`. |
| 7 | `clientes-comunicacoes.controller.ts:15,23-25` · `service.ts:34-35` | **Importante** | Sem validação: `cpf: any`. Sem `cpf`, o Prisma ignora o `some: { cpf: undefined }` e a rota de período devolve comunicações de **todos** os clientes; `new Date('abc')` gera *Invalid Date* e erro 500; `lte: new Date(dataFim)` corta o último dia (meia-noite). Crie um DTO com class-validator e trate o fim do período como inclusivo. |
| 8 | PR (geral) | Sugestão | Sem testes ("testei no Postman"): inclua e2e de autorização, CPF inválido e período. Duas rotas para o mesmo recurso → um `GET /clientes/:cpf/comunicacoes` com período opcional; o `take: 100` silencioso esconde resultados. |

**Decisão:** pedir mudanças.

**Feedback para quem abriu o PR (2–3 linhas):**
O caso de uso faz sentido e vai ajudar o CS. Antes de seguir, há três bloqueantes de segurança: rota
aberta, SQL injection e token no log. Ao usar IA, peça explicitamente autenticação, validação e testes,
e revise o código gerado como se fosse de outra pessoa — se quiser, pareamos nos ajustes.

## P5 — Integração externa instável ·  até 150 palavras

**Diagnóstico.** 20.000 consultas a 100 req/min levam 200 minutos: não cabem em 1 hora; paralelizar só gera 429. Recomeçar do zero desperdiça o que já foi feito.

**Job.** Enfileirar um item por processo e consumir com um rate limiter compartilhado entre os workers (token bucket a ~90 req/min, com folga). No 429, respeitar o `Retry-After`; em timeout, backoff exponencial com jitter e limite de tentativas, depois fila de erro. Gravar o progresso por processo para retomar de onde parou. Para caber: começar antes, priorizar os mais desatualizados ou negociar limite maior ou consulta em lote.

**Webhooks.** Validar a assinatura, gravar o evento e responder 2xx na hora; processar depois, deduplicando pelo id do evento. Atualizar o status só se o evento for mais novo que o último aplicado (`UPDATE ... WHERE ultimo_evento_em < :data_evento`). Eventos antigos vão só para o histórico.

## P6 — Consulta lenta · até 150 palavras + SQL

**A** aplica `regexp_replace` na coluna: o índice em `numero_processo` não serve e o Postgres varre 2,1 milhões de linhas. Correção: índice **de expressão** com a mesma expressão, mais a data na ordem da listagem: a consulta não muda e a tabela não é reescrita (uma coluna gerada a travaria).

**B** pede a página 2.001 com `OFFSET 40000` sem índice na data: ordena a tabela inteira em disco (1 GB) para descartar 40 mil linhas. Correção: índice `(data_disponibilizacao DESC, id DESC)` e paginação por cursor (*keyset*), que lê só 20 linhas em qualquer página.

**C** faz `count(*)` exato a cada página. Correção: contar só na primeira página (ou cachear); com filtro, usar o índice de A; sem filtro, estimativa.

**Validação:** `EXPLAIN (ANALYZE, BUFFERS)` antes e depois numa cópia com volume real (Index Scan, sem Sort em disco), `pg_stat_statements` e o p95 do endpoint no APM após o deploy.

```sql
-- A: índice sobre a MESMA expressão da consulta; a consulta A fica como está (Index Scan, sem Sort)
CREATE INDEX CONCURRENTLY comunicacao_numero_digitos_data_idx
  ON comunicacao ((regexp_replace(numero_processo, '\D', '', 'g')), data_disponibilizacao DESC, id DESC);

-- B: keyset — o cliente envia a data e o id do último item da página anterior
CREATE INDEX CONCURRENTLY comunicacao_data_id_idx ON comunicacao (data_disponibilizacao DESC, id DESC);
SELECT id, numero_processo, data_disponibilizacao, tipo, conteudo FROM comunicacao
WHERE (data_disponibilizacao, id) < ($ultima_data, $ultimo_id)
ORDER BY data_disponibilizacao DESC, id DESC LIMIT 20;

-- C: com filtro usa o índice de A; sem filtro, estimativa barata em vez de varrer a tabela
SELECT count(*) FROM comunicacao WHERE regexp_replace(numero_processo, '\D', '', 'g') = $1;
SELECT reltuples::bigint AS total_estimado FROM pg_class WHERE relname = 'comunicacao';
```

## P7 — Dados sensíveis e IA ·  até 150 palavras

**Agora.** Não colar o log. Como ele já contém chave privada e JWT, trato como incidente: revogar e reemitir o certificado exposto, invalidar as sessões e verificar onde mais esse log foi parar (agregador, tickets, chats). Aviso segurança e DPO, porque nome, CPF e OAB são dados pessoais (LGPD). Corrijo a origem: o log nunca deveria imprimir chave nem token.

**Usando IA com segurança.** Mando só o necessário para o diagnóstico: stack trace e mensagem de erro, com CPF, nomes, OAB, token e chave removidos ou substituídos por dados fictícios. De preferência, reproduzo o erro em homologação com certificado de teste. Uso apenas ferramentas aprovadas pela empresa, com contrato que impeça retenção e treinamento.

**Quando não usar.** Quando não der para anonimizar; quando houver segredos (chaves, senhas, tokens) ou dados de clientes sob sigilo; e em ferramentas públicas não aprovadas.
