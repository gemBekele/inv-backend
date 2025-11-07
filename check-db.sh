#!/bin/bash

# Quick database connection test script
# Usage: ./check-db.sh

echo "🔍 Checking database connection..."
echo ""

# Load .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded .env file"
else
    echo "❌ .env file not found!"
    exit 1
fi

echo ""
echo "Database Configuration:"
echo "  Host: ${DB_HOST:-not set}"
echo "  Port: ${DB_PORT:-not set}"
echo "  User: ${DB_USERNAME:-not set}"
echo "  Database: ${DB_NAME:-not set}"
echo ""

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
if command -v psql &> /dev/null; then
    export PGPASSWORD="${DB_PASSWORD}"
    
    if psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" -d "${DB_NAME:-gelagle-stock-ims}" -c "SELECT 1;" 2>&1; then
        echo "✅ PostgreSQL connection successful!"
    else
        echo "❌ PostgreSQL connection failed!"
        echo ""
        echo "Troubleshooting steps:"
        echo "1. Verify PostgreSQL is running: sudo systemctl status postgresql"
        echo "2. Check if database exists: sudo -u postgres psql -l"
        echo "3. Test connection manually: psql -h ${DB_HOST} -U ${DB_USERNAME} -d ${DB_NAME}"
        echo "4. Verify password in .env file matches PostgreSQL user password"
    fi
    unset PGPASSWORD
else
    echo "⚠️  psql command not found. Install PostgreSQL client:"
    echo "   sudo apt install postgresql-client"
fi

echo ""
echo "Testing Redis connection..."
if command -v redis-cli &> /dev/null; then
    REDIS_HOST="${REDIS_HOST:-localhost}"
    REDIS_PORT="${REDIS_PORT:-6379}"
    REDIS_PASSWORD="${REDIS_PASSWORD:-}"
    
    if [ -n "$REDIS_PASSWORD" ]; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping 2>&1 | grep -q PONG; then
            echo "✅ Redis connection successful!"
        else
            echo "❌ Redis connection failed!"
        fi
    else
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>&1 | grep -q PONG; then
            echo "✅ Redis connection successful!"
        else
            echo "❌ Redis connection failed!"
            echo "   Check if Redis is running: sudo systemctl status redis-server"
        fi
    fi
else
    echo "⚠️  redis-cli not found. Install Redis client:"
    echo "   sudo apt install redis-tools"
fi

echo ""
echo "Done!"









