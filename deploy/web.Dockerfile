# Web image: builds the game + admin page in API mode and serves them with
# Caddy, which also proxies /api to the server and serves uploaded images.
# Build context = repository root.
FROM node:22-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json client/
RUN cd client && npm ci
COPY shared shared
COPY client client
RUN cd client && npm run build:api

FROM caddy:2.8-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/client/dist /srv
