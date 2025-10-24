# heXcms

> A Git-based Headless CMS with database sync for blazing-fast builds

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

A headless CMS that combines the simplicity of Markdown files in Git with the performance of a PostgreSQL database. Write content in your favorite editor, push to Git, and let the CMS handle the rest.

---

## Why heXcms?

Traditional static site generators rebuild everything when content changes. heXcms syncs only changed files to a database, keeping builds fast regardless of content volume.

### Benefits

- ⚡ **Fast Builds** - Always < 2 minutes, regardless of content size
- 📝 **Git-Based** - Content in Markdown with frontmatter
- 💰 **Cost-Effective** - No SaaS CMS fees
- 🔍 **Powerful Search** - Database-powered full-text search
- 🤖 **GEO Ready** - Optimized for AI search engines (ChatGPT, Perplexity, etc.)
- 🏷️ **Rich Metadata** - Tags, authors, and relationships
- 🚀 **Scalable** - Handles 10,000+ posts effortlessly

---

## How It Works

```
Markdown (Git) → GitHub Webhook → Sync Service → PostgreSQL → Next.js (ISR)
```

1. Write content in Markdown with YAML frontmatter
2. Commit and push to GitHub
3. Webhook triggers automatic sync
4. Database stores parsed content
5. Next.js serves pages with ISR

**Result:** Content updates in seconds, builds stay fast, queries are instant.

---

## Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- Docker and Docker Compose (for local database)
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/alamb-hex/hexcms.git
cd hexcms

# Install dependencies
npm install

# Start PostgreSQL database
docker-compose up -d

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
npm run db:init

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

### Verify Installation

```bash
# Run tests
npm test

# Check types
npm run type-check

# Lint code
npm run lint
```

**Next steps:** See [Getting Started Guide](./docs/guides/getting-started.md) for complete setup.

---

## Documentation

📚 **[Complete Documentation](./docs/README.md)**

### Quick Links

- **Getting Started**
  - [Quick Start Guide](./docs/guides/getting-started.md)
  - [Deployment Guide](./docs/guides/deployment.md)
  - [Quick Reference](./docs/guides/quick-reference.md)
  - [Troubleshooting](./docs/guides/troubleshooting.md)

- **Reference**
  - [API Documentation](./docs/reference/api.md)
  - [Database Schema](./docs/reference/database.md)
  - [Tech Stack](./docs/reference/tech-stack.md)
  - [Content Format](./docs/reference/content-format.md)

- **Architecture**
  - [System Overview](./docs/architecture/overview.md)
  - [Project Structure](./docs/architecture/project-structure.md)
  - [Design Decisions](./docs/architecture/design-decisions.md)
  - [Architecture Decision Records (ADR)](./docs/architecture/adr/README.md)

- **Development**
  - [Implementation Roadmap](./docs/development/implementation-roadmap.md)
  - [Contributing Guide](./docs/development/contributing.md)
  - [Testing Strategy](./docs/development/testing.md)
  - [Operational Runbook](./docs/guides/runbook.md)

- **Business & Strategy**
  - [Go-To-Market Strategy](./docs/business/go-to-market.md)
  - [Hosted Platform Architecture](./docs/business/hosted-platform.md)

---

## Features

- **Content Management**
  - Markdown files with YAML frontmatter
  - Version control via Git
  - Draft and published states
  - Reading time calculation

- **Performance**
  - ISR (Incremental Static Regeneration)
  - Database-powered queries
  - Edge caching
  - Optimized images

- **Organization**
  - Multi-author support
  - Tag system
  - Related posts
  - Full-text search

- **Developer Experience**
  - TypeScript throughout
  - Hot reload
  - Automated sync
  - Comprehensive docs

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** React 19 (Server Components)
- **Database:** PostgreSQL 16 (Vercel Postgres)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS
- **Content:** Markdown with remark/rehype
- **Language:** TypeScript (Strict Mode)
- **Testing:** Vitest + React Testing Library

See [Tech Stack Documentation](./docs/reference/tech-stack.md) for complete details.

---

## Project Status

**Current Version:** 0.3.0 (Sync Service Complete)

### What's Ready

✅ **Phase 1: Foundation & Infrastructure (Complete)**
- Next.js 16 application scaffold with App Router
- PostgreSQL database schema and Docker setup
- TypeScript types and interfaces
- Testing infrastructure (Vitest)
- Sample content structure and templates
- Architecture Decision Records (ADR)
- Operational runbook and documentation
- Code quality tools (ESLint, Prettier)

✅ **Phase 2: Sync Service & Data Processing (Complete)**
- Markdown processing library with frontmatter parsing
- Database query layer (15 functions)
- GitHub integration with Octokit
- Webhook sync orchestration
- Comprehensive test suite (149 tests passing)
- Type-safe validation with Zod
- Production-ready error handling

### Roadmap

- [x] **Phase 1:** Foundation & Infrastructure
- [x] **Phase 2:** Database Queries & Markdown Processing
- [ ] **Phase 3:** GitHub Webhook Sync Implementation
- [ ] **Phase 4:** Content Rendering & UI Components
- [ ] **Phase 5:** Post Listings & Detail Pages
- [ ] **Phase 6:** Search & Additional Features
- [ ] **Phase 7:** Optimization & Polish
- [ ] **Phase 8:** Security Hardening

See [Implementation Roadmap](./docs/development/implementation-roadmap.md) for details.

### Current Sprint

See [TASKS.md](./TASKS.md) for active tasks and progress tracking.

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/development/contributing.md).

### Quick Contribution Steps

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'feat: add feature'`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run type-check      # TypeScript check

# Database
docker-compose up -d    # Start PostgreSQL
docker-compose down     # Stop PostgreSQL
npm run db:init         # Initialize database
npm run db:reset        # Reset database (WARNING: deletes data)

# Quality
npm run lint            # Lint code
npm run format          # Format code with Prettier
npm test                # Run tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate coverage report
```

See [Quick Reference](./docs/guides/quick-reference.md) for all commands.

---

## Rapid Development with Claude Code

This project includes specialized agents for development and security:

### Development Agents

- **Rapid Dev Agent** - Sequential task execution for fast implementation
  - Master task tracker (`TASKS.md`)
  - Current sprint tasks (`project-tasks.md`)
  - Agent configuration (`.claude/rapid-dev-workflow.md`)

- **Security Audit Agent** - Automated security analysis and reporting
  - Read-only vulnerability scanning
  - OWASP Top 10 compliance checking
  - Professional security reports
  - Agent configuration (`.claude/security-audit-workflow.md`)

See [Agent Documentation](./.claude/) for complete details.

---

## License

[MIT](./LICENSE)

---

## Support

- **Documentation:** [docs/README.md](./docs/README.md)
- **Issues:** [GitHub Issues](https://github.com/alamb-hex/hexcms/issues)
- **Discussions:** [GitHub Discussions](https://github.com/alamb-hex/hexcms/discussions)

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org) - React framework
- [Vercel](https://vercel.com) - Hosting and database
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [unified](https://unifiedjs.com) - Markdown processing

---

**[📖 Read the Complete Documentation](./docs/README.md)** | **[🚀 Get Started](./docs/guides/getting-started.md)** | **[📋 View Tasks](./TASKS.md)**
