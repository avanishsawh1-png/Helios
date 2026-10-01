FROM node:22-alpine AS build
WORKDIR /app
COPY apps/web ./apps/web
RUN mkdir -p apps/web/dist && cp apps/web/dist/index.html /tmp/dash.html 2>/dev/null || true
# Serve the checked-in dashboard artifact (balances fetch). Vite compile is still optional.
RUN mkdir -p /out && cp apps/web/dist/index.html /out/index.html || cp apps/web/src/index.html /out/index.html

FROM nginx:alpine
COPY --from=build /out /usr/share/nginx/html
