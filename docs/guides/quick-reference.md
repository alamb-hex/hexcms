# Quick Reference Guide

> Essential commands, environment variables, and shortcuts for heXcms development

---

## Common Commands

### Development

```bash
# Start development server
npm run dev

# Type check
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

### Database

```bash
# Initialize database
npm run db:init

# Manual full sync
npm run sync:full

# Incremental sync
npm run sync

# Connect to database (via Vercel CLI)
vercel env pull .env.local
psql $POSTGRES_URL
```

### Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
vercel logs --prod
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: add feature"

# Push to remote
git push origin feature/my-feature

# Merge to main (after PR approval)
git checkout main
git merge feature/my-feature
git push origin main
```

---

## Environment Variables

### Required Variables

```bash
# Database (auto-added when connecting Vercel Postgres)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# GitHub Integration
GITHUB_TOKEN="ghp_..."                    # GitHub Personal Access Token
GITHUB_WEBHOOK_SECRET="..."               # Webhook secret (random string)
GITHUB_REPO_OWNER="your-username"         # GitHub username
GITHUB_REPO_NAME="blog-content"           # Content repository name
GITHUB_CONTENT_PATH="content"             # Path to content folder

# Application
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"  # Your site URL
REVALIDATION_SECRET="..."                 # For ISR revalidation (random string)
```

### Optional Variables

```bash
# Preview Mode
PREVIEW_SECRET="..."                      # For draft previews

# Admin Tools
ADMIN_SECRET="..."                        # For manual sync endpoint

# Development
NODE_ENV="development"                    # Environment mode
```

### Generate Secrets

```bash
# Generate random secrets
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API Endpoints

### Production URLs

```bash
# Webhook (GitHub calls this)
POST https://yourdomain.com/api/sync-content

# Health check
GET https://yourdomain.com/api/health

# Revalidation (manual)
POST https://yourdomain.com/api/revalidate

# Preview mode
GET https://yourdomain.com/api/preview?secret=xxx&slug=post-slug

# Disable preview
GET https://yourdomain.com/api/preview/disable
```

### Testing Locally

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test revalidation
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-secret","path":"/blog/test-post"}'

# Expose local server for webhook testing
ngrok http 3000
# Then use https://xxxxx.ngrok.io/api/sync-content as webhook URL
```

---

## File Paths

### Source Code

```
src/
├── app/                        # Next.js routes
│   ├── api/sync-content/route.ts     # Webhook handler
│   ├── blog/page.tsx                  # Blog listing
│   └── blog/[slug]/page.tsx           # Single post
├── components/                 # React components
│   └── blog/PostCard.tsx
├── lib/                        # Core logic
│   ├── markdown/processor.ts          # Markdown parsing
│   ├── sync/syncer.ts                 # Sync orchestration
│   └── queries/posts.ts               # Database queries
└── types/                      # TypeScript types
    └── database.ts
```

### Documentation

```
docs/
├── guides/                     # User guides
│   ├── getting-started.md
│   ├── deployment.md
│   ├── quick-reference.md      # This file
│   └── troubleshooting.md
├── reference/                  # Technical docs
│   ├── api.md
│   ├── database.md
│   ├── tech-stack.md
│   └── content-format.md
├── architecture/               # System design
│   ├── overview.md
│   ├── project-structure.md
│   └── design-decisions.md
└── development/                # Dev guides
    ├── implementation-roadmap.md
    ├── contributing.md
    └── testing.md
```

---

## Database Queries

### Common Queries

```sql
-- Get all published posts
SELECT * FROM posts
WHERE status = 'published'
ORDER BY published_at DESC
LIMIT 20;

-- Get post by slug
SELECT * FROM posts WHERE slug = 'my-post-slug';

-- Get posts by tag
SELECT p.* FROM posts p
JOIN post_tags pt ON p.id = pt.post_id
JOIN tags t ON pt.tag_id = t.id
WHERE t.slug = 'javascript';

-- Get all tags with post counts
SELECT t.name, t.slug, COUNT(pt.post_id) as count
FROM tags t
LEFT JOIN post_tags pt ON t.id = pt.tag_id
GROUP BY t.id
ORDER BY count DESC;

-- Search posts
SELECT * FROM posts
WHERE status = 'published'
  AND (title ILIKE '%search%' OR content ILIKE '%search%');
```

### Database Management

```bash
# Query database
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM posts"

# Backup database
pg_dump $POSTGRES_URL > backup.sql

# Restore database
psql $POSTGRES_URL < backup.sql

# Check database size
psql $POSTGRES_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()))"
```

---

## Debugging

### Check Logs

```bash
# Vercel production logs
vercel logs --prod

# Filter by function
vercel logs --filter=/api/sync-content

# Follow logs in real-time
vercel logs --follow

# Local development logs
npm run dev
# Check terminal output
```

### Common Issues

**Build failing:**
```bash
# Test build locally first
npm run build

# Check TypeScript errors
npm run type-check

# Check for missing env vars
vercel env ls
```

**Database connection error:**
```bash
# Pull latest env vars
vercel env pull .env.local

# Test connection
node -e "require('@vercel/postgres').sql\`SELECT 1\`.then(r => console.log('✓ Connected'))"
```

**Webhook not working:**
```bash
# Check webhook deliveries in GitHub
# Repository → Settings → Webhooks → Recent Deliveries

# View webhook logs
vercel logs --filter=/api/sync-content

# Verify signature secret matches
echo $GITHUB_WEBHOOK_SECRET
```

---

## Content Management

### Create New Post

```bash
# In your content repository
cd blog-content/content/posts

# Create new post
cat > $(date +%Y-%m-%d)-my-new-post.md << 'EOF'
---
title: "My New Post"
author: "john-doe"
publishedAt: "$(date +%Y-%m-%d)"
tags: ["web", "tutorial"]
status: "published"
---

# My New Post

Content goes here...
EOF

# Commit and push
git add .
git commit -m "Add new post"
git push
```

### Frontmatter Template

```yaml
---
title: "Post Title"
excerpt: "Short description"
author: "author-slug"
publishedAt: "2024-01-15"
updatedAt: "2024-01-20"
featuredImage: "/images/posts/image.jpg"
tags: ["tag1", "tag2"]
status: "published"
metaDescription: "SEO description"
---
```

---

## Performance

### Lighthouse Scores

```bash
# Install Lighthouse CLI
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun --collect.url=https://yourdomain.com

# Or use Chrome DevTools
# Open DevTools → Lighthouse tab → Generate report
```

### Bundle Analysis

```bash
# Install bundle analyzer
npm install -D @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

### Core Web Vitals

Monitor at:
- Vercel Analytics dashboard
- Chrome DevTools → Performance
- PageSpeed Insights

---

## Keyboard Shortcuts (VSCode)

```
Cmd/Ctrl + P        - Quick file open
Cmd/Ctrl + Shift + P - Command palette
Cmd/Ctrl + B        - Toggle sidebar
Cmd/Ctrl + `        - Toggle terminal
Cmd/Ctrl + /        - Toggle comment
Cmd/Ctrl + Shift + F - Global search
F2                  - Rename symbol
```

---

## Git Commit Convention

```bash
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks

# Examples:
git commit -m "feat: add tag filtering page"
git commit -m "fix: resolve webhook signature validation"
git commit -m "docs: update API documentation"
```

---

## Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test PostCard.test.tsx

# Coverage report
npm test -- --coverage
```

---

## Useful Links

- **Project Docs:** `docs/README.md`
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `lsof -ti:3000 \| xargs kill` |
| Module not found | `rm -rf node_modules && npm install` |
| Build cache issues | `rm -rf .next && npm run build` |
| Env vars not loading | `vercel env pull .env.local` |
| Git conflicts | `git status` then resolve manually |

---

## Emergency Commands

```bash
# Reset everything
rm -rf node_modules .next
npm install
npm run build

# Force redeploy
vercel --prod --force

# Rebuild database (DESTRUCTIVE)
npm run db:init

# Full content resync
npm run sync:full
```

---

**Last Updated:** 2025-10-23
**See also:** [Troubleshooting Guide](./troubleshooting.md)
