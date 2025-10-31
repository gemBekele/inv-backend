# VPS Deployment Guide with PM2

Simple deployment guide for deploying the NestJS backend to a VPS using PM2.

## Prerequisites

- Ubuntu/Debian VPS (or similar Linux distribution)
- Node.js 20+ installed
- Yarn package manager installed
- PostgreSQL database (can be on same VPS or remote)
- Redis server (can be on same VPS or remote)

## Quick Setup

### 1. Install Dependencies on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
npm install -g yarn

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL (if not using remote DB)
sudo apt install -y postgresql postgresql-contrib

# Install Redis (if not using remote Redis)
sudo apt install -y redis-server
```

### 2. Clone and Setup Project

```bash
# Navigate to your projects directory
cd ~/projects  # or wherever you prefer

# Clone the repository
git clone git@github.com:gemBekele/inv-backend.git
cd inv-backend

# Copy environment file
cp .env-example .env

# Edit .env with your production settings
nano .env
```

### 3. Configure Environment Variables

Edit `.env` file with your production values:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database Configuration
DB_HOST=localhost          # or your DB host
DB_PORT=5432
DB_USERNAME=postgres       # your DB user
DB_PASSWORD=your_password # your DB password
DB_NAME=gelagle-stock-ims

# JWT Secrets (IMPORTANT: Use strong secrets in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-change-this

# Redis Configuration
REDIS_HOST=localhost       # or your Redis host
REDIS_PORT=6379
REDIS_PASSWORD=           # if Redis has password
REDIS_DB=0

# Admin User (for seeding)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_password_here

# Other settings...
```

### 4. Deploy Application

Simply run the deployment script:

```bash
./deploy.sh
```

The script will:
- Install dependencies
- Build the application
- Run database migrations
- Start the app with PM2
- Configure PM2 to start on system boot

### 5. Verify Deployment

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs gelagle-stock-backend

# Check if app is running
curl http://localhost:3000/api/v1/health
```

## Manual Deployment Steps

If you prefer to deploy manually:

```bash
# 1. Install dependencies
yarn install --production=false

# 2. Build the application
yarn build

# 3. Run migrations
yarn migration:run

# 4. Start with PM2
pm2 start ecosystem.config.js

# 5. Save PM2 configuration
pm2 save

# 6. Setup PM2 to start on boot
pm2 startup
# Follow the instructions displayed by the command above
```

## PM2 Management Commands

### Basic Commands

```bash
# View application status
pm2 status

# View logs (real-time)
pm2 logs gelagle-stock-backend

# View logs (last 100 lines)
pm2 logs gelagle-stock-backend --lines 100

# Restart application
pm2 restart gelagle-stock-backend

# Stop application
pm2 stop gelagle-stock-backend

# Delete application from PM2
pm2 delete gelagle-stock-backend

# Monitor application (CPU, memory, etc.)
pm2 monit

# Reload application (zero-downtime)
pm2 reload gelagle-stock-backend
```

### Logs Management

```bash
# View error logs
pm2 logs gelagle-stock-backend --err

# View output logs
pm2 logs gelagle-stock-backend --out

# Clear logs
pm2 flush
```

## Updating the Application

When you need to deploy updates:

```bash
# Pull latest changes
git pull origin dev  # or your branch name

# Run deployment script again
./deploy.sh

# Or manually:
yarn install --production=false
yarn build
yarn migration:run
pm2 restart gelagle-stock-backend
```

## Setting Up Nginx Reverse Proxy (Optional)

If you want to serve the app on port 80/443:

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/gelagle-backend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/gelagle-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Setting Up SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Database Setup

If running PostgreSQL on the same VPS:

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE "gelagle-stock-ims";

# Create user (optional)
CREATE USER your_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE "gelagle-stock-ims" TO your_user;

# Exit
\q
```

## Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs gelagle-stock-backend --err

# Check if port is already in use
sudo lsof -i :3000

# Check environment variables
pm2 show gelagle-stock-backend
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d gelagle-stock-ims

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Redis connection issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis status
sudo systemctl status redis-server
```

### View detailed application info

```bash
pm2 show gelagle-stock-backend
pm2 describe gelagle-stock-backend
```

## Security Best Practices

1. **Firewall Configuration**:
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

2. **Keep .env secure**: Never commit `.env` file to git (already in .gitignore)

3. **Use strong JWT secrets**: Generate random strings for production

4. **Regular updates**: Keep your system and dependencies updated

5. **Database security**: Use strong passwords and restrict access

## Monitoring

PM2 provides built-in monitoring. For more advanced monitoring:

```bash
# Install PM2 Plus (optional, requires account)
pm2 link

# Or use PM2 monitoring dashboard
pm2 web
```

## Backup

Regular backups are important:

```bash
# Backup database
pg_dump -h localhost -U postgres gelagle-stock-ims > backup_$(date +%Y%m%d).sql

# Backup application files (optional)
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/your/app
```

That's it! Your application should now be running on your VPS with PM2.

