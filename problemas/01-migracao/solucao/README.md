# P1 — Solução da migração (Python 3.12, sem dependências em produção)

```bash
cd problemas/01-migracao/solucao
python migrar.py                    # lê ../legado.csv e grava saida.json

python -m venv .venv                # testes (pytest)
.venv/bin/pip install -r requirements-dev.txt        # Windows: .venv\Scripts\pip
.venv/bin/python -m pytest -q
```

| Arquivo | Responsabilidade |
|---|---|
| `dtos.py` | Linha bruta do legado (`LinhaLegado`) e entidades do banco novo (`Cliente`, `Processo`, `Negocio`), mais `Rejeitado` e `Aviso` |
| `normalizacao.py` | Uma função por campo: CNJ e CPF com dígito verificador, tribunal, valor em centavos, deságio, data, status |
| `transformacao.py` | Linha a linha → candidatos ou rejeitados; remove duplicatas; consolida clientes e processos |
| `migrar.py` | CLI: CSV → `saida.json` |
| `tests/test_regras.py` | Regras mais arriscadas (dinheiro, status, identidade) e o fluxo completo no `legado.csv` |

`saida.json` tem `clientes`, `processos`, `negocios` e `rejeitados` (com o motivo, como pede o
enunciado) e também `avisos`: correções que **não** invalidam a linha (ex.: data impossível vira
NULL) e devem passar por revisão humana. Negócios referenciam processo e cliente pela chave natural
(CNJ e CPF), porque os `id` SERIAL só existem depois do INSERT.

Diagrama do **antes e depois** (a `transacao` do legado → `cliente`, `processo` e `negocio`), com o
de-para coluna a coluna: [`docs/banco-de-dados.md`](../../../docs/banco-de-dados.md).
