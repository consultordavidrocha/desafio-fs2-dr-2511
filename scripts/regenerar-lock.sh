#!/usr/bin/env bash
# Regenera o package-lock.json de um pacote (web ou api) dentro de um container Linux.
#
# Por quê: o npm resolve dependências opcionais/peer de forma diferente por plataforma
# (ex.: @napi-rs/wasm-runtime → @emnapi/*). Um lock gerado no Windows pode não ter o que o
# Linux do CI, do Render e da Vercel espera, e o `npm ci` falha ("Missing: ... from lock file").
# Gerar no Linux deixa o lock válido no CI e continua funcionando no Windows/macOS.
#
# Uso: bash scripts/regenerar-lock.sh web     (depois de adicionar/atualizar dependências)
set -euo pipefail
cd "$(dirname "$0")/../${1:?informe o pacote: web ou api}"

dir="$(pwd -W 2>/dev/null || pwd)"   # Git Bash no Windows precisa do caminho C:/...
MSYS_NO_PATHCONV=1 docker run --rm -v "$dir:/app" -w /app node:24-alpine \
  sh -c "npm install --package-lock-only --no-audit --no-fund --loglevel=error && \
         npm ci --ignore-scripts --no-audit --no-fund --loglevel=error --dry-run >/dev/null && \
         echo 'package-lock.json regenerado e validado com npm ci no Linux'"
