#!/bin/sh
# Sobe a API pronta para uso: aplica migrations, carrega os dados e inicia.
set -e

echo "[entrypoint] Aplicando migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] Carregando dados (seed idempotente)..."
  node dist/database/seed/seed.js
fi

echo "[entrypoint] Iniciando a API na porta ${PORT:-8888}..."
exec node dist/main.js
