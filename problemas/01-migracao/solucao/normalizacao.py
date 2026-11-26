"""Regras de limpeza de cada campo do legado.

Cada função devolve o valor normalizado ou levanta `CampoInvalido` com o motivo
(que vai para `rejeitados`). Correções que não invalidam a linha voltam junto com
um aviso (vão para `avisos`, para revisão humana).
"""

from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from dtos import StatusNegocio


class CampoInvalido(ValueError):
    """Valor que não dá para aproveitar: a linha é rejeitada com este motivo."""


# --- tabelas decididas pelo time (acordos.md) --------------------------------

TRIBUNAIS = {
    "TJSP": "Tribunal de Justiça de São Paulo",
    "TJRJ": "Tribunal de Justiça do Rio de Janeiro",
    "TJMG": "Tribunal de Justiça de Minas Gerais",
    "TJMS": "Tribunal de Justiça de Mato Grosso do Sul",
    "TJPR": "Tribunal de Justiça do Paraná",
    "TRF3": "Tribunal Regional Federal da 3ª Região",
    "TRT2": "Tribunal Regional do Trabalho da 2ª Região",
}

# Segmento "J.TR" do número CNJ → sigla (Resolução CNJ 65/2008), só para os aceitos.
TRIBUNAL_POR_SEGMENTO_CNJ = {
    "8.26": "TJSP", "8.19": "TJRJ", "8.13": "TJMG", "8.12": "TJMS",
    "8.16": "TJPR", "4.03": "TRF3", "5.02": "TRT2",
}

STATUS = {
    "em andamento": StatusNegocio.EM_ANDAMENTO,
    "concluida": StatusNegocio.CONCLUIDO,
    "cancelada": StatusNegocio.CANCELADO,
    "cancelada apos assinatura": StatusNegocio.CANCELADO,
    "perdida": StatusNegocio.PERDIDO,
}

PLACEHOLDERS = {"nao se aplica", "n/a", "na", "-", "nenhum", "nenhuma"}


# --- utilitários de texto ------------------------------------------------------

def sem_acento(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


def chave(texto: str) -> str:
    """Forma canônica para comparar: sem acento, minúscula, espaços colapsados."""
    return re.sub(r"\s+", " ", sem_acento(texto).casefold()).strip()


def texto(valor: str) -> str | None:
    limpo = re.sub(r"\s+", " ", valor or "").strip()
    return limpo or None


def classe(valor: str) -> str | None:
    limpo = texto(valor)
    return None if limpo is None or chave(limpo) in PLACEHOLDERS else limpo


def nome_bem_formatado(nome: str) -> bool:
    """Nome que não está todo em maiúsculas nem todo em minúsculas."""
    letras = [c for c in nome if c.isalpha()]
    return bool(letras) and not (all(c.isupper() for c in letras) or all(c.islower() for c in letras))


def capitalizar_nome(nome: str) -> str:
    particulas = {"de", "da", "das", "do", "dos", "e"}
    return " ".join(p if p in particulas else p.capitalize() for p in nome.lower().split())


# --- documentos ----------------------------------------------------------------

def _digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor or "")


def cpf(valor: str) -> str:
    d = _digitos(valor)
    if len(d) != 11:
        raise CampoInvalido(f"CPF sem 11 dígitos: {valor.strip()!r}")
    if d == d[0] * 11:
        raise CampoInvalido(f"CPF inválido (dígitos repetidos): {valor.strip()!r}")
    for posicao in (9, 10):
        soma = sum(int(d[i]) * (posicao + 1 - i) for i in range(posicao))
        if (soma * 10) % 11 % 10 != int(d[posicao]):
            raise CampoInvalido(f"CPF com dígito verificador inválido: {valor.strip()!r}")
    return d


def numero_cnj(valor: str) -> str:
    """NNNNNNN-DD.AAAA.J.TR.OOOO → 20 dígitos, com dígito verificador (módulo 97)."""
    bruto = (valor or "").strip()
    if not re.fullmatch(r"[\d.\-\s]+", bruto):
        raise CampoInvalido(f"número do processo não é um número CNJ: {bruto!r}")
    d = _digitos(bruto)
    if len(d) != 20:
        raise CampoInvalido(f"número do processo incompleto ({len(d)} de 20 dígitos): {bruto!r}")
    sequencial, dv, resto = d[:7], d[7:9], d[9:]
    if 98 - int(sequencial + resto + "00") % 97 != int(dv):
        raise CampoInvalido(f"número CNJ com dígito verificador inválido: {bruto!r}")
    return d


def segmento_cnj(numero: str) -> str:
    return f"{numero[13]}.{numero[14:16]}"


def tribunal(valor: str, numero: str) -> tuple[str, str | None]:
    """Sigla do tribunal. Aceita sigla com pontuação ("TJ-SP"), minúscula ou o nome por extenso.
    Se a sigla não existir, usa o tribunal codificado no número CNJ (com aviso).
    Se a sigla existir mas contradisser o CNJ, rejeita: não dá para saber qual está certo."""
    pelo_cnj = TRIBUNAL_POR_SEGMENTO_CNJ.get(segmento_cnj(numero))
    sigla = re.sub(r"[^A-Z0-9]", "", sem_acento(valor or "").upper())
    if sigla not in TRIBUNAIS:
        sigla = next((s for s, nome in TRIBUNAIS.items() if chave(nome) == chave(valor or "")), "")

    if sigla in TRIBUNAIS:
        if pelo_cnj and pelo_cnj != sigla:
            raise CampoInvalido(f"tribunal {sigla} diverge do número CNJ ({pelo_cnj})")
        return sigla, None
    if pelo_cnj:
        return pelo_cnj, f"tribunal {valor.strip()!r} não existe; usado {pelo_cnj}, do número CNJ"
    raise CampoInvalido(f"tribunal não aceito no sistema novo: {valor.strip()!r}")


# --- números --------------------------------------------------------------------

def valor_centavos(valor: str) -> int | None:
    """Reais → centavos. Formatos vistos: "R$ 15.000,00", "4.750,00", "15.000", "1234.5"."""
    limpo = re.sub(r"[R$\s]", "", valor or "")
    if not limpo:
        return None
    if "," in limpo:  # padrão brasileiro: ponto = milhar, vírgula = decimal
        limpo = limpo.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(\.\d{3})+", limpo):  # "15.000": ponto como milhar
        limpo = limpo.replace(".", "")
    try:
        reais = Decimal(limpo)
    except InvalidOperation:
        raise CampoInvalido(f"valor bruto ilegível: {valor!r}") from None
    if reais <= 0 or reais.as_tuple().exponent < -2:
        raise CampoInvalido(f"valor bruto inválido: {valor!r}")
    return int(reais * 100)


def desagio(valor: str) -> tuple[Decimal | None, str | None]:
    """Percentual com 2 casas. "30%", "30", "30,5%" → 30.00 / 30.50.
    "0,3" (sem %) é lido como fração (= 30%), com aviso: todos os outros deságios estão
    entre 15% e 35%, então 0,3% seria um outlier improvável."""
    bruto = (valor or "").strip()
    if not bruto:
        return None, None
    tem_percentual = bruto.endswith("%")
    try:
        numero = Decimal(bruto.rstrip("%").strip().replace(",", "."))
    except InvalidOperation:
        raise CampoInvalido(f"deságio ilegível: {valor!r}") from None
    aviso = None
    if not tem_percentual and 0 < numero <= 1:
        numero, aviso = numero * 100, f"deságio {bruto!r} lido como fração ({numero * 100:.0f}%)"
    if not 0 <= numero < 100:
        raise CampoInvalido(f"deságio fora de 0–100%: {valor!r}")
    return numero.quantize(Decimal("0.01")), aviso


# --- datas e status ---------------------------------------------------------------

def data(valor: str) -> tuple[date | None, str | None]:
    """Aceita DD/MM/AAAA, AAAA-MM-DD e AAAA-MM-DD HH:MM:SS. Data impossível vira NULL
    (a coluna aceita) com aviso, em vez de rejeitar o negócio inteiro."""
    bruto = (valor or "").strip()
    if not bruto:
        return None, None
    for formato, tamanho in (("%d/%m/%Y", 10), ("%Y-%m-%d", 10), ("%Y-%m-%d %H:%M:%S", 19)):
        try:
            return datetime.strptime(bruto[:tamanho], formato).date(), None
        except ValueError:
            continue
    return None, f"data de compra inválida {bruto!r}; gravada como NULL"


def data_hora(valor: str) -> datetime | None:
    try:
        return datetime.strptime((valor or "").strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def status(valor: str) -> StatusNegocio:
    """De-para do acordos.md, sem diferenciar maiúsculas/acentos. Também aceita o próprio
    nome do enum ("concluido" = CONCLUIDO). Texto fora disso é rejeitado: inventar um
    mapeamento seria decisão de negócio, não de migração."""
    k = chave(valor)
    if k in STATUS:
        return STATUS[k]
    enum = k.upper().replace(" ", "_")
    if enum in StatusNegocio.__members__:
        return StatusNegocio[enum]
    raise CampoInvalido(f"status sem de-para no sistema novo: {valor.strip()!r}")
