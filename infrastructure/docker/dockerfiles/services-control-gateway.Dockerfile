# Wave 9 — services/control-gateway
ARG PACKAGE
FROM node:22-alpine AS base
# See node-service.Dockerfile for full multi-stage pattern.
# This file documents the package path; prefer the generic template in CI.
LABEL helios.package="services/control-gateway"
LABEL helios.trading_mode="PAPER"
# services/execution is intentionally omitted from default image builds that
# receive .env.vps wallet material.
