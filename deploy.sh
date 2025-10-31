#!/bin/bash

# Deployment script for VPS with PM2
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file from .env-example"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing PM2 globally...${NC}"
    npm install -g pm2
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
yarn install --production=false

# Build the application
echo -e "${GREEN}🔨 Building application...${NC}"
yarn build

# Create logs directory if it doesn't exist
mkdir -p logs

# Run database migrations
echo -e "${GREEN}🗄️  Running database migrations...${NC}"
yarn migration:run || {
    echo -e "${YELLOW}⚠️  Migration failed or already up to date${NC}"
}

# Stop existing PM2 process if running
echo -e "${GREEN}🛑 Stopping existing PM2 process...${NC}"
pm2 delete gelagle-stock-backend 2>/dev/null || true

# Start application with PM2
echo -e "${GREEN}▶️  Starting application with PM2...${NC}"
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 startup script
echo -e "${GREEN}⚙️  Setting up PM2 startup script...${NC}"
pm2 startup || {
    echo -e "${YELLOW}⚠️  Startup script generation failed. Run 'pm2 startup' manually as root${NC}"
}

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs                - View application logs"
echo "  pm2 restart gelagle-stock-backend - Restart application"
echo "  pm2 stop gelagle-stock-backend    - Stop application"
echo "  pm2 monit               - Monitor application"

