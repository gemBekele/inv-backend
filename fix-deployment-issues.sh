#!/bin/bash

# Fix deployment issues
# This script fixes common deployment problems

echo "🔧 Fixing deployment issues..."
echo ""

# Check current PM2 status
echo "1. Checking PM2 processes on port 3000..."
pm2 list | grep -E "gelagle|shega|pt-admin" || echo "No relevant processes found"
echo ""

# Check what's using port 3000
echo "2. Checking what's using port 3000..."
lsof -i :3000 2>/dev/null || echo "Port 3000 is free"
echo ""

# Check .env file
echo "3. Checking .env configuration..."
if [ -f .env ]; then
    echo "Current PORT setting:"
    grep "^PORT=" .env || echo "PORT not set in .env"
    echo ""
    echo "Current DB_USERNAME setting:"
    grep "^DB_USERNAME=" .env || echo "DB_USERNAME not set in .env"
    echo ""
    
    # Check for typos
    if grep -q "DB_USERNAME=postgress" .env; then
        echo "⚠️  Found typo: DB_USERNAME=postgress (should be postgres)"
        echo "Fixing..."
        sed -i 's/DB_USERNAME=postgress/DB_USERNAME=postgres/' .env
        echo "✅ Fixed!"
    fi
    
    # Check if PORT is 5000 but should be 3000 (or vice versa)
    PORT_VAL=$(grep "^PORT=" .env | cut -d= -f2)
    if [ "$PORT_VAL" = "5000" ]; then
        echo "⚠️  PORT is set to 5000, but other apps might be on 3000"
        echo "Options:"
        echo "  a) Change to 3000 (and stop other app on 3000)"
        echo "  b) Keep 5000 (and update PM2 ecosystem config)"
        echo ""
        read -p "Change PORT to 3000? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sed -i 's/^PORT=5000/PORT=3000/' .env
            echo "✅ Changed PORT to 3000"
        fi
    fi
else
    echo "❌ .env file not found!"
    exit 1
fi

echo ""
echo "4. Checking for port conflicts..."
# Find what PM2 apps are running on which ports
for pid in $(pm2 jlist | jq -r '.[] | select(.pid != 0) | .pid'); do
    PORT=$(lsof -Pan -p $pid -i 2>/dev/null | grep LISTEN | grep -oP ':\K[0-9]+' | head -1)
    if [ -n "$PORT" ]; then
        APP_NAME=$(pm2 jlist | jq -r ".[] | select(.pid == $pid) | .name")
        echo "  App: $APP_NAME (PID: $pid) is using port: $PORT"
    fi
done
echo ""

echo "5. Recommendations:"
echo "==================="
PORT_VAL=$(grep "^PORT=" .env | cut -d= -f2)
if [ "$PORT_VAL" = "3000" ]; then
    echo "✅ PORT is 3000, but you need to stop other apps using port 3000"
    echo ""
    echo "To stop conflicting apps:"
    echo "  pm2 stop shega-backend  # if it exists"
    echo "  pm2 stop pt-admin       # if it exists"
    echo "  pm2 delete <app-name>   # to remove completely"
fi

echo ""
echo "6. Next steps:"
echo "============="
echo "After fixing .env:"
echo "  1. Restart PM2 app: pm2 restart gelagle-stock-backend"
echo "  2. Check logs: pm2 logs gelagle-stock-backend --lines 30"
echo "  3. Verify it's listening: pm2 pid gelagle-stock-backend | xargs -I {} lsof -Pan -p {} -i"
echo ""









