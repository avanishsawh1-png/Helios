FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN mkdir -p workers/pipeline/dist && cp workers/pipeline/src/worker.mjs workers/pipeline/dist/index.js

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV TRADING_MODE=PAPER
COPY --from=build /app /app
CMD ["node", "workers/pipeline/dist/index.js"]
