# Troubleshooting Guide

> Common issues and solutions for heXcms development and deployment

---

## Table of Contents

- [Database Issues](#database-issues)
- [Webhook Problems](#webhook-problems)
- [Build Failures](#build-failures)
- [Sync Errors](#sync-errors)
- [Performance Issues](#performance-issues)
- [Deployment Problems](#deployment-problems)
- [Content Issues](#content-issues)
- [Development Environment](#development-environment)

---

## Database Issues

### Cannot Connect to Database

**Symptoms:**
- Error: "Connection timeout"
- Error: "ECONNREFUSED"
- Pages fail to load

**Solutions:**

```bash
# 1. Pull latest environment variables
vercel env pull .env.local

# 2. Verify environment variables exist
cat .env.local | grep POSTGRES

# 3. Test connection
node -e "require('@vercel/postgres').sql\`SELECT 1\`.then(r => console.log('✓ Connected'), e => console.error('✗ Failed:', e.message))"

# 4. Check Vercel dashboard
# Go to: Project → Storage → Your Database → Settings
# Verify database is running and not paused
```

**Common Causes:**
- Environment variables not set
- Database paused (Hobby plan auto-pauses after inactivity)
- Wrong connection string
- Vercel project not linked

---

### Too Many Database Connections

**Symptoms:**
- Error: "remaining connection slots are reserved"
- Error: "sorry, too many clients already"

**Solutions:**

```bash
# Use pooling URL instead of direct URL
# In your code, use POSTGRES_PRISMA_URL for pooling

# Or reduce concurrent connections
# In serverless functions, don't create new connection per request
```

**Fix:**
```typescript
// ❌ Bad: Creates new connection each time
export async function GET() {
  const client = new Pool({ connectionString: process.env.POSTGRES_URL });
  // ...
}

// ✅ Good: Reuse connection
import { sql } from '@vercel/postgres';
export async function GET() {
  const result = await sql`SELECT * FROM posts`;
  // ...
}
```

---

### Schema/Table Not Found

**Symptoms:**
- Error: "relation 'posts' does not exist"
- Error: "column does not exist"

**Solutions:**

```bash
# 1. Initialize database schema
npm run db:init

# 2. Verify tables exist
psql $POSTGRES_URL -c "\\dt"

# 3. If tables missing, run init script manually
# Check scripts/init-db.ts exists and run it
```

---

### Slow Database Queries

**Symptoms:**
- Pages load slowly
- API timeouts
- High latency

**Solutions:**

```sql
-- 1. Check if indexes exist
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'posts';

-- 2. Add missing indexes
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);

-- 3. Analyze slow queries
EXPLAIN ANALYZE
SELECT * FROM posts WHERE slug = 'my-post';
```

**See:** `docs/reference/database.md` for all recommended indexes

---

## Webhook Problems

### Webhook Returns 401 Unauthorized

**Symptoms:**
- GitHub shows "401" in webhook delivery
- Content not syncing
- Error: "Invalid signature"

**Solutions:**

```bash
# 1. Verify webhook secret matches
echo $GITHUB_WEBHOOK_SECRET

# 2. Check GitHub webhook configuration
# Repository → Settings → Webhooks → Edit
# Ensure secret matches exactly

# 3. Check signature verification code
# Verify using crypto.timingSafeEqual or equivalent
```

**Verify implementation:**
```typescript
// Correct signature verification
import { createHmac } from 'crypto';

const expectedSignature = 'sha256=' + createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

const isValid = signature === expectedSignature;
```

---

### Webhook Timeout

**Symptoms:**
- GitHub shows timeout after 10 seconds
- Some files sync, others don't
- Partial sync

**Solutions:**

```javascript
// vercel.json
{
  "functions": {
    "api/sync-content.ts": {
      "maxDuration": 60
    }
  }
}
```

**Optimize sync:**
- Process files in parallel
- Implement queue for large batches
- Return 200 quickly, process async

---

### Webhook Not Firing

**Symptoms:**
- Push to content repo, nothing happens
- No webhook deliveries in GitHub

**Solutions:**

```bash
# 1. Check webhook is configured
# GitHub → Repository → Settings → Webhooks

# 2. Verify webhook URL is correct
# Should be: https://yourdomain.com/api/sync-content

# 3. Check "Recent Deliveries" for errors

# 4. Ensure webhook is active
# Edit webhook → Active checkbox must be checked

# 5. Test with "Redeliver" button
```

---

### Signature Verification Fails

**Common mistakes:**

```typescript
// ❌ Wrong: Using wrong header
const signature = request.headers.get('x-hub-signature');

// ✅ Correct: GitHub uses SHA256
const signature = request.headers.get('x-hub-signature-256');

// ❌ Wrong: Comparing wrong format
const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');

// ✅ Correct: Include 'sha256=' prefix
const expectedSignature = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');

// ❌ Wrong: Payload as object
verifyWebhookSignature(JSON.parse(body), signature, secret);

// ✅ Correct: Payload as raw string
const body = await request.text();
verifyWebhookSignature(body, signature, secret);
```

---

## Build Failures

### TypeScript Errors During Build

**Symptoms:**
- `npm run build` fails
- Type errors in terminal
- Build succeeds locally but fails on Vercel

**Solutions:**

```bash
# 1. Run type check locally
npm run type-check

# 2. Fix all TypeScript errors
# Check file and line numbers in error output

# 3. Ensure strict mode is enabled
# Check tsconfig.json: "strict": true

# 4. Clear Next.js cache
rm -rf .next
npm run build
```

---

### Module Not Found

**Symptoms:**
- Error: "Cannot find module '@/lib/...'"
- Error: "Module not found: Can't resolve '...'"

**Solutions:**

```bash
# 1. Check tsconfig.json paths are configured
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Verify import path is correct
# Use: import { X } from '@/lib/utils'
# Not: import { X } from '../../../lib/utils'
```

---

### Out of Memory During Build

**Symptoms:**
- Error: "JavaScript heap out of memory"
- Build process crashes

**Solutions:**

```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

Or set in Vercel:
```bash
# Environment variable in Vercel dashboard
NODE_OPTIONS=--max-old-space-size=4096
```

---

## Sync Errors

### Markdown Parse Errors

**Symptoms:**
- Error: "Unexpected end of file"
- Error: "Invalid frontmatter"
- Content not appearing

**Solutions:**

```bash
# 1. Validate frontmatter format
# Ensure it starts and ends with ---

# 2. Check for special characters
# Quote strings with special characters

# 3. Use validation script
npm run validate-content
```

**Common frontmatter issues:**

```yaml
# ❌ Wrong: Missing closing ---
---
title: "My Post"

# Content starts here

# ✅ Correct:
---
title: "My Post"
---

# Content starts here

# ❌ Wrong: Unquoted special characters
title: My Post: A Guide

# ✅ Correct:
title: "My Post: A Guide"

# ❌ Wrong: Invalid date format
publishedAt: 01/15/2024

# ✅ Correct:
publishedAt: "2024-01-15"
```

---

### Files Not Syncing

**Symptoms:**
- Push to content repo, files don't appear
- Some files sync, others don't

**Solutions:**

```bash
# 1. Check webhook was triggered
# GitHub → Webhooks → Recent Deliveries

# 2. Check file path matches GITHUB_CONTENT_PATH
# Env var: GITHUB_CONTENT_PATH="content"
# Files must be in: content/posts/*.md

# 3. Check file naming convention
# Should be: YYYY-MM-DD-slug.md
# Example: 2024-01-15-hello-world.md

# 4. Run manual sync
npm run sync:full

# 5. Check logs
vercel logs --filter=/api/sync-content
```

---

### Author or Tag Not Found

**Symptoms:**
- Error: "Foreign key violation"
- Post syncs but missing author/tags

**Solutions:**

```bash
# 1. Ensure author exists in database
# Author slug in frontmatter must match database

# 2. Create author file if missing
# In content repo: content/authors/author-slug.md

# 3. Sync authors first, then posts

# 4. Check author slug matches
# Post frontmatter: author: "john-doe"
# Author file: content/authors/john-doe.md
```

---

## Performance Issues

### Slow Page Loads

**Symptoms:**
- Pages take >2 seconds to load
- Lighthouse score < 50

**Solutions:**

```bash
# 1. Check database query performance
# Add indexes if missing

# 2. Verify ISR is configured
# In page.tsx: export const revalidate = 60;

# 3. Optimize images
# Use next/image component

# 4. Check bundle size
ANALYZE=true npm run build

# 5. Enable caching
# Set appropriate Cache-Control headers
```

---

### High Server Load

**Symptoms:**
- Many database connections
- High function execution time
- Costs increasing

**Solutions:**

```typescript
// Use ISR instead of SSR where possible
export const revalidate = 60; // Regenerate every 60 seconds

// Limit concurrent syncs
// Add queue or rate limiting to webhook handler

// Optimize queries
// Use indexes, LIMIT results, select only needed columns
```

---

### Images Not Loading

**Symptoms:**
- Broken image links
- 404 for images

**Solutions:**

```typescript
// 1. Check image path
// Images should be in: public/images/
// Reference as: /images/photo.jpg

// 2. Configure image domains in next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com'],
  },
}

// 3. Use next/image component
import Image from 'next/image';

<Image
  src="/images/post.jpg"
  alt="Post image"
  width={800}
  height={600}
/>
```

---

## Deployment Problems

### Environment Variables Not Set

**Symptoms:**
- Error: "process.env.X is undefined"
- Features not working in production

**Solutions:**

```bash
# 1. Add env vars in Vercel dashboard
# Project → Settings → Environment Variables

# 2. Select correct environments
# ✓ Production
# ✓ Preview
# ✓ Development

# 3. Redeploy after adding env vars
vercel --prod --force

# 4. Verify env vars are set
vercel env ls
```

---

### Build Succeeds Locally but Fails on Vercel

**Common causes:**

```bash
# 1. Case-sensitive imports
# Local: works on macOS/Windows (case-insensitive)
# Vercel: fails on Linux (case-sensitive)

# Fix: Ensure import paths match exact file names

# 2. Missing dependencies
# Added to devDependencies but needed in production
npm install package --save

# 3. Environment-specific code
# Check for process.env.NODE_ENV conditions
```

---

### Custom Domain Not Working

**Symptoms:**
- Domain shows error
- SSL certificate issues

**Solutions:**

```bash
# 1. Wait for DNS propagation (up to 48 hours)

# 2. Verify DNS records
# A record: 76.76.21.21
# CNAME: cname.vercel-dns.com

# 3. Check domain in Vercel
# Project → Settings → Domains
# Status should be "Valid"

# 4. Force SSL
# Vercel automatically provisions SSL
# Wait 1-2 hours after DNS setup
```

---

## Content Issues

### Post Not Appearing

**Checklist:**

```yaml
# 1. Check status is 'published'
status: "published"

# 2. Check publishedAt is not in future
publishedAt: "2024-01-15"  # Must be <= today

# 3. Verify slug is unique
slug: "my-unique-post"

# 4. Check file synced successfully
# Look in database or run:
psql $POSTGRES_URL -c "SELECT title, status FROM posts WHERE slug = 'my-post'"
```

---

### Markdown Not Rendering Correctly

**Common issues:**

```markdown
# ❌ Wrong: Inline HTML not escaped
<div>This is raw HTML</div>

# ✅ Correct: Use markdown equivalent or configure rehype-raw

# ❌ Wrong: Code block without language
```
code here
```

# ✅ Correct: Specify language
```javascript
code here
```

# ❌ Wrong: Headings without space
#Heading

# ✅ Correct: Space after #
# Heading
```

---

### Tags Not Working

**Solutions:**

```yaml
# 1. Use array format
tags: ["javascript", "react", "tutorial"]

# Not: tags: javascript, react

# 2. Use lowercase slugs
tags: ["javascript"]  # not ["JavaScript"]

# 3. Ensure tags are created in database
# Use getOrCreateTag function in sync logic
```

---

## Development Environment

### Port 3000 Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
npm run dev -- -p 3001
```

---

### Hot Reload Not Working

```bash
# 1. Restart dev server
# Ctrl+C then npm run dev

# 2. Clear Next.js cache
rm -rf .next

# 3. Check file watcher limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Git Ignored Files Committed

```bash
# If .env.local was accidentally committed

# 1. Remove from git history
git rm --cached .env.local

# 2. Add to .gitignore
echo ".env.local" >> .gitignore

# 3. Commit
git commit -m "Remove .env.local from git"

# 4. Rotate secrets!
# All secrets in that file are compromised
```

---

## Getting More Help

### Check Logs

```bash
# Vercel production logs
vercel logs --prod

# Filter by specific function
vercel logs --filter=/api/sync-content

# Follow logs in real-time
vercel logs --follow
```

### Enable Debug Mode

```bash
# In .env.local
DEBUG=*
NODE_ENV=development

# View detailed error messages
```

### Check Documentation

- [API Reference](../reference/api.md)
- [Database Schema](../reference/database.md)
- [Deployment Guide](./deployment.md)
- [Quick Reference](./quick-reference.md)

### Community Support

- Next.js Discord: [nextjs.org/discord](https://nextjs.org/discord)
- Vercel Discord: [vercel.com/discord](https://vercel.com/discord)
- GitHub Discussions: Create issue in your repository

---

## Still Stuck?

If you've tried everything:

1. **Check the error message carefully**
   - Often contains the exact cause
   - Search for error message online

2. **Create minimal reproduction**
   - Isolate the problem
   - Test in fresh project

3. **Check recent changes**
   - What changed since it last worked?
   - Review git diff

4. **Ask for help**
   - Provide error messages
   - Share relevant code
   - Explain what you've tried

---

**Last Updated:** 2025-10-23
**See also:** [Quick Reference](./quick-reference.md)
