# Deployment Guide

## Overview

This guide covers deploying the Git-based CMS to Vercel, including database setup, environment configuration, and webhook integration.

---

## Prerequisites

- GitHub account with content repository
- Vercel account
- Node.js 18+ installed locally

---

## Quick Deploy (Vercel)

### Option 1: Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Click the deploy button
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to configure
```

---

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your project structure looks like this:

```
my-cms/
├── src/
│   └── app/
├── public/
├── package.json
├── next.config.js
├── tsconfig.json
└── .env.example
```

Create `.env.example`:

```bash
# Database
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# GitHub
GITHUB_TOKEN=
GITHUB_WEBHOOK_SECRET=
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=
GITHUB_CONTENT_PATH=content

# Next.js
NEXT_PUBLIC_SITE_URL=
REVALIDATION_SECRET=

# Optional
PREVIEW_SECRET=
ADMIN_SECRET=
```

---

### 2. Create Vercel Project

#### Via Web Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Via CLI

```bash
vercel
# Follow prompts
```

---

### 3. Set Up Vercel Postgres

#### Create Database

1. In Vercel Dashboard, go to Storage tab
2. Click "Create Database"
3. Select "Postgres"
4. Choose region (same as your app)
5. Name your database
6. Click "Create"

#### Connect to Project

1. Go to your database page
2. Click "Connect Project"
3. Select your project
4. Click "Connect"

This automatically adds these environment variables:
```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

---

### 4. Configure Environment Variables

#### Required Variables

**GitHub Integration:**

```bash
# Generate GitHub Personal Access Token
# Go to: GitHub → Settings → Developer settings → Personal access tokens
# Scopes needed: repo (Full control of private repositories)

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=blog-content
GITHUB_CONTENT_PATH=content

# Generate webhook secret (random string)
GITHUB_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

**Application:**

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
REVALIDATION_SECRET=$(openssl rand -hex 32)
```

#### Add to Vercel

**Via Dashboard:**
1. Project → Settings → Environment Variables
2. Add each variable
3. Select environments (Production, Preview, Development)
4. Save

**Via CLI:**
```bash
# Add one variable
vercel env add GITHUB_TOKEN

# Add from .env file
vercel env pull .env.local
```

---

### 5. Initialize Database

#### Option A: Via Vercel CLI

```bash
# Connect to your production database
vercel env pull .env.local

# Run initialization script
npm run db:init
```

#### Option B: Via Script

Create `scripts/init-db.ts`:

```typescript
import { sql } from '@vercel/postgres';

async function initDatabase() {
  console.log('Creating tables...');

  // Create posts table
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      html_content TEXT,
      featured_image VARCHAR(500),
      published_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      author_id INTEGER REFERENCES authors(id),
      status VARCHAR(20) DEFAULT 'draft',
      reading_time INTEGER,
      view_count INTEGER DEFAULT 0,
      meta_description TEXT,
      meta_keywords TEXT[]
    );
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);`;

  // ... (Add other tables)

  console.log('✓ Database initialized successfully');
}

initDatabase().catch(console.error);
```

Run it:
```bash
tsx scripts/init-db.ts
```

#### Option C: Manual SQL Execution

1. Open Vercel Dashboard → Storage → Your Database
2. Go to "Query" tab
3. Paste SQL from `DATABASE.md`
4. Execute

---

### 6. Set Up GitHub Webhook

#### Get Webhook URL

Your webhook URL will be:
```
https://your-domain.vercel.app/api/sync-content
```

#### Configure in GitHub

1. Go to your content repository
2. Settings → Webhooks → Add webhook

**Configuration:**
- **Payload URL**: `https://your-domain.vercel.app/api/sync-content`
- **Content type**: `application/json`
- **Secret**: Your `GITHUB_WEBHOOK_SECRET` value
- **Which events**: Select "Just the push event"
- **Active**: ✓ Checked

3. Click "Add webhook"

#### Test Webhook

1. Make a commit to your content repository
2. Go to GitHub Webhooks page
3. Check "Recent Deliveries"
4. Verify response is 200 OK

---

### 7. Initial Content Sync

#### Option A: Trigger via Webhook

Make a commit to content repository:
```bash
cd blog-content
echo "test" > test.txt
git add test.txt
git commit -m "Trigger sync"
git push
```

#### Option B: Manual Sync

```bash
# Run manual sync script
npm run sync:full
```

---

### 8. Verify Deployment

#### Check Database

```bash
# Connect to database
vercel env pull .env.local

# Query posts
node -e "
  const { sql } = require('@vercel/postgres');
  sql\`SELECT COUNT(*) FROM posts\`.then(r => console.log(r.rows));
"
```

#### Check Website

Visit your site:
```
https://your-domain.vercel.app/blog
```

#### Check API Health

```bash
curl https://your-domain.vercel.app/api/health
```

---

## Custom Domain Setup

### 1. Add Domain to Vercel

1. Project → Settings → Domains
2. Enter your domain
3. Click "Add"

### 2. Configure DNS

**For apex domain (example.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Update Environment Variables

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Redeploy for changes to take effect.

---

## Environment-Specific Configuration

### Production

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
# ... other production secrets
```

### Preview (Branch Deployments)

Automatically created for each branch.

Environment variables:
- Uses same DB as production (or separate if configured)
- Different `NEXT_PUBLIC_SITE_URL`

### Development

```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# ... local development secrets
```

Use `.env.local` for local development:
```bash
vercel env pull .env.local
```

---

## CI/CD Configuration

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Commits to main branch
- **Preview**: Commits to other branches
- **Pull Requests**: Each PR gets preview deployment

### Custom Build Command

If needed, customize in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

---

## Monitoring & Logging

### Vercel Analytics

Enable in dashboard:
1. Project → Analytics
2. Enable Web Analytics
3. Add to code (Next.js plugin auto-installs)

### Vercel Logs

View logs:
```bash
# Real-time logs
vercel logs

# Production logs
vercel logs --prod

# Filter by function
vercel logs --filter=/api/sync-content
```

### Log Retention

- Real-time: Last 1 hour
- Stored: Last 24 hours (Hobby plan)
- Extended: Up to 30 days (Pro plan)

---

## Database Management

### Connection Pooling

Vercel Postgres automatically pools connections.

Max connections:
- Hobby: 60 connections
- Pro: 120 connections

### Backups

**Automatic:**
- Daily backups (last 7 days)
- Point-in-time recovery

**Manual:**
```bash
# Export database
vercel env pull .env.local
pg_dump $POSTGRES_URL > backup.sql

# Restore
psql $POSTGRES_URL < backup.sql
```

### Query Database

**Via Vercel Dashboard:**
1. Storage → Your Database → Query

**Via CLI:**
```bash
vercel env pull .env.local
psql $POSTGRES_URL
```

---

## Performance Optimization

### Edge Network

Vercel deploys to global edge network automatically.

### ISR Configuration

In your pages:
```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

### Caching Headers

Next.js handles this automatically for ISR pages.

### Image Optimization

Use Next.js Image component:
```typescript
import Image from 'next/image';

<Image
  src="/images/post.jpg"
  alt="Post"
  width={800}
  height={600}
/>
```

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] `.env.local` in `.gitignore`
- [ ] Webhook signature verification implemented
- [ ] API routes have authentication
- [ ] Database uses parameterized queries
- [ ] Rate limiting implemented
- [ ] CORS configured properly

### Post-Deployment

- [ ] Test webhook delivery
- [ ] Verify database connection
- [ ] Check API endpoints
- [ ] Test preview mode
- [ ] Monitor error logs
- [ ] Set up alerts

---

## Troubleshooting

### Build Failures

**Issue:** Build fails with module not found

```bash
# Solution: Clear cache and rebuild
vercel --prod --force
```

**Issue:** TypeScript errors

```bash
# Solution: Check types locally first
npm run type-check
```

### Database Connection Issues

**Issue:** Connection timeout

```bash
# Check environment variables
vercel env ls

# Verify database is running
vercel logs --filter=postgres
```

**Issue:** Too many connections

```bash
# Solution: Use connection pooling URL
# Use POSTGRES_PRISMA_URL instead of POSTGRES_URL
```

### Webhook Not Working

**Issue:** 401 Unauthorized

```bash
# Check webhook secret matches
echo $GITHUB_WEBHOOK_SECRET
# Verify in GitHub webhook settings
```

**Issue:** Webhook timing out

```bash
# Check function logs
vercel logs --filter=/api/sync-content

# Increase function timeout in vercel.json
{
  "functions": {
    "api/sync-content.ts": {
      "maxDuration": 60
    }
  }
}
```

### Performance Issues

**Issue:** Slow page loads

```bash
# Enable Web Vitals monitoring
# Check Vercel Analytics

# Optimize images
# Use next/image component

# Check database queries
# Add indexes for slow queries
```

---

## Scaling Considerations

### Horizontal Scaling

Vercel automatically scales:
- Serverless functions scale infinitely
- Edge network distributes globally
- Database connections pool automatically

### Database Scaling

**Hobby Plan Limits:**
- 60 concurrent connections
- 256 MB storage
- 60 compute hours/month

**Upgrade to Pro:**
- 120 concurrent connections
- 512 MB storage
- 100 compute hours/month

**Need More?**
- Consider external PostgreSQL (AWS RDS, Neon, Supabase)
- Implement Redis caching

### Content Scaling

**100-1000 posts:** Works great out of the box

**1000-10000 posts:** 
- Add database indexes
- Implement pagination
- Use Redis for caching

**10000+ posts:**
- Consider database sharding
- Add full-text search engine (Algolia)
- CDN for media assets

---

## Backup & Disaster Recovery

### Backup Strategy

1. **Git Repository** (content source)
   - Already versioned
   - Can rebuild from here

2. **Database Backups**
   ```bash
   # Daily automated backups
   # Manual backups before major changes
   pg_dump $POSTGRES_URL > backup-$(date +%Y%m%d).sql
   ```

3. **Environment Variables**
   ```bash
   # Export to secure location
   vercel env pull .env.backup
   ```

### Recovery Procedures

**Lost Content:**
```bash
# Git is source of truth
# Run full sync
npm run sync:full
```

**Database Corruption:**
```bash
# Restore from backup
psql $POSTGRES_URL < backup-latest.sql

# Or rebuild from Git
npm run sync:full
```

**Complete Site Failure:**
```bash
# Redeploy from Git
vercel --prod --force

# Reinitialize database if needed
npm run db:init
npm run sync:full
```

---

## Cost Estimation

### Vercel Hobby (Free)

- Bandwidth: 100 GB/month
- Function Execution: 100 GB-hours/month
- Builds: Unlimited
- Postgres: 256 MB storage, 60 connections

**Suitable for:**
- Personal blogs
- Small projects
- Up to 10k monthly visitors

### Vercel Pro ($20/month)

- Bandwidth: 1 TB/month
- Function Execution: Unlimited
- Team features
- Postgres: 512 MB storage, 120 connections

**Suitable for:**
- Professional blogs
- Business sites
- Up to 100k monthly visitors

### Enterprise

Contact Vercel for custom pricing.

---

## Migration Guide

### From Existing Next.js Site

1. Add database tables
2. Implement sync logic
3. Update pages to query database
4. Set up webhook
5. Initial sync
6. Test and deploy

### From Other Platforms

1. Export content to markdown
2. Adjust frontmatter format
3. Commit to Git repository
4. Deploy new site
5. Run initial sync
6. Update DNS

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check error logs
- Monitor performance metrics
- Review webhook deliveries

**Monthly:**
- Update dependencies
- Review database size
- Check backup integrity
- Rotate secrets (if needed)

**Quarterly:**
- Performance audit
- Security review
- Cost optimization
- Feature planning

### Update Procedure

```bash
# Update dependencies
npm update

# Check for breaking changes
npm outdated

# Test locally
npm run dev
npm run build

# Deploy
git commit -am "Update dependencies"
git push
```

---

## Support Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)

### Professional Support
- Vercel Pro includes email support
- Enterprise includes dedicated support
