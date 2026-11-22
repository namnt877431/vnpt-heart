# API server image. Build context = repository root (needs shared/ and the
# sample content in client/src/data for the seed):
#   docker build -f server/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci
COPY shared shared
COPY client/src/data client/src/data
COPY server server
RUN cd server && npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app/server
COPY --from=build /app/server/node_modules node_modules
COPY --from=build /app/server/dist dist
COPY --from=build /app/server/drizzle drizzle
COPY server/package.json .
RUN mkdir -p /data/uploads && chown node:node /data/uploads
USER node
EXPOSE 3000
# pending DB migrations are applied on start
CMD ["node", "dist/index.js"]
