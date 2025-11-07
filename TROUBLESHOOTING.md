# Troubleshooting Deployment Issues

## Database Connection Issues

### Error: "password authentication failed for user postgres"

This means your `.env` file has incorrect database credentials.

**Solution:**

1. **Check your `.env` file:**
   ```bash
   cat .env | grep DB_
   ```

2. **Verify PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   ```

3. **Test database connection:**
   ```bash
   psql -h localhost -U postgres -d gelagle-stock-ims
   ```

4. **If you need to reset PostgreSQL password:**
   ```bash
   # Switch to postgres user
   sudo -u postgres psql
   
   # In PostgreSQL prompt:
   ALTER USER postgres PASSWORD 'your_new_password';
   \q
   ```

5. **If database doesn't exist:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE "gelagle-stock-ims";
   \q
   ```

6. **Update your `.env` file with correct credentials:**
   ```bash
   nano .env
   ```

7. **Re-run migrations:**
   ```bash
   yarn migration:run
   ```

## Application Keeps Restarting

If PM2 shows the app keeps restarting (restart count increasing):

**Check the logs:**
```bash
pm2 logs gelagle-stock-backend --lines 100
```

**Common causes:**
- Database connection failure (most common)
- Redis connection failure
- Port already in use
- Missing environment variables
- Syntax errors in code

**Check what port is in use:**
```bash
# Check if port 3000 is available
sudo lsof -i :3000

# Or check what port your app is trying to use
pm2 show gelagle-stock-backend
```

## Check Application Status

```bash
# Detailed info about your app
pm2 show gelagle-stock-backend

# Check which port it's using
pm2 pid gelagle-stock-backend | xargs -I {} lsof -Pan -p {} -i

# View real-time logs
pm2 logs gelagle-stock-backend

# View error logs only
pm2 logs gelagle-stock-backend --err
```

## Fix Migration Script Error

If you see: `./scripts/migration.sh: 45: [[: not found`

This is already fixed in the updated script, but you can verify:
```bash
head -1 scripts/migration.sh
# Should show: #!/bin/bash
```

## Verify Environment Variables

```bash
# Check if .env is being loaded
pm2 show gelagle-stock-backend | grep env

# Or check the process environment
pm2 pid gelagle-stock-backend | xargs -I {} cat /proc/{}/environ | tr '\0' '\n' | grep -E "DB_|REDIS_|JWT_"
```

## Quick Health Check

```bash
# 1. Check PM2 status
pm2 status

# 2. Check application logs
pm2 logs gelagle-stock-backend --lines 20

# 3. Test API endpoint (if app is running)
curl http://localhost:3000/api/v1/health || echo "App not responding"

# 4. Check database connection
psql -h localhost -U postgres -d gelagle-stock-ims -c "SELECT 1;" || echo "DB connection failed"

# 5. Check Redis connection
redis-cli ping || echo "Redis connection failed"
```

## Common Environment Variable Issues

Make sure your `.env` file has all required variables:

```env
# Application
NODE_ENV=production
PORT=3000

# Database (check these match your PostgreSQL setup)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_actual_password
DB_NAME=gelagle-stock-ims

# JWT (use strong random strings in production)
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Restart Cleanly

If you need to restart everything:

```bash
# Stop the app
pm2 stop gelagle-stock-backend

# Delete from PM2
pm2 delete gelagle-stock-backend

# Rebuild if needed
yarn build

# Start again
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save
```









