-- Create uuid-ossp extension as postgres superuser
-- Run this as: sudo -u postgres psql -d gelagle-stock-ims -f create-uuid-extension.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify it was created
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'uuid-ossp';









