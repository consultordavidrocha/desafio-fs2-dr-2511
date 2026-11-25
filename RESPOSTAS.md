# Respostas — Parte 2

> Rascunho: a estrutura definitiva segue o template do repositório do case.

## P1 — Migração entre bancos com estruturas diferentes

_Pendente: depende dos artefatos em `problemas/01-migracao/`._

## P2 — Fila RabbitMQ perdendo e duplicando mensagens

_Pendente: depende de `problemas/02-fila/`._

## P3 — Kubernetes: API instável depois de um deploy

_Pendente: depende de `problemas/03-kubernetes/`._

## P4 — Code review de um PR feito com IA

_Pendente: depende de `problemas/04-code-review/`._

## P5 — Integração externa instável

**Diagnóstico.** 20.000 consultas a 100 req/min levam 200 minutos: não cabem em 1 hora, e o paralelismo só gera 429. Recomeçar do zero desperdiça o que já foi feito.

**Job.** Enfileirar um item por processo e consumir com um rate limiter compartilhado entre os workers (token bucket a ~90 req/min, com folga). Em caso de 429, respeitar o `Retry-After`; em timeout, backoff exponencial com jitter e limite de tentativas, depois fila de erro. Gravar o progresso por processo para retomar de onde parou. Para caber no prazo: começar antes, priorizar os mais desatualizados ou negociar limite maior ou endpoint em lote.

**Webhooks.** Validar a assinatura, gravar o evento e responder 2xx na hora; processar de forma assíncrona e deduplicar pelo id do evento. Atualizar o status só se o evento for mais novo que o último aplicado (`UPDATE ... WHERE ultimo_evento_em < :data_evento`). Eventos antigos entram apenas no histórico.

## P6 — Consulta lenta no banco

_Pendente: depende de `problemas/06-consulta-lenta/`._

## P7 — Dados sensíveis e IA

**Agora.** Não colar o log. Como ele já contém chave privada e JWT, trato como incidente: revogar e reemitir o certificado exposto, invalidar as sessões e verificar onde mais esse log foi parar (agregador, tickets, chats). Aviso segurança e DPO, porque nome, CPF e OAB são dados pessoais (LGPD). Corrijo a origem: o log nunca deveria imprimir chave nem token.

**Usando IA com segurança.** Mando só o necessário para o diagnóstico: stack trace e mensagem de erro, com CPF, nomes, OAB, token e chave removidos ou substituídos por dados fictícios. De preferência, reproduzo o erro em homologação com certificado de teste. Uso apenas ferramentas aprovadas pela empresa, com contrato que impeça retenção e treinamento.

**Quando não usar.** Quando não der para anonimizar; quando houver segredos (chaves, senhas, tokens) ou dados de clientes sob sigilo; e em ferramentas públicas não aprovadas.
