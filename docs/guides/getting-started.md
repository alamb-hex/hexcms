# Getting Started Guide

## Welcome!

You now have a complete technical specification for building a Git-based Headless CMS. This guide will help you navigate the documentation and get started quickly.

---

## Documentation Overview

### 📚 Main Documents

1. **[README.md](./README.md)** - Start here
   - Project overview
   - Quick start commands
   - Key features

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design
   - Architecture diagrams
   - Component breakdown
   - Data flow
   - Design decisions

3. **[TECH_STACK.md](./TECH_STACK.md)** - Technologies
   - Complete dependency list
   - Configuration files
   - Version requirements

4. **[DATABASE.md](./DATABASE.md)** - Database
   - Complete schema
   - Common queries
   - Optimization tips

5. **[API.md](./API.md)** - API Reference
   - All endpoints
   - Request/response formats
   - Testing examples

6. **[CONTENT_FORMAT.md](./CONTENT_FORMAT.md)** - Content guide
   - Markdown structure
   - Frontmatter fields
   - Writing guidelines

7. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy to production
   - Step-by-step deployment
   - Environment setup
   - Troubleshooting

8. **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Build roadmap
   - Phase-by-phase plan
   - Task checklists
   - Timeline estimates

9. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - File organization
   - Directory layout
   - File descriptions
   - Best practices

---

## Quick Start (5 Minutes)

### 1. Create Project

```bash
# Create Next.js app
npx create-next-app@latest my-cms --typescript --tailwind --app
cd my-cms

# Install dependencies
npm install @vercel/postgres gray-matter unified remark remark-gfm rehype rehype-highlight rehype-slug rehype-autolink-headings @octokit/rest date-fns reading-time zod

npm install -D @tailwindcss/typography tsx
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### 3. Initialize Database

```bash
# Connect to Vercel Postgres
vercel link

# Pull environment variables
vercel env pull .env.local

# Run init script (you'll create this)
npm run db:init
```

### 4. Create Content Repository

```bash
# In a separate directory
mkdir blog-content
cd blog-content
git init

# Create structure
mkdir -p content/{posts,authors,pages}

# Add example post
cat > content/posts/2024-01-01-hello-world.md << 'EOF'
---
title: "Hello World"
author: "system"
publishedAt: "2024-01-01"
tags: ["welcome"]
status: "published"
---

# Hello World

Welcome to my blog!
EOF

# Commit and push
git add .
git commit -m "Initial content"
git remote add origin <your-repo-url>
git push -u origin main
```

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Implementation Path

### Path A: Rapid Prototyping (1 Week)

**Goal:** Get a working prototype quickly

**Focus on:**
1. Basic database schema
2. Simple sync function
3. Blog listing and post pages
4. Minimal styling

**Skip for now:**
- Advanced features
- Perfect styling
- Optimization

**Follow:** Phases 1-4 from [IMPLEMENTATION.md](./IMPLEMENTATION.md)

---

### Path B: Production-Ready (4-6 Weeks)

**Goal:** Build a complete, polished system

**Timeline:**
- Week 1-2: Core infrastructure + sync
- Week 3-4: Content rendering + features
- Week 5-6: Optimization + polish

**Follow:** All phases from [IMPLEMENTATION.md](./IMPLEMENTATION.md)

---

### Path C: Incremental Migration

**Goal:** Migrate existing blog gradually

**Steps:**
1. Set up new system alongside existing
2. Migrate posts in batches
3. Test thoroughly
4. Switch over
5. Deprecate old system

**See:** Migration guide in [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Essential Files to Create First

### Week 1 Priority Files

1. **Database Schema**
   ```bash
   scripts/init-db.ts
   ```
   - Creates all tables
   - Adds indexes
   - Seeds initial data

2. **Markdown Parser**
   ```bash
   src/lib/markdown/processor.ts
   src/lib/sync/parser.ts
   ```
   - Parses frontmatter
   - Converts MD to HTML
   - Extracts metadata

3. **GitHub Integration**
   ```bash
   src/lib/sync/github.ts
   ```
   - Fetches files
   - Verifies webhooks
   - Gets changed files

4. **Sync Orchestrator**
   ```bash
   src/lib/sync/syncer.ts
   ```
   - Main sync logic
   - Coordinates parsing/saving
   - Error handling

5. **Webhook Endpoint**
   ```bash
   src/app/api/sync-content/route.ts
   ```
   - Receives GitHub webhooks
   - Triggers sync
   - Returns status

6. **Blog Pages**
   ```bash
   src/app/blog/page.tsx
   src/app/blog/[slug]/page.tsx
   ```
   - Lists posts
   - Renders individual posts
   - ISR configuration

---

## Common First Steps

### Set Up Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link
```

### Create Database

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Storage → Create Database → Postgres
3. Connect to your project
4. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

### Generate Secrets

```bash
# GitHub webhook secret
openssl rand -hex 32

# Revalidation secret
openssl rand -hex 32

# Add to .env.local
```

### Create GitHub Token

1. GitHub Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Select scopes: `repo` (full control)
5. Copy token to `.env.local`

---

## Development Workflow

### Daily Development

```bash
# Start dev server
npm run dev

# In another terminal, watch logs
vercel logs --follow

# Test webhook locally (use ngrok)
ngrok http 3000
```

### Testing Changes

```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Build locally
npm run build

# Test build
npm run start
```

### Deploy Preview

```bash
# Deploy to preview
git checkout -b feature/my-feature
git add .
git commit -m "Add feature"
git push

# Vercel automatically deploys preview
```

---

## Troubleshooting First Issues

### "Cannot connect to database"

**Solution:**
```bash
# Pull latest env vars
vercel env pull .env.local

# Check connection
node -e "require('@vercel/postgres').sql\`SELECT 1\`"
```

### "Webhook signature invalid"

**Solution:**
- Verify `GITHUB_WEBHOOK_SECRET` matches GitHub settings
- Check webhook payload is sent as JSON
- Ensure signature verification logic is correct

### "Build failing on Vercel"

**Solution:**
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run type-check

# Verify all env vars are set in Vercel
vercel env ls
```

### "Posts not syncing"

**Solution:**
1. Check webhook delivery in GitHub
2. View logs: `vercel logs --filter=sync`
3. Verify database has posts: `psql $POSTGRES_URL`
4. Test manual sync: `npm run sync`

---

## Next Steps by Experience Level

### Beginner Developer

**Start with:**
1. Read [README.md](./README.md) completely
2. Follow Quick Start above
3. Build Phase 1 from [IMPLEMENTATION.md](./IMPLEMENTATION.md)
4. Deploy basic version
5. Iterate and improve

**Resources:**
- Next.js tutorial: [nextjs.org/learn](https://nextjs.org/learn)
- TypeScript handbook: [typescriptlang.org](https://www.typescriptlang.org/docs/)
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)

### Intermediate Developer

**Start with:**
1. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Set up project structure
3. Build Phases 1-4 in parallel
4. Focus on best practices
5. Add comprehensive error handling

**Consider:**
- Adding tests from the start
- Implementing CI/CD
- Using ORM (Drizzle/Prisma)

### Advanced Developer

**Start with:**
1. Review all documentation
2. Customize architecture for your needs
3. Build all phases efficiently
4. Add advanced features (search, caching)
5. Optimize for scale

**Consider:**
- Multi-tenancy
- Advanced caching strategies
- Custom build pipeline
- Monitoring and observability

---

## Working with Claude Code

This project is designed to work seamlessly with Claude Code. Here's how:

### Setting Up with Claude Code

```bash
# Navigate to your project
cd my-cms

# Copy these docs into your project
cp -r /path/to/docs ./docs

# Start Claude Code
claude
```

### Example Prompts for Claude Code

**Initial Setup:**
```
"Set up the database schema from docs/DATABASE.md and create the init-db.ts script"
```

**Building Features:**
```
"Implement the markdown parser according to docs/TECH_STACK.md, using the unified/remark/rehype pipeline"
```

**API Development:**
```
"Create the webhook endpoint at /api/sync-content following the spec in docs/API.md"
```

**Debugging:**
```
"Help me debug why posts aren't syncing - check the webhook handler and sync logic"
```

### Documentation References

When working with Claude Code, reference specific docs:
- "Follow the implementation plan in docs/IMPLEMENTATION.md"
- "Use the database queries from docs/DATABASE.md"
- "Implement the API spec from docs/API.md"

---

## Key Concepts to Understand

### 1. Why Git + Database?

**Problem:** Traditional static site generators are slow with many posts

**Solution:** Parse once, store in database, query fast

**Benefits:**
- Fast builds (always < 2 min)
- Instant queries
- Version control (Git)
- No SaaS costs

### 2. How Sync Works

```
Git Push → Webhook → Parse MD → Store in DB → ISR Revalidation
```

1. Writer pushes markdown to Git
2. GitHub sends webhook to your API
3. API fetches and parses changed files
4. Content stored in Postgres
5. Next.js pages revalidate automatically

### 3. ISR (Incremental Static Regeneration)

- Pages are statically generated
- Revalidate on-demand or by time
- Best of both worlds (static + dynamic)

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

### 4. Database Schema

**Core tables:**
- `posts` - Blog posts
- `authors` - Author info
- `tags` - Tag definitions
- `post_tags` - Many-to-many relationship

**Key indexes:**
- Slug (unique, for lookups)
- Published date (for sorting)
- Status (for filtering)

---

## Success Checklist

### MVP Complete When:

- [ ] Database schema created
- [ ] Can parse markdown files
- [ ] Webhook endpoint working
- [ ] GitHub webhook configured
- [ ] Posts sync to database
- [ ] Blog pages render posts
- [ ] Site deployed to Vercel
- [ ] Custom domain configured (optional)

### Production Ready When:

- [ ] All features implemented
- [ ] Error handling complete
- [ ] Performance optimized
- [ ] SEO configured
- [ ] Analytics added
- [ ] Documentation updated
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## Getting Help

### Documentation

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for design questions
- Check [API.md](./API.md) for API reference
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deploy issues

### Common Issues

See Troubleshooting sections in:
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [IMPLEMENTATION.md](./IMPLEMENTATION.md)

### Community

- Next.js Discord: [nextjs.org/discord](https://nextjs.org/discord)
- Vercel Discord: [vercel.com/discord](https://vercel.com/discord)

---

## What Makes This Different?

### vs Traditional Static Site Generators

| Feature | SSG | This CMS |
|---------|-----|----------|
| Build time | Scales with posts | Constant |
| Content source | Files | Files → DB |
| Query speed | File parsing | SQL queries |
| Search | Build-time index | Database FTS |

### vs SaaS Headless CMS

| Feature | SaaS CMS | This CMS |
|---------|----------|----------|
| Cost | $$ monthly | $ one-time |
| Content storage | Proprietary | Git (portable) |
| Control | Limited | Complete |
| Customization | Limited | Unlimited |

### vs File-Only Approach

| Feature | Files Only | This CMS |
|---------|------------|----------|
| Build time | Slow (1000+ posts) | Fast (any # posts) |
| Queries | File parsing | Database |
| Search | Limited | Full-text |
| Relations | Complex | Native SQL |

---

## Final Tips

### Do's

✅ Start simple, iterate
✅ Test webhook locally (use ngrok)
✅ Commit early, commit often
✅ Use TypeScript strictly
✅ Follow the phases in order
✅ Read error messages carefully
✅ Keep docs updated

### Don'ts

❌ Don't skip database indexes
❌ Don't commit secrets (.env files)
❌ Don't over-engineer early
❌ Don't ignore TypeScript errors
❌ Don't skip error handling
❌ Don't forget to test webhooks
❌ Don't deploy without testing

---

## Ready to Build?

1. **Copy this documentation** to your project
2. **Pick your path** (Rapid vs Production)
3. **Start with Phase 1** from [IMPLEMENTATION.md](./IMPLEMENTATION.md)
4. **Use Claude Code** to help implement
5. **Deploy early** and iterate

### First Command

```bash
npx create-next-app@latest my-cms --typescript --tailwind --app
cd my-cms
# Copy these docs
# Start building!
```

---

## Questions?

Review the specific documentation:
- Architecture → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Setup → [DEPLOYMENT.md](./DEPLOYMENT.md)
- Building → [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- Content → [CONTENT_FORMAT.md](./CONTENT_FORMAT.md)

**Good luck building your CMS!** 🚀
