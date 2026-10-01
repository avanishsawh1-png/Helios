# Wave 9 — services/execution
# CRITICAL: this image must never receive WALLET_PRIVATE_KEY or signing material
# at build time. Keys are injected only at runtime on the isolated VPS signing
# path after Section 70, never via docker build --build-arg.
LABEL helios.package="services/execution"
LABEL helios.section70="inert-until-gate"
LABEL helios.no_wallet_keys_at_build="true"
FROM node:22-alpine
RUN addgroup -S helios && adduser -S helios -G helios
USER helios
WORKDIR /app
ENV TRADING_MODE=PAPER
CMD ["node", "--version"]
