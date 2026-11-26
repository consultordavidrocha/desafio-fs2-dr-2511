# P3 — Evidências: API instável na segunda de manhã

## Contexto
- A API de comunicações roda no Kubernetes (`deployment.yaml` e `hpa.yaml` nesta pasta).
- **Postgres:** `max_connections = 100`. Outros serviços usam cerca de 25 conexões.
- **Sexta, 18:40:** deploy do PR #311, *"cache em memória das comunicações para acelerar a listagem"*. O
  cache é um `Map` no processo, sem limite de tamanho nem expiração. A imagem foi publicada como
  `:latest` e o rollout foi um `kubectl rollout restart`.
- **Homolog:** 1 réplica, base com 2 mil comunicações, sem teste de carga. Lá funcionou.

## Linha do tempo de segunda (horário de Brasília)

| Hora | O que se viu |
|---|---|
| 08:00 | Pico de acesso de segunda (escritórios conferindo os prazos da semana) |
| 08:06 | Memória dos pods subindo continuamente: 140Mi → 230Mi |
| 08:09 | Primeiro pod reinicia: `OOMKilled` |
| 08:11 | CPU alta (GC + pods reiniciando). O HPA escala de 3 para 6 |
| 08:14 | HPA escala de 6 para 10 |
| 08:16 | Postgres: `FATAL: sorry, too many clients already` |
| 08:17 | `/health` começa a dar timeout. A liveness falha e reinicia pods que **não** estavam sem memória |
| 08:20 | Ingress: 31% das requisições com 502/504 |
| 09:30 | Suporte abre chamado: "clientes não conseguem ver as comunicações" |

## Saídas coletadas às 09:35

```
$ kubectl -n comunicacoes get pods
NAME                                READY   STATUS             RESTARTS       AGE
api-comunicacoes-5f7c9d8b6d-2kq8x   0/1     CrashLoopBackOff   9 (40s ago)    2d15h
api-comunicacoes-5f7c9d8b6d-7hw2p   1/1     Running            6 (3m ago)     2d15h
api-comunicacoes-5f7c9d8b6d-9tmzc   0/1     Running            7 (1m ago)     2d15h
api-comunicacoes-5f7c9d8b6d-c4l5r   1/1     Running            3 (8m ago)     82m
... (10 pods no total)

$ kubectl -n comunicacoes describe pod api-comunicacoes-5f7c9d8b6d-2kq8x
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
Events:
  Warning  Unhealthy  2m (x14 over 70m)  kubelet  Liveness probe failed: Get "http://10.0.3.17:3000/health": context deadline exceeded
  Warning  BackOff    40s (x31 over 60m) kubelet  Back-off restarting failed container api

$ kubectl -n comunicacoes describe hpa api-comunicacoes
  Normal  SuccessfulRescale  84m  horizontal-pod-autoscaler  New size: 6; reason: cpu resource utilization above target
  Normal  SuccessfulRescale  81m  horizontal-pod-autoscaler  New size: 10; reason: cpu resource utilization above target
```

```
# log do Postgres
2025-11-03 08:16:41 -03 FATAL:  sorry, too many clients already
2025-11-03 08:16:41 -03 FATAL:  remaining connection slots are reserved for roles with the SUPERUSER attribute
... (1.942 ocorrências entre 08:16 e 09:35)
```
