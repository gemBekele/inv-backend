# --- Builder Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

#RUN apk add bash 

# Install dependencies using yarn (which is expected to be available)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN yarn build

# --- Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files (only package.json and yarn.lock are strictly needed for --production install)
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Copy source files needed for migrations (TypeORM needs the source files)
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/scripts ./scripts

RUN chmod +x ./scripts/migration.sh

# Expose the application port
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/scripts/health-check.js || exit 1

# Start the application in production mode
CMD ["npm", "run", "start:prod"]
