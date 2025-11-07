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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed!${NC}"
    echo "Please install Node.js first:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt install -y nodejs"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed!${NC}"
    exit 1
fi

# Check if Yarn is installed, install if not
if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}⚠️  Yarn not found. Installing Yarn globally...${NC}"
    npm install -g yarn
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install Yarn!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Yarn installed successfully${NC}"
fi

# Check if PM2 is installed, install if not
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing PM2 globally...${NC}"
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install PM2!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ PM2 installed successfully${NC}"
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

