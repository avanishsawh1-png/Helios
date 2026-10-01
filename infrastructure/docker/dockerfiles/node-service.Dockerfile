# Wave 9 — multi-stage Node service image (PAPER-safe defaults)
# Build: docker build -f infrastructure/docker/dockerfiles/node-service.Dockerfile \
#   --build-arg PACKAGE=@helios/worker-pipeline -t helios-pipeline .
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps
COPY services ./services
COPY workers ./workers
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build
ARG PACKAGE
RUN pnpm --filter ${PACKAGE} build || true

FROM node:${NODE_VERSION}-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate \
 && addgroup -S helios && adduser -S helios -G helios
WORKDIR /app
ENV NODE_ENV=production
ENV TRADING_MODE=PAPER
# Wallet keys must NEVER be baked into images (especially services/execution).
COPY --from=deps /app /app
USER helios
# Override command per service in compose
CMD ["node", "--version"]
