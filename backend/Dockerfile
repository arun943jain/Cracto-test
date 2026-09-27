FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate || true
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push; node src/index.js"]
