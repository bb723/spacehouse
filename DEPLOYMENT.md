# SpaceHouse - Production Deployment Guide

Complete guide for deploying SpaceHouse to production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deployment Options](#deployment-options)
   - [Option 1: Heroku (Easiest)](#option-1-heroku-easiest)
   - [Option 2: Docker (Recommended)](#option-2-docker-recommended)
   - [Option 3: VPS (DigitalOcean, AWS, etc.)](#option-3-vps-digitalocean-aws-etc)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup (Optional)](#database-setup-optional)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Monitoring & Logging](#monitoring--logging)

---

## Prerequisites

### Required
- ✅ Python 3.12+
- ✅ Node.js 18+ and npm
- ✅ Git for version control

### Optional (depends on deployment method)
- Docker & Docker Compose
- Heroku CLI
- AWS/GCP/Azure account
- Domain name + DNS access

---

## Environment Variables

Create a `.env` file for production configuration:

### Backend (.env)
```bash
# Environment
ENVIRONMENT=production

# CORS Settings (UPDATE THIS!)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server
PORT=8000
HOST=0.0.0.0

# Optional: Database
# DATABASE_URL=postgresql://user:password@localhost:5432/spacehouse

# Optional: Redis Cache
# REDIS_URL=redis://localhost:6379

# Optional: Authentication (if implemented)
# SECRET_KEY=your-secret-key-here
# JWT_ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env.production)
```bash
# API URL (UPDATE THIS!)
VITE_API_URL=https://api.yourdomain.com
```

---

## Deployment Options

---

## Option 1: Heroku (Easiest)

### Backend Deployment

```bash
# 1. Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create Heroku app
cd spacehouse
heroku create spacehouse-api

# 4. Set environment variables
heroku config:set ENVIRONMENT=production
heroku config:set CORS_ORIGINS=https://spacehouse-frontend.vercel.app

# 5. Deploy
git push heroku main

# 6. Check logs
heroku logs --tail
```

Your API will be live at: `https://spacehouse-api.herokuapp.com`

### Frontend Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy frontend
cd frontend
vercel --prod

# 3. Set environment variable
vercel env add VITE_API_URL
# Enter: https://spacehouse-api.herokuapp.com

# 4. Redeploy with new env
vercel --prod
```

---

## Option 2: Docker (Recommended)

### Full-Stack Deployment with Docker Compose

```bash
# 1. Update environment variables in docker-compose.yml
# Edit CORS_ORIGINS and VITE_API_URL

# 2. Build and run
docker-compose up -d

# 3. View logs
docker-compose logs -f

# 4. Stop
docker-compose down
```

### Backend Only (Docker)

```bash
# Build
docker build -t spacehouse-backend .

# Run
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e CORS_ORIGINS=https://yourdomain.com \
  --name spacehouse-api \
  spacehouse-backend

# Check logs
docker logs -f spacehouse-api
```

### Frontend Only (Docker)

```bash
cd frontend

# Build
docker build -f Dockerfile.frontend -t spacehouse-frontend .

# Run
docker run -d \
  -p 80:80 \
  --name spacehouse-web \
  spacehouse-frontend

# Access at http://localhost
```

---

## Option 3: VPS (DigitalOcean, AWS, etc.)

### Server Setup

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install dependencies
apt update
apt install -y python3.12 python3-pip nginx certbot python3-certbot-nginx

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Clone repository
git clone https://github.com/yourusername/spacehouse.git
cd spacehouse
```

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create systemd service
cat > /etc/systemd/system/spacehouse-api.service << EOF
[Unit]
Description=SpaceHouse API
After=network.target

[Service]
User=www-data
WorkingDirectory=/root/spacehouse
Environment="PATH=/usr/local/bin"
ExecStart=/usr/local/bin/uvicorn api:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl daemon-reload
systemctl enable spacehouse-api
systemctl start spacehouse-api
systemctl status spacehouse-api
```

### Frontend Build

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Copy to nginx directory
cp -r dist/* /var/www/html/
```

### Nginx Configuration

```bash
# Create nginx config
cat > /etc/nginx/sites-available/spacehouse << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/spacehouse /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Frontend Deployment

### Option A: Vercel (Recommended for React)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel --prod

# Configure environment
vercel env add VITE_API_URL production
# Enter your API URL: https://api.yourdomain.com

# Redeploy
vercel --prod
```

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to frontend
cd frontend

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Set environment variable in Netlify dashboard:
# VITE_API_URL=https://api.yourdomain.com
```

### Option C: AWS S3 + CloudFront

```bash
# Build frontend
cd frontend
npm run build

# Install AWS CLI
# Follow: https://aws.amazon.com/cli/

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Create CloudFront distribution (in AWS Console)
# Point to S3 bucket
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# For nginx on VPS
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is enabled by default
# Test renewal
certbot renew --dry-run
```

### Using Cloudflare (Free)

1. Point your domain to Cloudflare nameservers
2. Enable "Full (Strict)" SSL mode
3. Enable "Always Use HTTPS"
4. Done! Cloudflare handles SSL automatically

---

## Database Setup (Optional)

### PostgreSQL (for persistence)

```bash
# Install PostgreSQL
apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE spacehouse;
CREATE USER spacehouse_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE spacehouse TO spacehouse_user;
\q

# Update .env
DATABASE_URL=postgresql://spacehouse_user:your-password@localhost:5432/spacehouse
```

### Add Database Support to Backend

Update `api.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
```

---

## Monitoring & Logging

### Application Logs

```bash
# Heroku
heroku logs --tail --app spacehouse-api

# Docker
docker logs -f spacehouse-api

# Systemd (VPS)
journalctl -u spacehouse-api -f
```

### Error Tracking

**Sentry (Recommended)**
```bash
pip install sentry-sdk[fastapi]
```

Add to `api.py`:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
)
```

### Performance Monitoring

**New Relic**
```bash
pip install newrelic
newrelic-admin run-program uvicorn api:app
```

---

## Production Checklist

### Security
- [ ] Update CORS origins to specific domains (remove `*`)
- [ ] Enable HTTPS/SSL
- [ ] Set secure environment variables
- [ ] Enable rate limiting
- [ ] Add authentication (if needed)
- [ ] Regular security updates

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN (CloudFlare, CloudFront)
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Enable Redis caching (if needed)

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Enable performance monitoring

### Backup
- [ ] Database backups (if using DB)
- [ ] Code repository backups
- [ ] Environment variable backups

---

## Scaling

### Horizontal Scaling (Multiple Instances)

**Docker Compose:**
```yaml
services:
  backend:
    deploy:
      replicas: 3
```

**Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spacehouse-api
spec:
  replicas: 3
```

### Load Balancing

Use nginx or cloud load balancers (AWS ALB, GCP Load Balancer)

---

## Cost Estimates

### Free Tier Option
- **Backend**: Heroku Free / Render Free - $0
- **Frontend**: Vercel Free / Netlify Free - $0
- **Total**: $0/month (with limitations)

### Small Production
- **Backend**: DigitalOcean Droplet ($6/mo)
- **Frontend**: Vercel Pro ($20/mo)
- **Domain**: Namecheap (~$12/year)
- **Total**: ~$27/month

### Medium Production
- **Backend**: AWS EC2 t3.medium ($30/mo)
- **Frontend**: CloudFront + S3 ($10/mo)
- **Database**: RDS PostgreSQL ($15/mo)
- **Monitoring**: Sentry Team ($26/mo)
- **Total**: ~$81/month

---

## Troubleshooting

### CORS Errors
- Verify `CORS_ORIGINS` includes your frontend URL
- Check browser console for exact error
- Ensure API URL doesn't have trailing slash

### Build Failures
- Check Node.js version (need 18+)
- Clear `node_modules` and reinstall
- Verify all environment variables are set

### Connection Refused
- Check firewall rules
- Verify backend is running: `curl http://localhost:8000/`
- Check logs for startup errors

---

## Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Search error messages online
4. Ask on Stack Overflow with tag `fastapi` or `react`

---

## Additional Resources

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Ready to deploy? Start with Option 1 (Heroku + Vercel) for the easiest setup!**
