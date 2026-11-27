# Parte 2: material do case

Os arquivos desta pasta são o **enunciado da Parte 2, fornecido pela JusCash** no repositório
oficial do case ([`Juscash/case_novembro_2026`](https://github.com/Juscash/case_novembro_2026)),
copiados **sem nenhuma alteração**. Conferi arquivo por arquivo contra o original.

Nomes, autores e textos dentro deles fazem parte do exercício e são fictícios. Por exemplo, no
[`pr-142.diff`](04-code-review/pr-142.diff), "Autor: dev-exemplo · Revisor: você" é o
desenvolvedor fictício que abriu o PR e o candidato que faz a revisão.

Li e analisei cada artefato, e **as soluções são minhas** (David Rocha). O apoio de IA no trabalho
está descrito em [`AI_USAGE.md`](../AI_USAGE.md).

| Problema | Material fornecido (enunciado) | Minha solução |
|---|---|---|
| P1: Migração | [`01-migracao/`](01-migracao/): `legado.csv`, `schema-novo.sql`, `acordos.md` | [código Python + testes](01-migracao/solucao/) e [resposta](../RESPOSTAS.md#p1--migração-entre-bancos-com-estruturas-diferentes-) |
| P2: Fila RabbitMQ | [`02-fila/`](02-fila/): `consumer.ts`, `sintomas.md` | [resposta](../RESPOSTAS.md#p2--fila-rabbitmq-) |
| P3: Kubernetes | [`03-kubernetes/`](03-kubernetes/): `deployment.yaml`, `hpa.yaml`, `evidencias.md` | [resposta](../RESPOSTAS.md#p3--kubernetes-) |
| P4: Code review | [`04-code-review/`](04-code-review/): `pr-142.diff` | [resposta](../RESPOSTAS.md#p4--code-review-do-pr-142-) |
| P5: Integração instável | sem arquivos (só texto no enunciado) | [resposta](../RESPOSTAS.md#p5--integração-externa-instável---até-150-palavras) |
| P6: Consulta lenta | [`06-consulta-lenta/`](06-consulta-lenta/): `consulta.sql`, `explain.txt` | [resposta](../RESPOSTAS.md#p6--consulta-lenta--até-150-palavras--sql) |
| P7: Dados sensíveis e IA | sem arquivos (só texto no enunciado) | [resposta](../RESPOSTAS.md#p7--dados-sensíveis-e-ia---até-150-palavras) |

O "antes e depois" do banco da P1, com diagramas, está em
[`docs/banco-de-dados.md`](../docs/banco-de-dados.md).
