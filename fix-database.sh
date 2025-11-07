#!/bin/bash

# Fix database setup for migrations
# This creates the uuid-ossp extension needed for UUID generation

echo "🔧 Fixing database setup..."
echo ""

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded .env file"
else
    echo "❌ .env file not found!"
    exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_NAME="${DB_NAME:-gelagle-stock-ims}"

echo ""
echo "Connecting to database: $DB_NAME"
echo "Host: $DB_HOST"
echo "User: $DB_USERNAME"
echo ""

# Create the uuid-ossp extension (must be done as postgres superuser)
echo "Creating uuid-ossp extension as postgres superuser..."
sudo -u postgres psql -d "$DB_NAME" <<EOF
-- Create the uuid-ossp extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify it was created
SELECT extname, extversion FROM pg_extension WHERE extname = 'uuid-ossp';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ UUID extension created successfully!"
    echo ""
    echo "You can now run migrations:"
    echo "  yarn migration:run"
else
    echo ""
    echo "❌ Failed to create UUID extension"
    echo ""
    echo "Try running manually:"
    echo "  sudo -u postgres psql -d gelagle-stock-ims"
    echo "  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    exit 1
fi

unset PGPASSWORD

