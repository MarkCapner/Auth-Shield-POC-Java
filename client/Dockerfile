FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

COPY . .
EXPOSE 5173

# The repo's package.json "dev" script expects a non-existent "server/index.ts".
# For Docker we run Vite directly to serve the React UI and use vite.config.ts proxying.
CMD ["npx","vite","--host","0.0.0.0","--port","5173"]
