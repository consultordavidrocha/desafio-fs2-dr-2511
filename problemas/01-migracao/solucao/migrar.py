"""Lê o legado.csv e grava o saida.json.

Uso (a partir desta pasta):
    python migrar.py                          # ../legado.csv → saida.json
    python migrar.py --entrada X.csv --saida Y.json
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import asdict
from datetime import date
from decimal import Decimal
from enum import Enum
from pathlib import Path

from dtos import LinhaLegado, Resultado
from transformacao import transformar

AQUI = Path(__file__).resolve().parent


def ler_csv(caminho: Path) -> list[LinhaLegado]:
    with caminho.open(encoding="utf-8", newline="") as arquivo:
        return [LinhaLegado.from_csv(row) for row in csv.DictReader(arquivo)]


def _json(valor):
    if isinstance(valor, Decimal):
        return str(valor)  # "30.00": string para não perder precisão (NUMERIC(5,2))
    if isinstance(valor, date):
        return valor.isoformat()
    if isinstance(valor, Enum):
        return valor.value
    raise TypeError(f"tipo não serializável: {type(valor)}")


def para_json(resultado: Resultado) -> dict:
    dados = asdict(resultado)
    for rejeitado in dados["rejeitados"]:
        rejeitado["motivo"] = "; ".join(rejeitado.pop("motivos"))
    return dados


def main() -> None:
    parser = argparse.ArgumentParser(description="Migra legado.csv para saida.json")
    parser.add_argument("--entrada", type=Path, default=AQUI.parent / "legado.csv")
    parser.add_argument("--saida", type=Path, default=AQUI / "saida.json")
    args = parser.parse_args()

    resultado = transformar(ler_csv(args.entrada))
    args.saida.write_text(
        json.dumps(para_json(resultado), default=_json, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"{len(resultado.negocios)} negócios, {len(resultado.clientes)} clientes, "
        f"{len(resultado.processos)} processos, {len(resultado.rejeitados)} rejeitados, "
        f"{len(resultado.avisos)} avisos → {args.saida}"
    )


if __name__ == "__main__":
    main()
