# P1 — Migração: o que o time já decidiu

O sistema antigo guardava cada negociação numa tabela única e larga do MySQL, a `transacao`. Quase
tudo era `VARCHAR`, preenchido à mão e por integrações diferentes ao longo de anos. O arquivo
`legado.csv` é uma **amostra** dessa tabela. O modelo novo está em `schema-novo.sql`.

## Já decidido

- Cada linha da `transacao` vira **um `negocio`**, e `negocio.legado_id` recebe o `id` do legado.
- `processo` é único pelo número CNJ e `cliente` é único pelo CPF. Os dois são gravados **só com dígitos**.
- Tribunais aceitos no sistema novo:

  | Sigla | Nome |
  |---|---|
  | TJSP | Tribunal de Justiça de São Paulo |
  | TJRJ | Tribunal de Justiça do Rio de Janeiro |
  | TJMG | Tribunal de Justiça de Minas Gerais |
  | TJMS | Tribunal de Justiça de Mato Grosso do Sul |
  | TJPR | Tribunal de Justiça do Paraná |
  | TRF3 | Tribunal Regional Federal da 3ª Região |
  | TRT2 | Tribunal Regional do Trabalho da 2ª Região |

- De-para de status (texto do legado → enum novo):

  | Legado | Novo |
  |---|---|
  | Em andamento | `EM_ANDAMENTO` |
  | Concluída | `CONCLUIDO` |
  | Cancelada | `CANCELADO` |
  | Cancelada após assinatura | `CANCELADO` |
  | Perdida | `PERDIDO` |

## Não decidido

Todo o resto é com você. Encontre os problemas nos dados, decida o que fazer com cada um e
**registre a decisão**. Não existe uma única resposta certa: avaliamos se você percebeu o problema e
se a sua decisão é defensável.
