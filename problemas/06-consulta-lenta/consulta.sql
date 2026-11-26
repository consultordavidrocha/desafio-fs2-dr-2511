-- Tabela comunicacao: 2,1 milhões de linhas. Endpoint GET /comunicacoes com p95 de 6,2 s.
-- O número do processo foi gravado ao longo dos anos ora com máscara, ora só com dígitos;
-- por isso a busca remove a máscara na consulta.

-- Índices existentes
CREATE INDEX comunicacao_numero_processo_idx ON comunicacao (numero_processo);
-- (além da PK em id)

-- Consulta A — busca por número do processo ($1 = só dígitos)
SELECT c.id, c.numero_processo, c.data_disponibilizacao, c.tipo, c.conteudo
FROM comunicacao c
WHERE regexp_replace(c.numero_processo, '\D', '', 'g') = $1
ORDER BY c.data_disponibilizacao DESC
LIMIT 20 OFFSET 0;

-- Consulta B — listagem sem filtro, página 2.001 (20 por página)
SELECT c.id, c.numero_processo, c.data_disponibilizacao, c.tipo, c.conteudo
FROM comunicacao c
ORDER BY c.data_disponibilizacao DESC
LIMIT 20 OFFSET 40000;

-- Consulta C — total para a paginação (roda a cada página, junto com A ou B)
SELECT count(*) FROM comunicacao c
WHERE ($1::text IS NULL OR regexp_replace(c.numero_processo, '\D', '', 'g') = $1);
