# heXcms Implementation Tasks

> Master task tracker for the Git-based Headless CMS project

**Last Updated:** 2025-01-15
**Status:** In Progress - Phase 2 Complete
**Overall Progress:** 8/39 tasks (20.5%)

---

## Quick Status

| Phase | Status | Tasks | Progress |
|-------|--------|-------|----------|
| Phase 1: Core Infrastructure | ✅ Complete | 4/4 | 100% |
| Phase 2: Sync Service | ✅ Complete | 4/4 | 100% |
| Phase 3: Webhook Handler | ⬜ Not Started | 0/3 | 0% |
| Phase 4: Content Rendering | ⬜ Not Started | 0/4 | 0% |
| Phase 5: Additional Features | ⬜ Not Started | 0/5 | 0% |
| Phase 6: Optimization & Polish | ⬜ Not Started | 0/6 | 0% |
| Phase 7: Advanced Features | ⬜ Not Started | 0/5 | 0% |
| Phase 8: Security & Vulnerability Assessment | ⬜ Not Started | 0/8 | 0% |

**Legend:** ✅ Complete | ⏳ In Progress | ⬜ Not Started

---

## Phase 1: Core Infrastructure ✅ COMPLETE

**Goal:** Set up the foundational project structure and database

**Completed:** 2025-01-15

### 1.1 Project Setup ✅
- [x] Create Next.js 16 project with TypeScript
- [x] Configure Tailwind CSS
- [x] Set up Git repository
- [x] Install core dependencies (@vercel/postgres, gray-matter, zod, unified, remark, rehype)
- [x] Configure ESLint and TypeScript strict mode
- [x] Configure Prettier and EditorConfig
- [x] Set up Vitest testing framework
- [x] Create foundation files (.gitignore, LICENSE, SECURITY.md, CODE_OF_CONDUCT.md, .nvmrc)
- [x] Create GitHub templates (issue templates, PR template)
- [x] Configure security headers in next.config.js

**Status:** ✅ Complete

---

### 1.2 Database Schema ✅
- [x] Create PostgreSQL 16 database setup with Docker Compose
- [x] Write initialization script (`scripts/init-db.sql`)
- [x] Create all database tables (posts, authors, tags, post_tags, pages, sync_logs)
- [x] Add database indexes for performance (including GIN index for full-text search)
- [x] Define TypeScript types for database models (`src/types/index.ts`)
- [x] Create database query utilities (`src/lib/db.ts` with placeholders)
- [x] Implement full-text search with weighted tsvector
- [x] Add triggers for automatic timestamp updates
- [x] Include sample data (1 author, 5 tags)

**Status:** ✅ Complete

**Reference:** `docs/reference/database.md`, `scripts/init-db.sql`

---

### 1.3 Environment Configuration ✅
- [x] Create comprehensive `.env.example` template
- [x] Document all required environment variables
- [x] Configure environment variables (GitHub, Database, Secrets, Analytics, etc.)
- [x] Create Zod schemas for validation (`src/lib/validation.ts`)
- [x] Add environment documentation in deployment guide

**Status:** ✅ Complete

**Reference:** `docs/guides/deployment.md`, `.env.example`

---

### 1.4 Content Repository Setup ✅
- [x] Create content directory structure (content/posts/, content/authors/, content/pages/)
- [x] Set up directory structure with templates/
- [x] Create example markdown files (hello-world post, john-doe author, about page)
- [x] Document frontmatter structure in content format guide
- [x] Create content templates (post-template.md, author-template.md)
- [x] Create comprehensive content README with contribution guidelines

**Status:** ✅ Complete

**Reference:** `docs/reference/content-format.md`, `content/README.md`

---

### Additional Phase 1 Deliverables ✅

**Architecture Decision Records (ADR):**
- [x] Create ADR structure and template
- [x] ADR-001: Use Next.js 14 as Framework
- [x] ADR-002: Use PostgreSQL Over MongoDB
- [x] ADR-003: Git-Based Content Management
- [x] ADR-004: Deploy to Vercel Platform
- [x] ADR-005: Database Sync Strategy

**Operational Documentation:**
- [x] Create comprehensive operational runbook (`docs/guides/runbook.md`)
- [x] Document common operations and deployment procedures
- [x] Document database maintenance and optimization
- [x] Document debugging and troubleshooting procedures
- [x] Document incident response playbooks
- [x] Document backup and recovery procedures
- [x] Document monitoring and alerting setup

**Project Structure:**
- [x] Create complete TypeScript type definitions
- [x] Create placeholder library files with TODO comments
- [x] Create API routes (health check, webhook endpoint)
- [x] Create component organization guidelines
- [x] Set up testing infrastructure with example tests

**Documentation Updates:**
- [x] Update CHANGELOG.md with v0.2.0 release notes
- [x] Update README.md with quick start and status
- [x] Update documentation links and structure

---

## Phase 2: Sync Service ✅ COMPLETE

**Goal:** Build core sync functionality to parse markdown and sync to database

**Completed:** 2025-01-15

### 2.1 Markdown Parser ✅
- [x] Install markdown dependencies (unified, remark, rehype) - Already installed in Phase 1
- [x] Create markdown processor (`src/lib/markdown.ts`)
- [x] Implement frontmatter parsing with gray-matter and Zod validation
- [x] Implement markdown to HTML conversion with unified/remark/rehype
- [x] Add syntax highlighting for code blocks with rehype-highlight
- [x] Calculate reading time (200 words per minute)
- [x] Extract headings for table of contents (H2 and H3)
- [x] Implement excerpt extraction
- [x] Implement slugify utility
- [x] Comprehensive test suite (74 tests, all passing)

**Status:** ✅ Complete

**Files:** `src/lib/markdown.ts`, `src/lib/markdown.test.ts`

---

### 2.2 GitHub Integration ✅
- [x] Install @octokit/rest
- [x] Create GitHub API integration (`src/lib/sync.ts`)
- [x] Implement file fetching from GitHub with Octokit
- [x] Add webhook signature verification with HMAC SHA-256
- [x] Implement changed files detection from webhook payload
- [x] Add error handling with comprehensive logging
- [x] Implement timing-safe signature comparison

**Status:** ✅ Complete

**Files:** `src/lib/sync.ts`, `src/lib/sync.test.ts`

---

### 2.3 Database Operations ✅
- [x] Create database client wrapper (`src/lib/db.ts`)
- [x] Implement post queries (15 functions)
  - getPosts with filtering, pagination, sorting
  - getPostBySlug with author and tags
  - getFeaturedPosts
  - searchPosts with full-text search
  - getPostsByTag / getPostsByAuthor
  - incrementPostViews
- [x] Implement author queries (2 functions)
  - getAuthors, getAuthorBySlug
- [x] Implement tag queries (3 functions)
  - getTags, getTagBySlug, getTagsForPost
- [x] Implement page queries (2 functions)
  - getPages, getPageBySlug
- [x] Add upsert functions in sync module
- [x] Use connection pooling (via Vercel Postgres)
- [x] Comprehensive test suite (41 tests, all passing)

**Status:** ✅ Complete

**Files:** `src/lib/db.ts`, `src/lib/db.test.ts`

---

### 2.4 Sync Orchestration ✅
- [x] Create sync orchestrator (`src/lib/sync.ts`)
- [x] Implement incremental sync logic (processWebhook)
- [x] Implement file processing (added/modified/deleted)
- [x] Add sync validation with Zod schemas
- [x] Implement error recovery with isolated file processing
- [x] Add sync logging to sync_logs table
- [x] Implement upsert operations for posts, authors, pages
- [x] Implement tag syncing for posts (find-or-create pattern)
- [x] Comprehensive test suite (34 tests, all passing)

**Status:** ✅ Complete

**Files:** `src/lib/sync.ts`, `src/lib/sync.test.ts`

---

### Additional Phase 2 Deliverables ✅

**Test Coverage:**
- [x] 149 total tests across 3 test files
- [x] All tests passing (0 failures)
- [x] Markdown processor: 74 tests
- [x] Database queries: 41 tests
- [x] Sync engine: 34 tests
- [x] Proper mocking of external dependencies
- [x] Edge case coverage
- [x] Error handling validation

**Code Quality:**
- [x] Full TypeScript type safety
- [x] Comprehensive JSDoc documentation
- [x] Zero TypeScript errors
- [x] All TODO comments removed
- [x] Production-ready code quality

---

## Phase 3: Webhook Handler (Week 2-3)

**Goal:** Create API endpoint to receive GitHub webhooks

### 3.1 Webhook Endpoint
- [ ] Create webhook route (`src/app/api/sync-content/route.ts`)
- [ ] Implement signature verification
- [ ] Parse GitHub webhook payload
- [ ] Trigger sync for changed files
- [ ] Return appropriate status codes
- [ ] Add comprehensive error handling

**Status:** ⬜ Not Started

**Reference:** `docs/reference/api.md`

---

### 3.2 Webhook Configuration
- [ ] Generate webhook secret
- [ ] Deploy to Vercel
- [ ] Configure GitHub webhook in repository
- [ ] Test webhook delivery
- [ ] Verify sync functionality
- [ ] Monitor webhook logs

**Status:** ⬜ Not Started

**Reference:** `docs/guides/deployment.md`

---

### 3.3 Manual Sync Tools
- [ ] Create manual sync script (`scripts/manual-sync.ts`)
- [ ] Add manual sync API endpoint (optional)
- [ ] Implement dry-run mode
- [ ] Add progress reporting

**Status:** ⬜ Not Started

---

## Phase 4: Content Rendering (Week 3-4)

**Goal:** Build Next.js pages to display content from database

### 4.1 Blog Listing Page
- [ ] Create blog index page (`src/app/blog/page.tsx`)
- [ ] Query posts from database
- [ ] Implement post card component
- [ ] Add pagination
- [ ] Configure ISR (revalidate: 60)
- [ ] Style with Tailwind CSS

**Status:** ⬜ Not Started

**Reference:** `docs/architecture/project-structure.md`

---

### 4.2 Individual Post Page
- [ ] Create post page (`src/app/blog/[slug]/page.tsx`)
- [ ] Implement generateStaticParams
- [ ] Fetch post by slug with author and tags
- [ ] Render markdown content
- [ ] Display metadata (author, date, reading time)
- [ ] Add syntax highlighting styles
- [ ] Configure ISR

**Status:** ⬜ Not Started

---

### 4.3 Components
- [ ] Create PostCard component
- [ ] Create PostHeader component
- [ ] Create PostContent component
- [ ] Create PostMeta component
- [ ] Create TagList component
- [ ] Install @tailwindcss/typography
- [ ] Style all components

**Status:** ⬜ Not Started

**Reference:** `docs/architecture/project-structure.md`

---

### 4.4 SEO & Metadata
- [ ] Implement generateMetadata for posts
- [ ] Add Open Graph images
- [ ] Create sitemap (`src/app/sitemap.ts`)
- [ ] Add structured data (JSON-LD)
- [ ] Configure meta descriptions

**Status:** ⬜ Not Started

---

## Phase 5: Additional Features (Week 4-5)

**Goal:** Add tag filtering, search, and other enhancements

### 5.1 Tag Filtering
- [ ] Create tag page (`src/app/blog/tag/[tag]/page.tsx`)
- [ ] Implement tag query
- [ ] Display posts by tag
- [ ] Add tag navigation
- [ ] Create tags listing page

**Status:** ⬜ Not Started

---

### 5.2 Author Pages
- [ ] Create author page (`src/app/authors/[slug]/page.tsx`)
- [ ] Display author bio and avatar
- [ ] List posts by author
- [ ] Add social links
- [ ] Create authors listing page

**Status:** ⬜ Not Started

---

### 5.3 Search Functionality
- [ ] Implement database full-text search
- [ ] Create search page (`src/app/search/page.tsx`)
- [ ] Add search bar component
- [ ] Implement search results page
- [ ] Add search highlighting

**Status:** ⬜ Not Started

**Reference:** `docs/reference/database.md`

---

### 5.4 Related Posts
- [ ] Implement related posts query (based on shared tags)
- [ ] Add RelatedPosts component
- [ ] Display on post pages
- [ ] Configure display limit

**Status:** ⬜ Not Started

---

### 5.5 RSS Feed
- [ ] Create RSS feed route (`src/app/blog/rss.xml/route.ts`)
- [ ] Generate valid RSS XML
- [ ] Include latest posts
- [ ] Add to site header

**Status:** ⬜ Not Started

---

## Phase 6: Optimization & Polish (Week 5-6)

**Goal:** Optimize performance and add finishing touches

### 6.1 Performance
- [ ] Add database indexes (already in schema)
- [ ] Optimize images with next/image
- [ ] Implement lazy loading
- [ ] Add loading states and skeletons
- [ ] Analyze and optimize bundle size
- [ ] Implement caching strategies

**Status:** ⬜ Not Started

---

### 6.2 SEO & GEO (Generative Engine Optimization)

**Traditional SEO:**
- [ ] Create opengraph-image.tsx for posts
- [ ] Implement SEO utilities
- [ ] Add robots.txt
- [ ] Create XML sitemap
- [ ] Verify all meta tags
- [ ] Test with SEO tools (Google Search Console, Ahrefs, etc.)

**Generative Engine Optimization (GEO):**
- [ ] Implement comprehensive structured data (JSON-LD)
  - Article schema for blog posts
  - Person schema for authors
  - Organization schema
  - BreadcrumbList schema
- [ ] Add citation and source metadata
  - Cite external sources properly
  - Add author credentials/bio
  - Include publication dates
- [ ] Optimize content for AI understanding
  - Clear hierarchical headings (H1-H6)
  - Concise summaries/excerpts
  - Key facts in lists/tables
  - Semantic HTML5 elements
- [ ] Add FAQ schema for common questions
- [ ] Implement HowTo schema for tutorials
- [ ] Add statistical data with proper context
- [ ] Create content snippets optimized for AI citations
- [ ] Add "lastModified" timestamps
- [ ] Implement author authority markers
  - Author bio with expertise
  - Social proof links
  - Credentials/certifications
- [ ] Test with AI search engines
  - Perplexity.ai
  - ChatGPT search
  - Bing Chat
  - Google SGE

**Status:** ⬜ Not Started

**Reference:** `docs/guides/geo-optimization.md` (to be created)

---

### 6.3 Analytics
- [ ] Install @vercel/analytics
- [ ] Install @vercel/speed-insights
- [ ] Add to root layout
- [ ] Configure tracking
- [ ] Set up custom events (optional)

**Status:** ⬜ Not Started

**Reference:** `docs/reference/tech-stack.md`

---

### 6.4 Error Handling
- [ ] Create error.tsx (global error boundary)
- [ ] Create not-found.tsx (global 404)
- [ ] Create blog/[slug]/not-found.tsx (post not found)
- [ ] Add user-friendly error messages
- [ ] Implement error logging

**Status:** ⬜ Not Started

---

### 6.5 Testing
- [ ] Write unit tests for markdown processor
- [ ] Write unit tests for sync logic
- [ ] Write integration tests for API endpoints
- [ ] Test database queries
- [ ] E2E tests (optional - Playwright)

**Status:** ⬜ Not Started

**Reference:** `docs/development/testing.md`

---

### 6.6 Documentation
- [ ] Update all documentation
- [ ] Add code comments
- [ ] Create usage examples
- [ ] Document deployment process
- [ ] Create troubleshooting guide

**Status:** ⬜ Not Started

---

## Phase 7: Advanced Features (Optional)

**Goal:** Add nice-to-have features

### 7.1 Draft Preview Mode
- [ ] Create preview enable endpoint (`src/app/api/preview/route.ts`)
- [ ] Create preview disable endpoint
- [ ] Implement draftMode() in posts
- [ ] Add preview banner
- [ ] Test preview functionality

**Status:** ⬜ Not Started

**Reference:** `docs/reference/api.md`

---

### 7.2 On-Demand Revalidation
- [ ] Create revalidation endpoint (`src/app/api/revalidate/route.ts`)
- [ ] Implement secret authentication
- [ ] Add path revalidation
- [ ] Integrate with webhook handler
- [ ] Test revalidation

**Status:** ⬜ Not Started

---

### 7.3 Comments System
- [ ] Choose comment system (Giscus, Utterances, etc.)
- [ ] Install and configure
- [ ] Add to post pages
- [ ] Style comments section

**Status:** ⬜ Not Started

---

### 7.4 Newsletter Integration
- [ ] Choose newsletter service (ConvertKit, Resend, etc.)
- [ ] Create signup form component
- [ ] Implement API endpoint
- [ ] Add to footer/posts
- [ ] Test integration

**Status:** ⬜ Not Started

---

### 7.5 View Counter
- [ ] Implement view count increment
- [ ] Add to database queries
- [ ] Display on post pages
- [ ] Create popular posts page

**Status:** ⬜ Not Started

---

## Phase 8: Security & Vulnerability Assessment (Week 6-7)

**Goal:** Ensure the CMS is secure and vulnerability-free before production deployment

### 8.1 Code Security Implementation

- [ ] Implement SQL injection prevention
  - Use parameterized queries throughout (`src/lib/db.ts`)
  - Verify no string concatenation in SQL queries
  - Add input validation with Zod schemas
  - Test with malicious inputs
- [ ] Implement XSS protection
  - Configure Content Security Policy headers (`middleware.ts`)
  - Sanitize all user-generated content
  - Review all uses of `dangerouslySetInnerHTML`
  - Test with malicious scripts
- [ ] Implement CSRF protection
  - Add origin verification to POST endpoints
  - Implement SameSite cookie attributes
  - Add CSRF tokens for state-changing operations
- [ ] Implement authentication security
  - Use timing-safe comparison for webhook signatures
  - Implement HMAC verification correctly
  - Add rate limiting to authentication endpoints
  - Secure admin endpoints with authentication

**Status:** ⬜ Not Started

**Reference:** `docs/guides/security.md` (sections 1-4)

---

### 8.2 Configuration Security

- [ ] Secure environment variables
  - Move all secrets to environment variables
  - Verify `.env.local` is in `.gitignore`
  - Create `.env.example` with placeholders
  - Add environment validation at startup (`src/lib/env.ts`)
- [ ] Configure security headers
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy
  - Strict-Transport-Security (HSTS)
- [ ] Implement rate limiting
  - Add rate limiting to webhook endpoint
  - Add rate limiting to search endpoint
  - Add rate limiting to sync endpoint
  - Configure Upstash Redis for rate limiting
- [ ] Configure CORS properly
  - Restrict CORS origins (not wildcard *)
  - Verify webhook endpoint only accepts GitHub

**Status:** ⬜ Not Started

**Reference:** `docs/guides/security.md` (sections 5-7)

---

### 8.3 Dependency Security

- [ ] Audit and update dependencies
  - Run `npm audit` and fix all high/critical issues
  - Update all outdated packages (`npm outdated`)
  - Enable Dependabot on GitHub
  - Review all dependency licenses
  - Remove unused dependencies
- [ ] Set up automated security scanning
  - Enable GitHub security alerts
  - Configure Dependabot for automatic PRs
  - Set up npm audit checks in CI
  - Add Snyk or similar scanning tool (optional)

**Status:** ⬜ Not Started

**Reference:** `docs/guides/security.md` (section 8)

---

### 8.4 Database Security

- [ ] Implement database security best practices
  - Verify SSL/TLS connections to database
  - Set up minimal database user privileges
  - Enable and verify database backups
  - Configure connection pooling limits
  - Test backup restoration procedure
- [ ] Add security logging
  - Log failed authentication attempts
  - Log rate limit triggers
  - Log database errors (without sensitive data)
  - Implement structured JSON logging
  - Configure log rotation

**Status:** ⬜ Not Started

**Reference:** `docs/guides/security.md` (sections 9-10)

---

### 8.5 Security Testing

- [ ] Write automated security tests
  - SQL injection tests (`tests/security/sql-injection.test.ts`)
  - XSS protection tests
  - Webhook signature verification tests
  - Input validation tests
  - CSRF protection tests
- [ ] Perform manual security testing
  - Test SQL injection manually with malicious slugs
  - Test XSS with script injection attempts
  - Test webhook without valid signature
  - Test rate limiting by exceeding thresholds
  - Test HTTPS redirect
- [ ] Run security scanning tools
  - OWASP ZAP baseline scan
  - Lighthouse security audit
  - Check for exposed secrets with secretlint
  - Schema validator for structured data
  - Burp Suite scan (optional)

**Status:** ⬜ Not Started

**Reference:** `docs/guides/security.md` (section 14)

---

### 8.6 Security Audit

- [ ] Complete security checklist audit
  - Work through `docs/guides/security-checklist.md`
  - Document all findings
  - Verify all 65 checklist items
  - Create remediation plan for failures
- [ ] Review and fix critical issues
  - Address all critical severity issues
  - Address all high severity issues
  - Document medium/low issues
  - Create timeline for remaining fixes
- [ ] Validate security implementations
  - Test webhook signature verification
  - Test rate limiting functionality
  - Test input validation on all endpoints
  - Verify CSP headers are set
  - Test error handling doesn't leak info

**Status:** ⬜ Not Started

**Reference:** `docs/guides/security-checklist.md`

---

### 8.7 Monitoring & Incident Response

- [ ] Set up security monitoring
  - Configure uptime monitoring (Vercel, UptimeRobot)
  - Set up error tracking (Sentry, LogRocket)
  - Enable GitHub security alerts
  - Monitor webhook delivery failures
  - Set up alerting for security events
- [ ] Document incident response plan
  - Define incident severity levels
  - Identify incident response team
  - Document communication procedures
  - Test backup restoration
  - Create incident response playbook

**Status:** ⬜ Not Started

**Reference:** `docs/guides/security.md` (sections 11-13)

---

### 8.8 Deployment Security

- [ ] Secure production deployment
  - Verify `NODE_ENV=production` in Vercel
  - Disable source maps in production
  - Verify HTTPS is enforced
  - Check `robots.txt` doesn't expose sensitive paths
  - Verify all environment variables are set
  - Test deployment with security headers
- [ ] Create security documentation
  - Create `SECURITY.md` in repository root
  - Document security reporting process
  - Document security contact information
  - Add security section to README
  - Update CHANGELOG with security implementations

**Status:** ⬜ Not Started

**Reference:** `docs/guides/security.md` (section 12)

---

## Success Criteria

### MVP Complete
- [x] Database schema created and initialized ✅
- [x] Markdown parsing works correctly ✅
- [ ] GitHub webhook configured and working
- [ ] Posts sync to database automatically
- [ ] Blog pages render posts correctly
- [ ] Site deployed to Vercel
- [ ] Basic styling complete

### Production Ready
- [ ] All core features implemented (Phases 1-6)
- [ ] Error handling complete
- [ ] Performance optimized (Lighthouse > 90)
- [ ] SEO & GEO configured
- [ ] Analytics tracking
- [ ] Documentation complete
- [ ] Testing coverage adequate
- [ ] Security audit passed (Phase 8)
- [ ] All critical/high vulnerabilities fixed
- [ ] Security monitoring enabled

---

## Development Guidelines

### Working on Tasks
1. Mark task as in-progress when starting
2. Reference relevant documentation
3. Commit changes frequently
4. Test thoroughly before marking complete
5. Update this file regularly

### Using with Rapid Dev Agent
- This file tracks high-level progress
- Use `project-tasks.md` for detailed current sprint tasks
- Agent reads from `project-tasks.md` for implementation details
- Update both files as work progresses

### Blocked Tasks
If blocked, note it here:
- Task name: Reason for blockage
- Task name: Dependencies needed

---

## Timeline Estimates

- **Week 1-2:** Phases 1-3 (MVP Foundation)
- **Week 3-4:** Phase 4-5 (Content & Features)
- **Week 5-6:** Phase 6 (Polish & Optimization)
- **Week 6-7:** Phase 8 (Security & Vulnerability Assessment)
- **Week 7+:** Phase 7 (Optional Advanced Features)

**Target MVP:** 3-4 weeks
**Target Production-Ready (including security):** 6-7 weeks

---

## Resources

- **Documentation:** `docs/README.md`
- **Architecture:** `docs/architecture/overview.md`
- **Implementation Guide:** `docs/development/implementation-roadmap.md`
- **Quick Reference:** `docs/guides/quick-reference.md`
- **API Docs:** `docs/reference/api.md`
- **Database Schema:** `docs/reference/database.md`
- **Security Guide:** `docs/guides/security.md`
- **Security Checklist:** `docs/guides/security-checklist.md`
- **GEO Guide:** `docs/guides/geo-optimization.md`

---

## Notes

- Update this file after completing each task
- Link to relevant commits in task descriptions
- Track blockers and dependencies
- Review progress weekly
- Celebrate milestones!

---

**Last Review:** 2025-01-15
**Next Review:** After Phase 2 completion
