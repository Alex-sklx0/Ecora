FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 5173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
