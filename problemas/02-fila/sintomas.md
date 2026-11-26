# P2 — Sintomas observados no worker de captura

O worker consome a fila `comunicacoes.capturadas` e grava cada comunicação recebida no Postgres.
Roda em **4 réplicas**. O serviço que publica entrega *at-least-once*: a mesma comunicação, com o
mesmo `idExterno`, pode chegar mais de uma vez.

## 1. Depois da manutenção do RabbitMQ, a fila só cresce

O RabbitMQ reiniciou às 09:12 por manutenção do provedor. Situação às 14:00:

```
$ kubectl get pods -l app=captura-worker
NAME                              READY   STATUS    RESTARTS   AGE
captura-worker-7d9c5b6f4-2xkqp    1/1     Running   0          6d
captura-worker-7d9c5b6f4-8hd7t    1/1     Running   0          6d
captura-worker-7d9c5b6f4-tq4mz    1/1     Running   0          6d
captura-worker-7d9c5b6f4-w9rlx    1/1     Running   0          6d

$ rabbitmqctl list_queues name messages consumers
comunicacoes.capturadas        48213   0
comunicacoes.capturadas.dlq    0       0
```

Log de um dos pods (os outros são iguais):

```
09:12:03 [rabbitmq] conexão fechada
09:12:33 [worker] vivo
09:13:03 [worker] vivo
... (só "[worker] vivo" a cada 30s até agora)
```

## 2. Comunicações duplicadas

```sql
SELECT id_externo, count(*), min(created_at), max(created_at)
FROM comunicacao GROUP BY id_externo HAVING count(*) > 1 ORDER BY 2 DESC LIMIT 3;

      id_externo       | count |          min            |          max
-----------------------+-------+-------------------------+-------------------------
 DJEN-20251103-004112  |     3 | 2025-11-03 08:02:11.120 | 2025-11-03 08:02:11.161
 DJEN-20251103-003978  |     2 | 2025-11-03 08:02:09.877 | 2025-11-03 08:02:09.902
 DJEN-20251103-001207  |     2 | 2025-11-03 08:01:12.330 | 2025-11-03 08:01:12.348
```

A coluna `comunicacao.id_externo` tem índice comum (**não** é `UNIQUE`).

## 3. A DLQ está sempre vazia, embora o log mostre erros

```
$ kubectl logs -l app=captura-worker --since=24h | grep -c "enviando para a DLQ"
2317

$ rabbitmqctl list_bindings source_name routing_key destination_name
captura   comunicacao.capturada       comunicacoes.capturadas
captura   comunicacao.capturada.dlq   comunicacoes.capturadas.dlq
```

Painel do RabbitMQ (Overview → Message rates): `Publish (unroutable, dropped): 38/s` no pico da manhã.
