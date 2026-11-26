-- Banco NOVO (PostgreSQL). Já existe em produção — não é para alterar.

CREATE TYPE status_negocio AS ENUM ('EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO', 'PERDIDO');

CREATE TABLE cliente (
  id    SERIAL PRIMARY KEY,
  nome  TEXT     NOT NULL,
  cpf   CHAR(11) NOT NULL UNIQUE           -- só dígitos
);

CREATE TABLE processo (
  id              SERIAL PRIMARY KEY,
  numero_cnj      CHAR(20)    NOT NULL UNIQUE,  -- só dígitos
  tribunal_sigla  VARCHAR(10) NOT NULL,
  classe          TEXT
);

CREATE TABLE negocio (
  id                    SERIAL PRIMARY KEY,
  legado_id             INTEGER        NOT NULL UNIQUE,  -- transacao.id do legado
  processo_id           INTEGER        NOT NULL REFERENCES processo (id),
  cliente_id            INTEGER        NOT NULL REFERENCES cliente (id),
  valor_bruto_centavos  BIGINT,                          -- R$ 15.000,00 = 1500000
  desagio_percentual    NUMERIC(5, 2),                   -- 30% = 30.00
  status                status_negocio NOT NULL,
  data_compra           DATE
);
