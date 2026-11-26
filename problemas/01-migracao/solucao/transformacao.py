"""Transforma as linhas do legado nas entidades do banco novo.

Fluxo:
1. normaliza cada linha (normalizacao.py); linha com campo inválido → `rejeitados`,
   com TODOS os motivos dela (não só o primeiro), para a correção ser feita de uma vez;
2. descarta duplicatas exatas (mesmo processo, cliente, valores, status e data),
   mantendo a de `atualizado_em` mais recente;
3. consolida `cliente` (único por CPF) e `processo` (único por CNJ) só a partir dos
   negócios aceitos — quem só aparece em linhas rejeitadas não é criado.
"""

from __future__ import annotations

from datetime import datetime

import normalizacao as n
from dtos import Aviso, Candidato, Cliente, LinhaLegado, Negocio, Processo, Rejeitado, Resultado


def normalizar_linha(linha: LinhaLegado) -> Candidato | Rejeitado:
    motivos: list[str] = []
    avisos: list[str] = []

    def campo(funcao, *args):
        try:
            return funcao(*args)
        except n.CampoInvalido as erro:
            motivos.append(str(erro))
            return None

    legado_id = campo(_id, linha.id)
    numero = campo(n.numero_cnj, linha.processo)
    tribunal = campo(n.tribunal, linha.tribunal, numero) if numero else None
    cpf = campo(n.cpf, linha.cliente_cpf)
    nome = n.texto(linha.cliente_nome)
    if not nome:
        motivos.append("nome do cliente vazio")
    valor = campo(n.valor_centavos, linha.valor_bruto)
    desagio = campo(n.desagio, linha.desagio)
    status = campo(n.status, linha.status)
    data_compra, aviso_data = n.data(linha.data_compra)

    if motivos:
        return Rejeitado(legado_id=linha.id.strip() or "?", motivos=tuple(motivos))

    sigla, aviso_tribunal = tribunal
    percentual, aviso_desagio = desagio
    avisos += [a for a in (aviso_tribunal, aviso_desagio, aviso_data) if a]
    if valor is None:
        avisos.append("valor bruto vazio; gravado como NULL")

    return Candidato(
        negocio=Negocio(
            legado_id=legado_id,
            processo_numero_cnj=numero,
            cliente_cpf=cpf,
            valor_bruto_centavos=valor,
            desagio_percentual=percentual,
            status=status,
            data_compra=data_compra,
        ),
        cliente_nome=nome,
        processo_tribunal=sigla,
        processo_classe=n.classe(linha.classe),
        atualizado_em=n.data_hora(linha.atualizado_em),
        avisos=avisos,
    )


def _id(valor: str) -> int:
    if not valor.strip().isdigit():
        raise n.CampoInvalido(f"id do legado inválido: {valor!r}")
    return int(valor)


def _mais_recente_primeiro(candidatos: list[Candidato]) -> list[Candidato]:
    return sorted(candidatos, key=lambda c: c.atualizado_em or datetime.min, reverse=True)


def remover_duplicatas(candidatos: list[Candidato]) -> tuple[list[Candidato], list[Rejeitado]]:
    """Duplicata = mesmo negócio lançado duas vezes (ex.: reenvio de integração).
    Importar as duas dobraria o valor comprado; fica a versão mais recente."""
    vistos: dict[tuple, Candidato] = {}
    rejeitados: list[Rejeitado] = []
    for c in _mais_recente_primeiro(candidatos):
        g = c.negocio
        assinatura = (g.processo_numero_cnj, g.cliente_cpf, g.valor_bruto_centavos,
                      g.desagio_percentual, g.status, g.data_compra)
        if assinatura in vistos:
            original = vistos[assinatura].negocio.legado_id
            rejeitados.append(Rejeitado(str(g.legado_id), (f"duplicata do legado {original}",)))
        else:
            vistos[assinatura] = c
    return list(vistos.values()), rejeitados


def consolidar_clientes(candidatos: list[Candidato]) -> list[Cliente]:
    """Um nome por CPF: prefere o bem formatado (nem tudo maiúsculo nem tudo minúsculo) e,
    entre esses, o da linha atualizada mais recentemente; senão, capitaliza."""
    por_cpf: dict[str, list[Candidato]] = {}
    for c in _mais_recente_primeiro(candidatos):
        por_cpf.setdefault(c.negocio.cliente_cpf, []).append(c)
    clientes = []
    for cpf, linhas in por_cpf.items():
        bom = next((c.cliente_nome for c in linhas if n.nome_bem_formatado(c.cliente_nome)), None)
        clientes.append(Cliente(cpf=cpf, nome=bom or n.capitalizar_nome(linhas[0].cliente_nome)))
    return sorted(clientes, key=lambda c: c.cpf)


def consolidar_processos(candidatos: list[Candidato]) -> list[Processo]:
    """Classe = a da linha mais recente que tem classe preenchida."""
    por_numero: dict[str, list[Candidato]] = {}
    for c in _mais_recente_primeiro(candidatos):
        por_numero.setdefault(c.negocio.processo_numero_cnj, []).append(c)
    return sorted(
        (
            Processo(
                numero_cnj=numero,
                tribunal_sigla=linhas[0].processo_tribunal,  # o CNJ já garante o mesmo tribunal
                classe=next((c.processo_classe for c in linhas if c.processo_classe), None),
            )
            for numero, linhas in por_numero.items()
        ),
        key=lambda p: p.numero_cnj,
    )


def transformar(linhas: list[LinhaLegado]) -> Resultado:
    candidatos: list[Candidato] = []
    rejeitados: list[Rejeitado] = []
    for linha in linhas:
        resultado = normalizar_linha(linha)
        (rejeitados if isinstance(resultado, Rejeitado) else candidatos).append(resultado)

    aceitos, duplicatas = remover_duplicatas(candidatos)
    rejeitados += duplicatas
    aceitos.sort(key=lambda c: c.negocio.legado_id)

    return Resultado(
        clientes=consolidar_clientes(aceitos),
        processos=consolidar_processos(aceitos),
        negocios=[c.negocio for c in aceitos],
        rejeitados=sorted(rejeitados, key=lambda r: r.legado_id),
        avisos=[Aviso(c.negocio.legado_id, a) for c in aceitos for a in c.avisos],
    )
