# Changelog

All notable changes to heXcms will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- None yet

### Changed
- None yet

---

## [0.3.0] - 2025-01-15

### Added - Sync Service & Data Processing (Phase 2)

#### Markdown Processing Library (`src/lib/markdown.ts`)
- **Frontmatter Parsing** with Zod validation
  - `parsePostFrontmatter()` - Parse and validate blog post frontmatter
  - `parseAuthorFrontmatter()` - Parse and validate author profiles
  - `parsePageFrontmatter()` - Parse and validate static pages
  - Type-safe validation with detailed error messages
- **Markdown to HTML Conversion**
  - `markdownToHtml()` - Full unified/remark/rehype pipeline
  - GitHub Flavored Markdown support (tables, strikethrough, task lists)
  - Syntax highlighting with rehype-highlight
  - Sanitized HTML output (no dangerous HTML allowed)
- **Content Utilities**
  - `calculateReadingTime()` - Reading time estimation (200 WPM)
  - `extractExcerpt()` - Smart excerpt generation from content
  - `extractTableOfContents()` - TOC extraction from H2/H3 headers
  - `slugify()` - URL-safe slug generation

#### Database Query Layer (`src/lib/db.ts`)
- **Post Queries** (8 functions)
  - `getPosts()` - Comprehensive filtering (status, author, tag, featured, search, pagination)
  - `getPostBySlug()` - Single post with author and tags
  - `getFeaturedPosts()` - Featured posts for homepage
  - `searchPosts()` - Full-text search with PostgreSQL tsvector
  - `getPostsByTag()` - Posts filtered by tag
  - `getPostsByAuthor()` - Posts by author
  - `incrementPostViews()` - Analytics tracking
- **Author Queries** (2 functions)
  - `getAuthors()` - All authors with post counts
  - `getAuthorBySlug()` - Single author with full profile
- **Tag Queries** (3 functions)
  - `getTags()` - All tags with post counts
  - `getTagBySlug()` - Single tag details
  - `getTagsForPost()` - Tags for specific post
- **Page Queries** (2 functions)
  - `getPages()` - All static pages
  - `getPageBySlug()` - Single page content
- **Database Health**
  - `testConnection()` - Connection validation and health checks

#### GitHub Integration & Sync Engine (`src/lib/sync.ts`)
- **Webhook Processing**
  - `processWebhook()` - Main webhook handler with error isolation
  - `verifyWebhookSignature()` - HMAC SHA-256 signature verification with timing-safe comparison
  - Isolated error handling (failures don't stop other files)
- **Content File Processing**
  - `processFile()` - Fetch and process single file from GitHub
  - `processDeletedFile()` - Handle content deletions
  - `fetchFileFromGitHub()` - Octokit-based file retrieval
  - `filterContentFiles()` - Content directory filtering
- **Database Upsert Operations**
  - `upsertPost()` - Insert/update posts with tag syncing
  - `upsertAuthor()` - Insert/update author profiles
  - `upsertPage()` - Insert/update static pages
  - Find-or-create pattern for authors and tags
- **Sync Tracking**
  - `logSync()` - Complete sync operation logging
  - Duration tracking and error reporting
- **Utilities**
  - `extractSlugFromPath()` - Extract slug from file paths
  - `getResourceTypeFromPath()` - Determine content type (post/author/page)

#### Comprehensive Test Suite
- **Markdown Tests** (`src/lib/markdown.test.ts`) - 74 tests
  - Frontmatter parsing (all content types)
  - Markdown to HTML conversion
  - Reading time calculation
  - Excerpt extraction
  - TOC generation
  - Slugify edge cases
  - Error handling and validation failures
- **Database Tests** (`src/lib/db.test.ts`) - 41 tests
  - All query functions with success scenarios
  - Pagination and filtering
  - Full-text search
  - Error handling
  - Proper mocking of @vercel/postgres
- **Sync Tests** (`src/lib/sync.test.ts`) - 34 tests
  - Webhook signature verification (timing-safe)
  - File processing and content extraction
  - Upsert operations
  - Error isolation
  - Proper mocking of @octokit/rest and database
- **Test Results**: 149 tests passing, 0 failures

### Technical Implementation Details
- **Dependencies Added**
  - `@octokit/rest@^22.0.0` - GitHub API integration
- **Security Features**
  - HMAC SHA-256 webhook signature verification
  - Timing-safe comparison for signatures (`crypto.timingSafeEqual`)
  - Sanitized HTML output from markdown (no dangerous HTML)
  - SQL injection protection via parameterized queries
- **Performance Optimizations**
  - Database upsert pattern (INSERT ... ON CONFLICT)
  - Efficient tag syncing (delete + bulk insert)
  - Full-text search with PostgreSQL tsvector
  - Isolated error handling in sync operations
- **Code Quality**
  - Comprehensive JSDoc documentation
  - TypeScript strict mode throughout
  - 100% test pass rate
  - Proper error messages and logging

### Infrastructure Ready
- ✅ Complete markdown processing pipeline
- ✅ Full database query layer with 15 functions
- ✅ GitHub webhook integration and sync orchestration
- ✅ 149 passing tests with comprehensive coverage
- ✅ Type-safe frontmatter validation
- ✅ Production-ready error handling

### Next Steps
- **Phase 3**: Implement Next.js API routes for webhooks
- **Phase 4**: Build content rendering and UI components
- **Phase 5**: Create post listing and detail pages
- **Phase 6**: Implement search and additional features

---

## [0.2.0] - 2025-01-15

### Added - Foundation & Infrastructure

#### Project Foundation Files
- `.gitignore` - Comprehensive ignore patterns for Node.js, Next.js, and IDE files
- `LICENSE` - MIT license for open source distribution
- `SECURITY.md` - Security vulnerability reporting process
- `CODE_OF_CONDUCT.md` - Contributor Covenant 2.1 community guidelines
- `.env.example` - Complete environment variable template
- `.nvmrc` - Node version specification (18.17.0)

#### GitHub Templates
- `.github/ISSUE_TEMPLATE/bug_report.md` - Structured bug report template
- `.github/ISSUE_TEMPLATE/feature_request.md` - Feature request template
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template with quality checklists
- `.github/FUNDING.yml` - Sponsorship configuration

#### Next.js Application Setup
- **Next.js 16.0.0** with App Router and React Server Components
- **React 19.2.0** with latest concurrent features
- **TypeScript** in strict mode for maximum type safety
- **Tailwind CSS** for utility-first styling
- **PostCSS** and **Autoprefixer** for CSS processing
- Security headers configured (HSTS, X-Frame-Options, CSP, etc.)
- Basic page layout (`src/app/layout.tsx`, `src/app/page.tsx`)

#### Core Dependencies Installed
- `@vercel/postgres` - PostgreSQL database client
- `gray-matter` - Frontmatter parsing
- `unified`, `remark`, `remark-gfm`, `rehype`, `rehype-highlight` - Markdown processing
- `zod` - Schema validation
- `date-fns` - Date utilities
- `vitest`, `@testing-library/react` - Testing framework

#### Database & Infrastructure
- `docker-compose.yml` - PostgreSQL 16 container for local development
- `scripts/init-db.sql` - Complete database schema (177 lines)
  - Tables: authors, tags, posts, post_tags, pages, sync_logs
  - Full-text search with weighted tsvector
  - Triggers for automatic timestamp updates
  - Sample data (1 author, 5 tags)
  - PostgreSQL extensions: uuid-ossp, pg_trgm

#### Sample Content Structure
- `content/posts/2024-01-15-hello-world.md` - Example blog post
- `content/authors/john-doe.md` - Example author profile
- `content/pages/about.md` - Example static page
- `content/templates/post-template.md` - Blog post template
- `content/templates/author-template.md` - Author profile template
- `content/README.md` - Content contribution guide

#### Architecture Decision Records (ADR)
- `docs/architecture/adr/README.md` - ADR index and guidelines
- `docs/architecture/adr/adr-template.md` - ADR template
- `docs/architecture/adr/001-use-nextjs-14.md` - Framework selection rationale
- `docs/architecture/adr/002-use-postgresql-over-mongodb.md` - Database choice
- `docs/architecture/adr/003-git-based-content.md` - Content management approach
- `docs/architecture/adr/004-deploy-to-vercel.md` - Hosting platform decision
- `docs/architecture/adr/005-database-sync-strategy.md` - Sync implementation strategy

#### Operational Documentation
- `docs/guides/runbook.md` - Comprehensive operational runbook (400+ lines)
  - Common operations and deployment procedures
  - Database maintenance and optimization
  - Debugging and troubleshooting guides
  - Performance optimization strategies
  - Incident response playbooks
  - Backup and recovery procedures
  - Monitoring and alerting setup

#### Project Structure & Placeholders
- `src/types/index.ts` - Complete TypeScript type definitions
- `src/lib/db.ts` - Database query utilities (placeholder)
- `src/lib/markdown.ts` - Markdown processing (placeholder)
- `src/lib/sync.ts` - Content sync engine (placeholder)
- `src/lib/validation.ts` - Zod schemas for validation
- `src/components/README.md` - Component organization guide
- `src/app/api/health/route.ts` - Health check endpoint
- `src/app/api/sync/route.ts` - GitHub webhook endpoint (placeholder)

#### Testing Infrastructure
- `vitest.config.ts` - Vitest configuration for React testing
- `src/tests/setup.ts` - Test environment setup
- `src/tests/utils.tsx` - Custom test render utilities
- `src/app/page.test.tsx` - Example component test

#### Configuration Files
- `tsconfig.json` - TypeScript strict mode configuration
- `eslint.config.mjs` - ESLint rules and Next.js integration
- `.prettierrc` - Code formatting rules
- `.prettierignore` - Prettier ignore patterns
- `.editorconfig` - Editor configuration for consistency
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS plugins
- `next.config.js` - Next.js configuration with security headers

### Documentation
- Initial project setup and documentation
- Complete documentation structure in `docs/` folder
- Master task tracker (`TASKS.md`)
- Rapid development agent workflow (`.claude/`)
- Comprehensive guides and reference documentation
- **GEO (Generative Engine Optimization)** - First-class support for AI search engines
  - Comprehensive GEO guide (`docs/guides/geo-optimization.md`)
  - JSON-LD structured data implementation tasks
  - Author authority and credential system
  - AI search engine testing checklist
  - Future-proof for ChatGPT, Perplexity, Bing Chat, Google SGE
- **Security & Vulnerability Assessment** - Comprehensive security framework
  - Security best practices guide (`docs/guides/security.md`)
  - 65-item security audit checklist (`docs/guides/security-checklist.md`)
  - Phase 8 in implementation roadmap with 8 security task groups
  - Coverage: SQL injection, XSS, CSRF, authentication, secrets management
  - Rate limiting, dependency scanning, incident response planning
  - Security testing framework and monitoring setup
- **Security Audit Agent** - Automated security analysis agent
  - Read-only security audit agent (`.claude/security-audit-agent-prompt.md`)
  - Comprehensive workflow documentation (`.claude/security-audit-workflow.md`)
  - Professional report template (`docs/security-audits/report-template.md`)
  - OWASP Top 10 compliance checking
  - 65-item checklist automated verification
  - Vulnerability detection with severity ratings
  - No code modifications - analysis and reporting only
- **Business Documentation** - Commercial strategy and architecture
  - Go-To-Market strategy (`docs/business/go-to-market.md`)
    - Market analysis and customer personas
    - Launch strategy (HN, Product Hunt, Reddit, Dev.to)
    - Content marketing calendar and community building
    - Metrics, KPIs, and success criteria
    - Budget and resource planning
  - Hosted Platform architecture (`docs/business/hosted-platform.md`)
    - Multi-tenant SaaS architecture
    - Control plane and data plane design
    - Pricing tiers ($15-$149/mo)
    - Database provisioning strategies
    - Stripe billing integration
    - Security, compliance, and scaling roadmap
    - Cost structure and margin analysis

### Technical Details
- **Node.js**: 18.17.0 minimum
- **Next.js**: 16.0.0 (App Router, React Server Components)
- **React**: 19.2.0 (concurrent features)
- **TypeScript**: Strict mode enabled
- **PostgreSQL**: 16 (with full-text search)
- **Testing**: Vitest with React Testing Library

### Infrastructure Ready
- ✅ Local development environment with Docker Compose
- ✅ Database schema and initialization scripts
- ✅ Next.js application scaffold
- ✅ Testing infrastructure
- ✅ Type safety throughout
- ✅ Code quality tools (ESLint, Prettier)
- ✅ Sample content and templates

### Next Steps
- **Phase 2**: Implement database query functions
- **Phase 3**: Implement Markdown processing
- **Phase 4**: Implement GitHub webhook sync
- **Phase 5**: Build UI components
- **Phase 6**: Create post listing and detail pages

---

## [0.1.0] - 2025-10-23

### Added
- Project initialization
- Documentation structure
- Task tracking system
- Development workflow setup

### Documentation
- Architecture overview
- API reference
- Database schema
- Tech stack details
- Getting started guide
- Deployment guide
- Implementation roadmap
- Contributing guidelines
- Testing strategy
- Quick reference guide
- Troubleshooting guide
- Design decisions document

---

## How to Update This File

When making changes, add them under **[Unreleased]** in the appropriate category:

### Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security fixes

### Example Entry

```markdown
## [Unreleased]

### Added
- New search functionality with full-text search
- Tag filtering page
- Author profile pages

### Fixed
- Webhook signature verification issue
- Database connection timeout

### Changed
- Updated markdown processor to support more plugins
- Improved ISR revalidation logic
```

---

## Release Process

1. Update [Unreleased] section with new changes
2. When ready to release, move [Unreleased] items to new version
3. Add release date
4. Create git tag: `git tag v0.1.0`
5. Push tag: `git push --tags`

---

**Last Updated:** 2025-01-15
