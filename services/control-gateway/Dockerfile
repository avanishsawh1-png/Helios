FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN mkdir -p services/control-gateway/dist && cp services/control-gateway/src/server.mjs services/control-gateway/dist/index.js

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV TRADING_MODE=PAPER
COPY --from=build /app /app
EXPOSE 3100
CMD ["node", "services/control-gateway/dist/index.js"]
