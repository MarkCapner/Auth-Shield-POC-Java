FROM node:20-alpine

# Where the app lives inside the container
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend
COPY . .

# Vite dev server
EXPOSE 5173

CMD ["npm", "run", "dev"]
