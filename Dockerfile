FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install 
COPY . .
RUN pnpm build
EXPOSE 8080
CMD ["node", "dist/infra/server.js"]