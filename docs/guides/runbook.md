# heXcms Operational Runbook

**Version:** 1.0
**Last Updated:** 2024-01-15

This runbook provides operational procedures for deploying, maintaining, and troubleshooting heXcms installations.

---

## Table of Contents

1. [Common Operations](#common-operations)
2. [Deployment Procedures](#deployment-procedures)
3. [Database Maintenance](#database-maintenance)
4. [Debugging & Troubleshooting](#debugging--troubleshooting)
5. [Performance Optimization](#performance-optimization)
6. [Incident Response](#incident-response)
7. [Backup & Recovery](#backup--recovery)
8. [Monitoring & Alerts](#monitoring--alerts)

---

## Common Operations

### Starting Local Development

```bash
# 1. Start PostgreSQL database
docker-compose up -d

# 2. Verify database is running
docker-compose ps

# 3. Initialize database (first time only)
npm run db:init

# 4. Start Next.js dev server
npm run dev

# 5. Open browser
open http://localhost:3000
```

**Expected output:**
- Database: `hexcms-postgres` running on port 5432
- Next.js: Server running on http://localhost:3000
- No errors in terminal

### Stopping Services

```bash
# Stop Next.js (Ctrl+C in terminal)

# Stop database (keep data)
docker-compose stop

# Stop and remove containers (keep data)
docker-compose down

# Stop and remove everything including data
docker-compose down -v
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/app/page.test.tsx
```

### Linting & Formatting

```bash
# Lint TypeScript/JavaScript
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# All checks before commit
npm run lint && npm run type-check && npm test
```

### Building for Production

```bash
# Create production build
npm run build

# Test production build locally
npm run start

# Build should output:
# - .next/ directory
# - No TypeScript errors
# - All pages compiled successfully
```

---

## Deployment Procedures

### Initial Deployment to Vercel

#### Prerequisites

- [ ] GitHub repository created
- [ ] Code pushed to main branch
- [ ] Vercel account created
- [ ] Environment variables ready

#### Steps

1. **Connect Repository**
   ```bash
   # From Vercel dashboard:
   # 1. Click "Add New Project"
   # 2. Import from GitHub
   # 3. Select heXcms repository
   ```

2. **Configure Project**
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Node Version: `18.x`

3. **Set Environment Variables**
   ```bash
   # In Vercel dashboard > Settings > Environment Variables
   POSTGRES_URL=postgres://...
   POSTGRES_PRISMA_URL=postgres://...
   GITHUB_TOKEN=ghp_...
   GITHUB_REPO_OWNER=your-username
   GITHUB_REPO_NAME=your-repo
   GITHUB_WEBHOOK_SECRET=your-secret
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

4. **Create Vercel Postgres Database**
   ```bash
   # In Vercel dashboard:
   # 1. Go to Storage tab
   # 2. Create Database > Postgres
   # 3. Copy connection strings to environment variables
   ```

5. **Initialize Database**
   ```bash
   # Connect to Vercel Postgres
   vercel env pull .env.local

   # Run initialization script
   psql $POSTGRES_URL < scripts/init-db.sql
   ```

6. **Deploy**
   ```bash
   # Vercel will auto-deploy on push to main
   git push origin main

   # Or trigger manual deployment
   vercel --prod
   ```

7. **Verify Deployment**
   - [ ] Visit deployment URL
   - [ ] Check homepage loads
   - [ ] Verify database connection
   - [ ] Test API routes
   - [ ] Check environment variables

#### Post-Deployment

8. **Configure Custom Domain** (Optional)
   ```bash
   # In Vercel dashboard > Settings > Domains
   # Add your domain and update DNS records
   ```

9. **Set Up GitHub Webhook**
   ```bash
   # In GitHub repo > Settings > Webhooks > Add webhook
   Payload URL: https://your-domain.com/api/sync
   Content type: application/json
   Secret: (same as GITHUB_WEBHOOK_SECRET)
   Events: Just the push event
   ```

10. **Test Webhook**
    ```bash
    # Push a content change
    echo "test" >> content/posts/2024-01-15-hello-world.md
    git add -A
    git commit -m "Test webhook"
    git push

    # Check Vercel logs for sync operation
    ```

### Updating Production

```bash
# 1. Make changes locally
# 2. Test changes
npm run lint && npm run type-check && npm test
npm run build

# 3. Commit and push
git add -A
git commit -m "Your message"
git push origin main

# 4. Vercel auto-deploys
# Monitor deployment in Vercel dashboard

# 5. Verify deployment
curl https://your-domain.com/api/health
```

### Rolling Back Deployment

```bash
# In Vercel dashboard:
# 1. Go to Deployments tab
# 2. Find previous working deployment
# 3. Click three dots > Promote to Production

# Or via CLI:
vercel rollback
```

---

## Database Maintenance

### Backing Up Database

**Vercel Postgres:**
```bash
# Export database to SQL file
pg_dump $POSTGRES_URL > backup-$(date +%Y%m%d).sql

# Compress backup
gzip backup-$(date +%Y%m%d).sql
```

**Local Docker:**
```bash
# Backup from Docker container
docker exec hexcms-postgres pg_dump -U hexcms hexcms > backup.sql
```

### Restoring Database

```bash
# Restore from backup file
psql $POSTGRES_URL < backup-20240115.sql

# Or with Docker:
docker exec -i hexcms-postgres psql -U hexcms hexcms < backup.sql
```

### Resetting Database

```bash
# WARNING: This deletes all data!

# Drop and recreate all tables
npm run db:reset

# Or manually:
psql $POSTGRES_URL << 'EOF'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\i scripts/init-db.sql
EOF
```

### Database Migrations

```bash
# Create migration file
touch scripts/migrations/001-add-featured-column.sql

# Write migration
cat > scripts/migrations/001-add-featured-column.sql << 'EOF'
ALTER TABLE posts ADD COLUMN featured BOOLEAN DEFAULT false;
CREATE INDEX idx_posts_featured ON posts(featured) WHERE featured = true;
EOF

# Run migration
psql $POSTGRES_URL < scripts/migrations/001-add-featured-column.sql
```

### Optimizing Database

```bash
# Analyze tables (update statistics)
psql $POSTGRES_URL -c "ANALYZE;"

# Vacuum (reclaim storage)
psql $POSTGRES_URL -c "VACUUM;"

# Reindex (rebuild indexes)
psql $POSTGRES_URL -c "REINDEX DATABASE hexcms;"
```

### Checking Database Size

```bash
# Total database size
psql $POSTGRES_URL -c "
  SELECT pg_size_pretty(pg_database_size('hexcms'));
"

# Table sizes
psql $POSTGRES_URL -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

## Debugging & Troubleshooting

### Application Won't Start

#### Symptom: `npm run dev` fails

**Check 1: Node version**
```bash
node --version
# Should be 18.17.0 or higher

# Use nvm to switch
nvm use
```

**Check 2: Dependencies**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Check 3: Port conflict**
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

**Check 4: Environment variables**
```bash
# Verify .env.local exists
cat .env.local

# Should contain database URL at minimum
```

### Database Connection Issues

#### Symptom: "Connection refused" or "Database error"

**Check 1: Database is running**
```bash
# For Docker:
docker-compose ps

# Should show hexcms-postgres as "Up"
```

**Check 2: Connection string**
```bash
# Verify POSTGRES_URL format
echo $POSTGRES_URL

# Should be: postgres://user:password@host:port/database
```

**Check 3: Database is accessible**
```bash
# Test connection
psql $POSTGRES_URL -c "SELECT 1;"

# Should return:
# ?column?
# ----------
#         1
```

**Check 4: Tables exist**
```bash
# List tables
psql $POSTGRES_URL -c "\dt"

# Should show: authors, posts, tags, post_tags, pages, sync_logs
```

**Fix: Reinitialize database**
```bash
docker-compose down -v
docker-compose up -d
npm run db:init
```

### Webhook Not Triggering

#### Symptom: Content changes don't appear on site

**Check 1: Webhook is configured**
```bash
# In GitHub: Settings > Webhooks
# Verify webhook exists with correct payload URL
```

**Check 2: Recent deliveries**
```bash
# In GitHub: Webhooks > Recent Deliveries
# Check for successful (200) responses
# If 4xx/5xx, check error message
```

**Check 3: Webhook secret**
```bash
# Verify secret matches environment variable
echo $GITHUB_WEBHOOK_SECRET
# Should match GitHub webhook secret
```

**Check 4: API route is accessible**
```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/sync \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 200 or 401 (if signature required)
```

**Check 5: Logs**
```bash
# In Vercel dashboard: Deployments > Functions > /api/sync
# Check function logs for errors
```

**Manual sync:**
```bash
# Trigger manual resync
npm run sync:full
```

### Content Not Appearing

#### Symptom: Post exists in Git but not on site

**Check 1: Frontmatter is valid**
```yaml
# Verify YAML syntax
---
title: "My Post"
author: "john-doe"
publishedAt: "2024-01-15"
status: "published"  # Must be "published"!
---
```

**Check 2: File location**
```bash
# Posts must be in content/posts/
ls -la content/posts/

# Check filename format: YYYY-MM-DD-slug.md
```

**Check 3: Database record**
```bash
# Check if post is in database
psql $POSTGRES_URL -c "
  SELECT slug, title, status FROM posts WHERE slug = 'your-post-slug';
"
```

**Check 4: Sync logs**
```bash
# Check sync operation logs
psql $POSTGRES_URL -c "
  SELECT * FROM sync_logs
  WHERE file_path LIKE '%your-post%'
  ORDER BY created_at DESC
  LIMIT 5;
"
```

**Fix: Resync specific file**
```bash
# Force resync by making a small change
echo "" >> content/posts/2024-01-15-your-post.md
git add -A
git commit -m "Force resync"
git push
```

### Build Failures

#### Symptom: Deployment fails on Vercel

**Check 1: Build logs**
```bash
# In Vercel dashboard: Deployments > Failed deployment > Build Logs
# Look for TypeScript errors, missing dependencies
```

**Check 2: Build locally**
```bash
# Test build locally
npm run build

# Fix any errors before pushing
```

**Check 3: Environment variables**
```bash
# Verify all required env vars are set in Vercel
# Settings > Environment Variables
```

**Check 4: Node version**
```bash
# Ensure .nvmrc specifies correct version
cat .nvmrc  # Should be 18.17.0
```

### Slow Page Loads

#### Symptom: Pages take >3 seconds to load

**Check 1: Database query performance**
```bash
# Enable query logging
psql $POSTGRES_URL -c "
  ALTER DATABASE hexcms SET log_statement = 'all';
  ALTER DATABASE hexcms SET log_duration = on;
"

# Check slow queries in logs
# Reconnect to apply settings
```

**Check 2: Missing indexes**
```bash
# Verify indexes exist
psql $POSTGRES_URL -c "
  SELECT tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public';
"
```

**Check 3: Next.js caching**
```typescript
// Ensure pages use caching
export const revalidate = 3600; // Revalidate every hour

// Or dynamic rendering
export const dynamic = 'force-static';
```

**Check 4: Image optimization**
```jsx
// Use next/image component
import Image from 'next/image';

<Image
  src="/images/post.jpg"
  width={800}
  height={600}
  alt="Description"
/>
```

---

## Performance Optimization

### Database Indexing

```sql
-- Create indexes for common queries

-- Posts by status and published date
CREATE INDEX idx_posts_status_published
  ON posts(status, published_at DESC)
  WHERE status = 'published';

-- Posts by author
CREATE INDEX idx_posts_author_published
  ON posts(author_id, published_at DESC);

-- Full-text search
CREATE INDEX idx_posts_search
  ON posts USING GIN(search_vector);

-- Tag filtering
CREATE INDEX idx_post_tags_tag_id
  ON post_tags(tag_id);
```

### Caching Strategy

```typescript
// src/app/posts/page.tsx
export const revalidate = 3600; // 1 hour

// src/app/posts/[slug]/page.tsx
export const revalidate = 86400; // 24 hours

// API routes
export const dynamic = 'force-static';
export const revalidate = 3600;
```

### Image Optimization

```bash
# Install sharp for optimized image processing
npm install sharp

# Use next/image component everywhere
# It automatically optimizes, lazy loads, and serves WebP
```

### Bundle Size Optimization

```bash
# Analyze bundle size
npm run build
# Look for large dependencies

# Use dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'));

# Enable bundle analyzer
npm install -D @next/bundle-analyzer
```

---

## Incident Response

### Site is Down

**Priority: P0 - Critical**

#### 1. Assess Impact (2 minutes)

```bash
# Check site status
curl -I https://your-domain.com

# Check Vercel status
open https://www.vercel-status.com

# Check database
psql $POSTGRES_URL -c "SELECT 1;"
```

#### 2. Identify Root Cause (5 minutes)

**Recent deployment?**
```bash
# Rollback immediately
vercel rollback
```

**Database issue?**
```bash
# Check database connections
psql $POSTGRES_URL -c "
  SELECT count(*) FROM pg_stat_activity;
"

# If connection limit reached, kill idle connections
psql $POSTGRES_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
"
```

**Rate limit or DDoS?**
```bash
# Check Vercel analytics for traffic spike
# Enable rate limiting if needed
```

#### 3. Restore Service (10 minutes)

```bash
# Option 1: Rollback deployment
vercel rollback

# Option 2: Emergency database restore
psql $POSTGRES_URL < backup-latest.sql

# Option 3: Redeploy last known good commit
git revert HEAD
git push origin main
```

#### 4. Post-Incident (After service restored)

```bash
# Document incident
# - What happened?
# - What was the impact?
# - Root cause?
# - How was it resolved?
# - How to prevent in future?
```

### Data Loss / Corruption

**Priority: P1 - High**

#### 1. Stop the Bleeding

```bash
# Immediately disable webhooks to prevent further sync
# GitHub: Settings > Webhooks > Edit > Disable

# Take database snapshot
pg_dump $POSTGRES_URL > emergency-backup-$(date +%Y%m%d-%H%M%S).sql
```

#### 2. Assess Damage

```bash
# Check sync logs for errors
psql $POSTGRES_URL -c "
  SELECT * FROM sync_logs
  WHERE status = 'error'
  ORDER BY created_at DESC
  LIMIT 20;
"

# Verify data integrity
psql $POSTGRES_URL -c "
  SELECT
    (SELECT COUNT(*) FROM posts) AS posts_count,
    (SELECT COUNT(*) FROM authors) AS authors_count,
    (SELECT COUNT(*) FROM tags) AS tags_count;
"
```

#### 3. Restore from Backup

```bash
# Identify last good backup
ls -lah backups/

# Restore
psql $POSTGRES_URL < backups/backup-20240115.sql

# Re-enable webhooks after verification
```

### Performance Degradation

**Priority: P2 - Medium**

#### 1. Identify Bottleneck

```bash
# Check database performance
psql $POSTGRES_URL -c "
  SELECT query, calls, mean_exec_time, total_exec_time
  FROM pg_stat_statements
  ORDER BY total_exec_time DESC
  LIMIT 10;
"

# Check Vercel function execution times
# Dashboard > Analytics > Functions
```

#### 2. Quick Fixes

```bash
# Analyze and vacuum database
psql $POSTGRES_URL -c "VACUUM ANALYZE;"

# Clear Next.js cache
rm -rf .next/cache

# Redeploy to clear edge cache
vercel --prod --force
```

#### 3. Long-term Solutions

- Add database indexes for slow queries
- Implement Redis caching
- Optimize heavy queries
- Enable CDN caching headers

---

## Backup & Recovery

### Automated Backups

**Daily backups with GitHub Actions:**

```yaml
# .github/workflows/backup.yml
name: Daily Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup database
        run: |
          pg_dump ${{ secrets.POSTGRES_URL }} > backup.sql
          gzip backup.sql

      - name: Upload to S3
        uses: aws-actions/upload-to-s3@v1
        with:
          file: backup.sql.gz
          bucket: hexcms-backups
```

### Manual Backup

```bash
# Create timestamped backup
backup_file="backup-$(date +%Y%m%d-%H%M%S).sql"
pg_dump $POSTGRES_URL > $backup_file
gzip $backup_file

# Upload to S3 (optional)
aws s3 cp $backup_file.gz s3://hexcms-backups/
```

### Disaster Recovery

#### Complete Site Restoration

```bash
# 1. Create new Vercel project
# 2. Create new Postgres database
# 3. Restore database from backup
psql $NEW_POSTGRES_URL < backup-latest.sql

# 4. Update environment variables
# 5. Deploy application
vercel --prod

# 6. Update DNS to point to new deployment
```

#### Estimated Recovery Time: 30 minutes

---

## Monitoring & Alerts

### Health Checks

Create API route for health monitoring:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    await sql`SELECT 1`;

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** (free)
- **Ping dom**
- **Better Uptime**

Configure to check `/api/health` every 5 minutes.

### Log Monitoring

```bash
# View recent Vercel logs
vercel logs your-deployment-url

# Filter for errors
vercel logs your-deployment-url --follow | grep ERROR

# Export logs to file
vercel logs your-deployment-url > logs-$(date +%Y%m%d).txt
```

### Database Monitoring

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Database size
SELECT pg_size_pretty(pg_database_size('hexcms'));
```

### Alerts

Set up alerts for:
- Site downtime (> 1 minute)
- 5xx error rate (> 1%)
- API latency (p99 > 1s)
- Database connection errors
- Disk space (> 80% full)

---

## Support Contacts

### Emergency Contacts

- **On-call Engineer**: [Contact Info]
- **Database Admin**: [Contact Info]
- **DevOps Lead**: [Contact Info]

### External Services

- **Vercel Support**: support@vercel.com
- **GitHub Support**: support@github.com
- **DNS Provider**: [Contact Info]

### Documentation Links

- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Vercel Docs](https://vercel.com/docs)
- [heXcms Docs](./README.md)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-15 | 1.0 | Initial runbook creation |

---

**Last Reviewed**: 2024-01-15
**Next Review Due**: 2024-04-15
