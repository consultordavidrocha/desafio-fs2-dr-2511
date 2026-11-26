# syntax=docker/dockerfile:1
# Imagem de produção da API (multi-stage: só o necessário vai para a imagem final).
# Contexto de build = raiz do repositório, para incluir dados/ (lido pelo seed):
#   docker build -f api/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /app
# O Prisma precisa do OpenSSL no Alpine.
RUN apk add --no-cache openssl
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/ ./
RUN npx prisma generate && npm run build && npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production \
    SEED_DATA_DIR=/app/dados
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/docker/entrypoint.sh ./docker/entrypoint.sh
# Dados do case: a imagem fica autossuficiente (o deploy não depende de volume).
COPY --chown=node:node dados/ ./dados/
USER node
EXPOSE 8888
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:${PORT:-8888}/health || exit 1
ENTRYPOINT ["sh", "docker/entrypoint.sh"]
