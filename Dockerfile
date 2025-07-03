FROM node:20-alpine AS builder

# Install Yarn (pick any stable version you want, eg: 1.22.19)
RUN npm install -g yarn@1.22.19

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN yarn build

# ------------------ Production Stage ------------------
FROM node:20-alpine AS production

# Install Yarn again for production stage
RUN npm install -g yarn@1.22.19

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production deps
RUN yarn install --production --frozen-lockfile

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Optional health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/scripts/health-check.js

# Start the app
CMD ["yarn", "start:prod"]
