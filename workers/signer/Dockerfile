FROM node:20-alpine
WORKDIR /app
COPY workers/signer ./workers/signer
ENV TRADING_MODE=PAPER
ENV HELIOS_SIGNER_ENABLE=0
CMD ["node", "workers/signer/src/main.mjs"]
