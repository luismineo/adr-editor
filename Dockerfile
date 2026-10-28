# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

# adapter-node leaves `dependencies` external to the bundle, so the runtime needs them
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=3000 \
	ADR_DB_PATH=/app/data/adr.db

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json server.js ./

# Owned by `node` so a fresh named volume mounted here inherits writable permissions
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME /app/data

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
