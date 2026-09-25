FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN mkdir -p apps/web/dist && cp apps/web/src/index.html apps/web/dist/index.html

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
