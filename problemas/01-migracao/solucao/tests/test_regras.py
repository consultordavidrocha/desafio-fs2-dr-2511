"""Testes das regras mais arriscadas da migração: as que, se erradas, corrompem
dinheiro, duplicam registros ou ligam o negócio ao processo/cliente errado."""

from decimal import Decimal
from pathlib import Path

import pytest

import normalizacao as n
from dtos import LinhaLegado, StatusNegocio
from migrar import ler_csv
from transformacao import transformar

LEGADO = Path(__file__).resolve().parents[2] / "legado.csv"


# 1. Dinheiro: ponto e vírgula mudam o valor em 1000x ------------------------------
@pytest.mark.parametrize(
    "entrada, centavos",
    [
        ("R$ 15.000,00", 1_500_000),
        ("4.750,00", 475_000),
        ("15.000", 1_500_000),  # ponto como milhar, não R$ 15,00
        ("1234.5", 123_450),  # ponto como decimal
        ("R$ 42.300,10", 4_230_010),
        ("", None),
    ],
)
def test_valor_bruto_em_centavos(entrada, centavos):
    assert n.valor_centavos(entrada) == centavos


@pytest.mark.parametrize("entrada", ["abc", "R$ 0,00", "-10", "1,234"])
def test_valor_bruto_invalido_e_rejeitado(entrada):
    with pytest.raises(n.CampoInvalido):
        n.valor_centavos(entrada)


@pytest.mark.parametrize(
    "entrada, percentual, tem_aviso",
    [
        ("30%", Decimal("30.00"), False),
        ("25", Decimal("25.00"), False),
        ("30,5%", Decimal("30.50"), False),
        ("0,3", Decimal("30.00"), True),  # fração → 30%, sinalizado para revisão
    ],
)
def test_desagio(entrada, percentual, tem_aviso):
    valor, aviso = n.desagio(entrada)
    assert valor == percentual
    assert bool(aviso) is tem_aviso


def test_desagio_fora_da_faixa_e_rejeitado():
    with pytest.raises(n.CampoInvalido):
        n.desagio("150%")


# 2. Status: mapear errado muda o estado jurídico/financeiro do negócio ---------------
@pytest.mark.parametrize(
    "entrada, esperado",
    [
        ("Concluída", StatusNegocio.CONCLUIDO),
        ("concluido", StatusNegocio.CONCLUIDO),  # nome do próprio enum
        ("CANCELADA após assinatura", StatusNegocio.CANCELADO),
        ("perdida", StatusNegocio.PERDIDO),
    ],
)
def test_status_sem_diferenciar_maiusculas_e_acentos(entrada, esperado):
    assert n.status(entrada) is esperado


def test_status_sem_de_para_e_rejeitado_em_vez_de_inventado():
    with pytest.raises(n.CampoInvalido, match="sem de-para"):
        n.status("Aguardando assistente")


# 3. Identidade: CPF, CNJ e tribunal decidem com quem/onde o negócio fica --------------
def test_cpf_com_e_sem_mascara_e_o_mesmo_cliente():
    assert n.cpf("447.712.782-02") == n.cpf("44771278202") == "44771278202"


@pytest.mark.parametrize("entrada", ["111.111.111-11", "447.712.782-03", "123"])
def test_cpf_invalido_e_rejeitado(entrada):
    with pytest.raises(n.CampoInvalido):
        n.cpf(entrada)


@pytest.mark.parametrize("entrada", ["ver anexo", "0001234-56.2021.8.26", "8990609-73.2021.8.26.0375"])
def test_numero_cnj_invalido_e_rejeitado(entrada):
    with pytest.raises(n.CampoInvalido):
        n.numero_cnj(entrada)


@pytest.mark.parametrize(
    "entrada, sigla",
    [("TJ-SP", "TJSP"), ("tjsp", "TJSP"), ("Tribunal de Justiça do Rio de Janeiro", "TJRJ")],
)
def test_tribunal_normalizado(entrada, sigla):
    numero = {"TJSP": "89906097220218260375", "TJRJ": "97775615820218190520"}[sigla]
    assert n.tribunal(entrada, numero) == (sigla, None)


def test_tribunal_inexistente_usa_o_do_numero_cnj_com_aviso():
    sigla, aviso = n.tribunal("TJXX", "36020383720218130089")  # segmento 8.13 = TJMG
    assert sigla == "TJMG"
    assert "TJXX" in aviso


def test_tribunal_que_contradiz_o_cnj_e_rejeitado():
    with pytest.raises(n.CampoInvalido, match="diverge"):
        n.tribunal("TJRJ", "89906097220218260375")  # o número é do TJSP


# 4. Fim a fim no legado.csv -----------------------------------------------------------
@pytest.fixture(scope="module")
def resultado():
    return transformar(ler_csv(LEGADO))


def test_duplicata_exata_nao_vira_dois_negocios(resultado):
    legados = {g.legado_id for g in resultado.negocios}
    assert 1001 in legados and 1010 not in legados  # fica a versão atualizada por último
    assert any(r.legado_id == "1010" and "duplicata do legado 1001" in r.motivos for r in resultado.rejeitados)


def test_rejeitados_trazem_o_motivo(resultado):
    assert {r.legado_id for r in resultado.rejeitados} == {"1004", "1006", "1009", "1010", "1013"}
    assert all(r.motivos for r in resultado.rejeitados)


def test_cliente_e_processo_sao_unicos_e_bem_nomeados(resultado):
    clientes = {c.cpf: c.nome for c in resultado.clientes}
    assert len(clientes) == len(resultado.clientes) == 5
    assert clientes["44771278202"] == "Amélia Mascarenhas Macedo"  # não "amélia ..." (1003)
    assert clientes["26197306948"] == "Paula Silva Santos"  # não "  PAULA SILVA SANTOS " (1007)
    assert "52393849912" not in clientes  # João só aparece em linhas rejeitadas
    assert len({p.numero_cnj for p in resultado.processos}) == 5


def test_data_impossivel_vira_null_com_aviso_sem_perder_o_negocio(resultado):
    negocio = next(g for g in resultado.negocios if g.legado_id == 1008)  # 31/02/2025
    assert negocio.data_compra is None
    assert any(a.legado_id == 1008 and "31/02/2025" in a.mensagem for a in resultado.avisos)


def test_linha_bruta_sem_colunas_vira_rejeicao_e_nao_excecao():
    resultado = transformar([LinhaLegado.from_csv({"id": "9999"})])
    assert resultado.negocios == []
    assert resultado.rejeitados[0].legado_id == "9999"
