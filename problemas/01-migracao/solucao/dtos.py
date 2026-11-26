"""DTOs da migração: a linha bruta do legado e as entidades do banco novo.

Os nomes espelham `schema-novo.sql` (cliente, processo, negocio) e as chaves que o
enunciado fixa para o `saida.json`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


class StatusNegocio(str, Enum):
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDO = "CONCLUIDO"
    CANCELADO = "CANCELADO"
    PERDIDO = "PERDIDO"


@dataclass(frozen=True)
class LinhaLegado:
    """Uma linha da tabela `transacao`, exatamente como veio (tudo texto)."""

    id: str
    processo: str
    tribunal: str
    classe: str
    cliente_nome: str
    cliente_cpf: str
    valor_bruto: str
    desagio: str
    status: str
    data_compra: str
    atualizado_em: str

    @classmethod
    def from_csv(cls, row: dict[str, str]) -> "LinhaLegado":
        return cls(**{name: (row.get(name) or "") for name in cls.__dataclass_fields__})


@dataclass(frozen=True)
class Cliente:
    cpf: str  # 11 dígitos
    nome: str


@dataclass(frozen=True)
class Processo:
    numero_cnj: str  # 20 dígitos
    tribunal_sigla: str
    classe: str | None


@dataclass(frozen=True)
class Negocio:
    legado_id: int
    processo_numero_cnj: str  # chave natural: o id SERIAL só existe depois do INSERT
    cliente_cpf: str
    valor_bruto_centavos: int | None
    desagio_percentual: Decimal | None  # NUMERIC(5,2): 30% = 30.00
    status: StatusNegocio
    data_compra: date | None


@dataclass
class Candidato:
    """Linha já normalizada e válida, antes da consolidação (duplicatas, nomes, classe)."""

    negocio: Negocio
    cliente_nome: str
    processo_tribunal: str
    processo_classe: str | None
    atualizado_em: datetime | None
    avisos: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class Rejeitado:
    legado_id: str
    motivos: tuple[str, ...]


@dataclass(frozen=True)
class Aviso:
    """Valor corrigido ou descartado sem rejeitar a linha: vai para revisão humana."""

    legado_id: int
    mensagem: str


@dataclass
class Resultado:
    clientes: list[Cliente]
    processos: list[Processo]
    negocios: list[Negocio]
    rejeitados: list[Rejeitado]
    avisos: list[Aviso]
