FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN mkdir -p apps/api/dist && cp apps/api/src/server.mjs apps/api/dist/index.js

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV TRADING_MODE=PAPER
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
