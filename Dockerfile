FROM node:18-slim AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm \
  && pnpm install --frozen-lockfile --prod

COPY . .

RUN pnpm build


EXPOSE 8080

CMD ["node", "dist/infra/server.js"]
