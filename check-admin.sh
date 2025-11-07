#!/bin/bash

# Check if admin user exists in database
# Usage: ./check-admin.sh

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgress}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-gelagle-stock-ims}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"

echo "Checking for admin user in database..."
echo "Database: $DB_NAME"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

export PGPASSWORD="$DB_PASSWORD"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" <<EOF
SELECT 
    id,
    email,
    "firstName",
    "lastName",
    role,
    status,
    "isEmailVerified",
    "createdAt"
FROM users 
WHERE email = '$ADMIN_EMAIL';
EOF

unset PGPASSWORD

echo ""
echo "Done!"









