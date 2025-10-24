# Deployment Options

heXcms supports multiple deployment strategies, from serverless platforms to traditional VPS hosting. Choose the option that best fits your needs.

---

## Overview

| Platform | Database Driver | Cost | Difficulty | Best For |
|----------|----------------|------|------------|----------|
| **Vercel + Neon** | `neon` | Free tier | ⭐ Easy | Production, edge deployment |
| **Docker Compose** | `postgres` | Free | ⭐⭐ Medium | Local development |
| **Railway.app** | `postgres` | $5/month | ⭐ Easy | Hobby projects |
| **VPS (Ubuntu)** | `postgres` | $5-10/month | ⭐⭐⭐ Hard | Self-hosted, full control |

---

## Database Driver Selection

heXcms automatically selects the appropriate database driver:

```bash
# Option 1: Explicit (recommended)
DATABASE_DRIVER=neon      # Use Neon serverless driver
DATABASE_DRIVER=postgres  # Use node-postgres (pg) driver

# Option 2: Auto-detection (if DATABASE_DRIVER not set)
# - Vercel environment detected → uses 'neon'
# - Otherwise → uses 'postgres'
```

**Drivers:**
- **Neon** - Serverless PostgreSQL driver optimized for edge runtime (Vercel)
- **Postgres** - Traditional connection pooling for standard deployments

---

## 1. Vercel + Neon (Recommended for Production)

✅ **Pros:** Zero-config edge deployment, automatic scaling, free tier
❌ **Cons:** Vendor lock-in to Vercel ecosystem

### Prerequisites
- GitHub account
- Vercel account
- Content repository (e.g., `hexcms-content`)

### Setup Steps

**1. Create Neon Database**
```bash
# In Vercel Dashboard
1. Go to Storage tab
2. Create Database → Neon Postgres
3. Name: hexcms-db
4. Region: Choose closest to your users
```

**2. Deploy to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel

# Link project (follow prompts)
# Vercel auto-detects Next.js and configures build
```

**3. Configure Environment Variables**
```bash
# In Vercel Dashboard → Settings → Environment Variables
DATABASE_DRIVER=neon
GITHUB_TOKEN=ghp_xxxxx
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=hexcms-content
GITHUB_WEBHOOK_SECRET=your-secret-here
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

**4. Pull Environment Variables Locally**
```bash
vercel env pull .env.local
```

**5. Initialize Database**
```bash
npm run db:init
npm run db:test  # Verify connection
```

### Verification
```bash
# Check deployment
curl https://your-domain.vercel.app/api/health
```

---

## 2. Docker Compose (Local Development)

✅ **Pros:** Isolated environment, no cloud dependencies, fast iteration
❌ **Cons:** Not suitable for production without orchestration

### Prerequisites
- Docker Desktop installed
- Git repository cloned

### Setup Steps

**1. Copy Environment File**
```bash
cp .env.docker .env.local

# Edit .env.local with your values:
# - GITHUB_TOKEN (if testing content sync)
# - GITHUB_REPO_OWNER / GITHUB_REPO_NAME
```

**2. Start Docker Services**
```bash
# Start PostgreSQL container
npm run docker:up

# Check logs
npm run docker:logs

# Wait for PostgreSQL to be ready (health check)
```

**3. Initialize Database**
```bash
npm run db:init
npm run db:test
```

**4. Start Development Server**
```bash
npm run docker:dev
```

**Access:**
- **App:** http://localhost:3000
- **Database:** localhost:5432
  - User: hexcms
  - Password: hexcms
  - Database: hexcms

**Stop Services:**
```bash
npm run docker:down
```

---

## 3. Railway.app

✅ **Pros:** Simple deployment, fair pricing, PostgreSQL included
❌ **Cons:** $5/month minimum after trial

### Setup Steps

**1. Create Railway Project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init
```

**2. Add PostgreSQL**
```bash
railway add postgres
```

**3. Configure Environment**
```bash
# In Railway Dashboard → Variables
DATABASE_DRIVER=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-injected
GITHUB_TOKEN=ghp_xxxxx
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=hexcms-content
```

**4. Deploy**
```bash
railway up
```

**5. Initialize Database**
```bash
# Connect to Railway PostgreSQL
railway connect postgres

# Run init script
\i scripts/init-db.sql
```

---

## 4. VPS (Ubuntu + PM2)

✅ **Pros:** Full control, predictable costs, portable
❌ **Cons:** Manual setup, you manage infrastructure

### Prerequisites
- Ubuntu 22.04+ VPS (DigitalOcean, Linode, Hetzner, etc.)
- SSH access
- Domain name (optional)

### Setup Steps

**1. Install Dependencies**
```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL 16
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-16

# Install PM2
npm install -g pm2
```

**2. Setup PostgreSQL**
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE USER hexcms WITH PASSWORD 'secure-password-here';
CREATE DATABASE hexcms OWNER hexcms;
\q
```

**3. Deploy Application**
```bash
# Clone repository
git clone https://github.com/your-username/hexcms.git /var/www/hexcms
cd /var/www/hexcms

# Install dependencies
npm install

# Create .env.local
nano .env.local
```

**.env.local content:**
```bash
DATABASE_DRIVER=postgres
DATABASE_URL=postgres://hexcms:secure-password-here@localhost:5432/hexcms
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
GITHUB_TOKEN=ghp_xxxxx
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=hexcms-content
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production
```

**4. Initialize Database**
```bash
npm run db:init
```

**5. Build and Start**
```bash
# Build Next.js
npm run build

# Start with PM2
pm2 start npm --name "hexcms" -- start
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

**6. Setup Nginx (Optional)**
```bash
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/hexcms
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/hexcms /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Setup SSL with Certbot (optional)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## Comparison Table

| Feature | Vercel + Neon | Docker | Railway | VPS |
|---------|--------------|--------|---------|-----|
| Setup Time | 10 min | 5 min | 15 min | 60 min |
| Free Tier | ✅ Yes | ✅ Local only | ⚠️ Trial only | ❌ No |
| Auto-scaling | ✅ Yes | ❌ No | ⚠️ Limited | ❌ No |
| Edge Functions | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Database Backup | ✅ Automatic | ⚠️ Manual | ✅ Automatic | ⚠️ Manual |
| Custom Domain | ✅ Free | ❌ N/A | ✅ Included | ✅ Included |
| Git Integration | ✅ Auto-deploy | ❌ Manual | ✅ Auto-deploy | ⚠️ Manual |

---

## Troubleshooting

### Database Connection Issues

**Problem:** `DATABASE_URL not found`

**Solution:**
```bash
# Verify environment variables are loaded
echo $DATABASE_URL

# If empty, ensure .env.local exists
ls -la .env.local

# Pull from Vercel
vercel env pull .env.local

# Or create manually
cp .env.example .env.local
```

**Problem:** `Cannot connect to database`

**Solution:**
```bash
# Test connection
npm run db:test

# Check which driver is being used
# Look for: [db-adapter] Using <driver> driver

# Force specific driver
DATABASE_DRIVER=postgres npm run db:test
DATABASE_DRIVER=neon npm run db:test
```

### Driver Selection Issues

**Problem:** Using wrong driver

**Solution:**
```bash
# Explicitly set in .env.local
DATABASE_DRIVER=neon      # For Vercel
DATABASE_DRIVER=postgres  # For Docker/VPS

# Or set inline
DATABASE_DRIVER=postgres npm run dev
```

---

## Migration Between Platforms

### From Docker → Vercel

```bash
# 1. Export data from local PostgreSQL
pg_dump -U hexcms hexcms > backup.sql

# 2. Deploy to Vercel + create Neon database
vercel
vercel env pull .env.local

# 3. Import to Neon
psql $DATABASE_URL < backup.sql

# 4. Update DATABASE_DRIVER
echo "DATABASE_DRIVER=neon" >> .env.local

# 5. Deploy
git push origin main  # Triggers Vercel deployment
```

### From Vercel → VPS

```bash
# 1. Export from Neon
pg_dump $DATABASE_URL > backup.sql

# 2. Setup VPS (see VPS instructions above)

# 3. Import to VPS PostgreSQL
psql -U hexcms hexcms < backup.sql

# 4. Update environment
DATABASE_DRIVER=postgres
DATABASE_URL=postgres://hexcms:pass@localhost:5432/hexcms

# 5. Deploy application
pm2 restart hexcms
```

---

## Next Steps

After deployment:
1. ✅ [Configure GitHub Webhook](./content-sync.md)
2. ✅ [Setup Content Repository](./content-format.md)
3. ✅ [Test Content Sync](./testing.md)
4. ✅ [Monitor Performance](./monitoring.md)

---

## Support

- **Documentation:** [docs/README.md](../README.md)
- **Issues:** [GitHub Issues](https://github.com/alamb-hex/hexcms/issues)
- **Discussions:** [GitHub Discussions](https://github.com/alamb-hex/hexcms/discussions)
