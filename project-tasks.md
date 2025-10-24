# heXcms Project Tasks

> This file tracks development tasks for the Git-based Headless CMS.
> Tasks are read by the Rapid Development Agent (see `.claude/rapid-dev-workflow.md`)

**Last Updated:** 2025-10-23

---

## 🎯 Current Sprint

### Active Phase: Project Initialization

**Goal:** Set up the foundational structure and core dependencies

---

## 📋 Task List

### Phase 1: Project Foundation

#### 1.1 Project Setup
- [ ] Initialize Next.js project with TypeScript
  - Use `npx create-next-app@latest` with App Router
  - Enable TypeScript, ESLint, Tailwind CSS
  - Configure `src/` directory structure
- [ ] Install core dependencies
  - Database client (pg for Postgres or better-sqlite3)
  - Markdown parsing (gray-matter, remark, rehype)
  - Utility libraries (date-fns, etc.)
- [ ] Configure TypeScript
  - Set up path aliases (@/ for src/)
  - Configure strict mode
  - Add types directory
- [ ] Set up ESLint and Prettier
  - Configure rules based on docs/reference/tech-stack.md
  - Add pre-commit hooks (optional)

#### 1.2 Environment Configuration
- [ ] Create .env.example template
  - Database connection string
  - GitHub webhook secret
  - Content repository URL
- [ ] Set up environment validation
  - Create lib/env.ts for type-safe env vars
  - Validate required variables on startup

#### 1.3 Database Setup
- [ ] Create database schema (see docs/reference/database.md)
  - posts table
  - authors table
  - tags table
  - post_tags junction table
- [ ] Write migration scripts
  - scripts/db-init.sql
  - scripts/db-migrate.ts
- [ ] Create database client wrapper
  - src/lib/db.ts
  - Connection pooling
  - Error handling

---

### Phase 2: Core Sync Functionality

#### 2.1 Markdown Parser
- [ ] Create markdown parsing module
  - src/lib/markdown/parser.ts
  - Extract frontmatter using gray-matter
  - Parse markdown to HTML
  - Calculate reading time
  - Extract headings for TOC

#### 2.2 Git Content Fetcher
- [ ] Implement Git file fetching
  - src/lib/git/fetcher.ts
  - Fetch files from GitHub API
  - Handle authentication
  - Parse directory structure
- [ ] Add caching layer
  - Cache parsed markdown
  - Invalidate on sync

#### 2.3 Sync Service
- [ ] Build sync orchestrator
  - src/lib/sync/orchestrator.ts
  - Identify changed files
  - Parse markdown content
  - Update database records
  - Handle deletes
- [ ] Add sync validation
  - Verify frontmatter completeness
  - Check required fields
  - Log sync errors

---

### Phase 3: API Endpoints

#### 3.1 Webhook Endpoint
- [ ] Create webhook handler (see docs/reference/api.md)
  - POST /api/webhook
  - Verify GitHub signature
  - Parse webhook payload
  - Trigger sync for changed files
  - Return appropriate status codes
- [ ] Add webhook security
  - Signature verification
  - Rate limiting
  - Error handling

#### 3.2 Content API
- [ ] Create content query endpoints
  - GET /api/posts - List all posts
  - GET /api/posts/[slug] - Get single post
  - GET /api/posts/tag/[tag] - Posts by tag
  - GET /api/authors/[slug] - Author details
- [ ] Add query parameters
  - Pagination (limit, offset)
  - Sorting (date, title)
  - Filtering (status, tag)

#### 3.3 Manual Sync Endpoint
- [ ] Create admin sync endpoint
  - POST /api/sync/manual
  - Trigger full resync
  - Return sync status
  - Protect with auth (optional)

---

### Phase 4: Frontend Pages

#### 4.1 Blog Listing Page
- [ ] Create blog index page
  - src/app/blog/page.tsx
  - Query posts from database
  - Display post cards (title, excerpt, date)
  - Add pagination
- [ ] Style with Tailwind
  - Responsive grid layout
  - Card hover effects
  - Loading states

#### 4.2 Single Post Page
- [ ] Create post detail page
  - src/app/blog/[slug]/page.tsx
  - Fetch post by slug
  - Render markdown content
  - Display metadata (author, date, tags)
  - Add reading time
- [ ] Add syntax highlighting
  - Configure rehype-highlight or prism
  - Style code blocks
- [ ] Implement ISR
  - Set revalidate time
  - On-demand revalidation

#### 4.3 Tag Pages
- [ ] Create tag listing page
  - src/app/tags/page.tsx
  - List all tags with post counts
- [ ] Create tag detail page
  - src/app/tags/[tag]/page.tsx
  - Show posts for specific tag

#### 4.4 Author Pages
- [ ] Create author listing page
  - src/app/authors/page.tsx
  - List all authors
- [ ] Create author detail page
  - src/app/authors/[slug]/page.tsx
  - Author bio
  - Author's posts

---

### Phase 5: Search & Features

#### 5.1 Search Functionality
- [ ] Implement full-text search
  - Database query with LIKE or full-text search
  - src/app/search/page.tsx
  - Search form component
  - Results page with highlighting
- [ ] Add search API endpoint
  - GET /api/search?q=query
  - Return ranked results

#### 5.2 RSS Feed
- [ ] Generate RSS feed
  - src/app/feed.xml/route.ts
  - Include latest posts
  - Proper XML formatting

#### 5.3 Sitemap
- [ ] Generate sitemap
  - src/app/sitemap.xml/route.ts
  - Include all posts, tags, authors
  - Update on sync

---

### Phase 6: Testing & Optimization

#### 6.1 Testing
- [ ] Write unit tests
  - Markdown parser tests
  - Sync logic tests
  - Database query tests
- [ ] Write integration tests
  - API endpoint tests
  - Webhook handler tests
- [ ] Write E2E tests (optional)
  - Page rendering tests
  - Search functionality

#### 6.2 Performance Optimization
- [ ] Database optimization
  - Add indexes (see docs/reference/database.md)
  - Optimize queries
  - Enable connection pooling
- [ ] Frontend optimization
  - Image optimization
  - Code splitting
  - Lazy loading

#### 6.3 SEO & GEO (Generative Engine Optimization)
- [ ] Implement traditional SEO
  - Meta tags and Open Graph
  - robots.txt and sitemap
  - SEO utilities module
- [ ] Implement GEO for AI search engines
  - JSON-LD structured data (Article, Person, Organization schemas)
  - Author authority markers with credentials
  - Citation and source metadata
  - FAQ schema for Q&A content
  - HowTo schema for tutorials
  - Semantic HTML5 throughout
  - Clear content hierarchy (H1-H6)
  - AI-optimized excerpts and summaries
- [ ] Test with AI search engines
  - Perplexity.ai
  - ChatGPT search
  - Bing Chat
  - Google SGE (Search Generative Experience)
- [ ] Validate structured data
  - Google Rich Results Test
  - Schema.org validator

**Reference:** `docs/guides/geo-optimization.md`

#### 6.4 Error Handling
- [ ] Add comprehensive error handling
  - Try-catch blocks
  - Error boundaries
  - User-friendly error pages
- [ ] Add logging
  - Sync operation logs
  - Error logs
  - Performance monitoring (optional)

---

### Phase 7: Security & Vulnerability Assessment

#### 7.1 Code Security Implementation (see docs/guides/security.md)
- [ ] Implement SQL injection prevention
  - Location: `src/lib/db.ts`, all API routes
  - Use parameterized queries throughout
  - Verify no string concatenation in SQL queries
  - Add input validation with Zod schemas
  - Test with malicious inputs (`'; DROP TABLE posts;--`)

- [ ] Implement XSS protection
  - Configure Content Security Policy headers
  - Location: Create `src/middleware.ts`
  - Headers to add:
    ```typescript
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff'
    ```
  - Sanitize markdown rendering output
  - Review all uses of `dangerouslySetInnerHTML`
  - Test with `<script>alert('xss')</script>`

- [ ] Implement CSRF protection
  - Add origin verification to all POST endpoints
  - Location: `src/app/api/webhook/route.ts`, `src/app/api/sync/*/route.ts`
  - Verify request origin header
  - Implement SameSite cookie attributes if using auth

- [ ] Implement webhook security
  - Location: `src/app/api/webhook/route.ts`
  - Use timing-safe comparison for signatures:
    ```typescript
    import { timingSafeEqual } from 'crypto';
    const isValid = timingSafeEqual(Buffer.from(sig1), Buffer.from(sig2));
    ```
  - Implement HMAC SHA-256 verification
  - Test with invalid signatures
  - Log all failed verification attempts

#### 7.2 Configuration Security
- [ ] Secure environment variables
  - Verify all secrets in `.env.local` (not in code)
  - Confirm `.env.local` in `.gitignore`
  - Update `.env.example` with all required vars
  - Create `src/lib/env.ts` for validation:
    ```typescript
    import { z } from 'zod';
    const envSchema = z.object({
      DATABASE_URL: z.string().url(),
      GITHUB_WEBHOOK_SECRET: z.string().min(32),
      GITHUB_TOKEN: z.string().min(40)
    });
    export const env = envSchema.parse(process.env);
    ```

- [ ] Configure security headers
  - Location: `next.config.js` or `src/middleware.ts`
  - Add all security headers per docs/guides/security.md
  - Test headers with: `curl -I https://yoursite.com`

- [ ] Implement rate limiting
  - Install Upstash Redis: `npm install @upstash/redis @upstash/ratelimit`
  - Create `src/lib/rate-limit.ts`
  - Apply to webhook endpoint (100 requests/10 minutes)
  - Apply to search endpoint (30 requests/minute)
  - Apply to manual sync endpoint (5 requests/hour)
  - Test by exceeding limits

#### 7.3 Dependency & Database Security
- [ ] Audit dependencies
  - Run `npm audit` and fix all high/critical
  - Run `npm outdated` and update packages
  - Enable Dependabot: Settings → Security → Dependabot alerts
  - Run weekly: `npx snyk test` (optional)

- [ ] Secure database connection
  - Verify connection string uses SSL: `?sslmode=require`
  - Configure connection pooling in `src/lib/db.ts`
  - Test database backups (Vercel Postgres)
  - Document restoration procedure

#### 7.4 Security Testing
- [ ] Write automated security tests
  - Create `src/tests/security/` directory
  - SQL injection test:
    ```typescript
    test('rejects SQL injection in slug', async () => {
      const res = await fetch('/api/posts/test; DROP TABLE posts;--');
      expect(res.status).toBe(400); // or 404, not 500
    });
    ```
  - XSS test, webhook signature test, rate limiting test
  - Run: `npm test -- security`

- [ ] Perform manual security testing
  - Test SQL injection in all input fields
  - Test XSS in markdown rendering
  - Test webhook without signature
  - Test rate limiting by exceeding thresholds
  - Verify HTTPS redirect: `curl -I http://yoursite.com`

- [ ] Run security scanning tools
  - OWASP ZAP: `docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yoursite.com`
  - Lighthouse: `npx lighthouse https://yoursite.com --only-categories=best-practices`
  - Secretlint: `npx secretlint "**/*"`

#### 7.5 Security Audit with Checklist
- [ ] Complete security checklist audit
  - Work through all 65 items in `docs/guides/security-checklist.md`
  - Document findings in audit summary section
  - Create remediation plan for all failures
  - Address all critical/high priority issues before deployment
  - Schedule next audit for 3 months after launch

#### 7.6 Monitoring & Incident Response
- [ ] Set up security monitoring
  - Configure uptime monitoring (Vercel Analytics or UptimeRobot)
  - Set up error tracking (Sentry: `npm install @sentry/nextjs`)
  - Enable GitHub security alerts (Settings → Security)
  - Create alerts for failed webhook verifications
  - Document monitoring dashboard access

- [ ] Create incident response plan
  - Create `SECURITY.md` in repository root
  - Document security contact email
  - Define severity levels (Critical/High/Medium/Low)
  - Document escalation procedures
  - Test backup restoration procedure
  - Create incident response playbook

**Reference:** `docs/guides/security.md`, `docs/guides/security-checklist.md`

---

### Phase 8: Deployment

#### 8.1 Vercel Setup (see docs/guides/deployment.md)
- [ ] Create Vercel project
  - Connect GitHub repository
  - Configure build settings
- [ ] Set up Vercel Postgres
  - Create database
  - Run migrations
  - Set environment variables
- [ ] Configure GitHub webhook
  - Add webhook URL
  - Set webhook secret
  - Test webhook delivery

#### 8.2 Custom Domain (Optional)
- [ ] Configure custom domain
  - Add domain in Vercel
  - Update DNS records
  - Enable SSL

---

## 🚀 Quick Actions

### For Rapid Development Agent

**To start Phase 1:**
```
Execute all tasks in Phase 1: Project Foundation
Follow the structure in docs/architecture/project-structure.md
Reference docs/reference/tech-stack.md for dependencies
```

**To implement sync service:**
```
Execute tasks in Phase 2: Core Sync Functionality
Reference docs/architecture/overview.md for sync flow
Use docs/reference/database.md for schema details
```

**To build API:**
```
Execute tasks in Phase 3: API Endpoints
Follow specifications in docs/reference/api.md
Implement error handling per examples
```

---

## 📝 Task Guidelines

### Task Format

Good task:
```markdown
- [ ] Create webhook handler
  - Location: src/app/api/webhook/route.ts
  - Verify GitHub signature using crypto
  - Parse webhook payload for changed files
  - Return 200 on success, 401 on invalid signature
```

Poor task:
```markdown
- [ ] Make webhook work
```

### Dependencies

Tasks within a phase should be completed in order:
1. Setup before implementation
2. Core logic before API
3. API before frontend
4. Frontend before testing
5. Testing before deployment

---

## 🔄 Sync Status

### Database
- [ ] Schema created
- [ ] Migrations run
- [ ] Sample data seeded

### Content Repository
- [ ] Repository configured
- [ ] Webhook set up
- [ ] Initial sync completed

### Deployment
- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] Domain configured

---

## 📊 Progress Tracker

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Phase 1: Foundation | 8 | 0 | 🔴 Not Started |
| Phase 2: Sync | 6 | 0 | 🔴 Not Started |
| Phase 3: API | 7 | 0 | 🔴 Not Started |
| Phase 4: Frontend | 9 | 0 | 🔴 Not Started |
| Phase 5: Features | 5 | 0 | 🔴 Not Started |
| Phase 6: Testing | 7 | 0 | 🔴 Not Started |
| Phase 7: Security | 6 | 0 | 🔴 Not Started |
| Phase 8: Deployment | 5 | 0 | 🔴 Not Started |

**Total:** 0/53 tasks completed (0%)

---

## 💡 Notes

### For the Rapid Development Agent
- Always check docs/architecture/project-structure.md for file locations
- Reference docs/architecture/overview.md to understand data flow
- Follow code patterns from docs/reference/tech-stack.md
- Use docs/reference/database.md for all database operations
- Implement API endpoints per docs/reference/api.md specifications

### Custom Modifications
Document any deviations from the original plan:
- [ ] Custom feature additions
- [ ] Architecture changes
- [ ] Dependency substitutions

---

## 🔗 Related Documentation

- [.claude/rapid-dev-workflow.md](./.claude/rapid-dev-workflow.md) - How to use this file with agents
- [IMPLEMENTATION.md](./docs/development/implementation-roadmap.md) - Detailed implementation guide
- [ARCHITECTURE.md](./docs/architecture/overview.md) - System architecture
- [API.md](./docs/reference/api.md) - API specifications
- [DATABASE.md](./docs/reference/database.md) - Database schema

---

**Ready to build! 🚀**

Update this file as you complete tasks. The Rapid Development Agent will read from this file for context and task execution.
