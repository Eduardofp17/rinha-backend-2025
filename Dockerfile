FROM node:18-slim AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm \
  && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:18-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

RUN npm install -g pnpm \
  && pnpm install --frozen-lockfile --prod

EXPOSE 8080

CMD ["node", "dist/infra/server.js"]
