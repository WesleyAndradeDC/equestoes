FROM node:20-alpine

WORKDIR /app

# Install deps (prisma CLI is devDep — needed for generate)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Generate Prisma client for current platform
RUN npx prisma generate

# Copy application source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "src/index.js"]
