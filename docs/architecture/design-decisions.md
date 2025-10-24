# Design Decisions

> Key architectural and technology choices for heXcms

---

## Overview

This document explains the "why" behind major design decisions in heXcms. Understanding these choices will help you work with the system effectively and make consistent decisions when extending it.

---

## Core Architecture

### Decision: Git + Database Hybrid

**What:** Content is stored in Git (Markdown files) and synced to PostgreSQL database

**Why:**

✅ **Best of both worlds:**
- Git provides version control, portability, and familiar workflow
- Database provides fast queries, search, and relational data

✅ **Performance:**
- Build time stays constant regardless of content volume
- No need to parse markdown at build time
- Database queries are < 10ms vs file parsing at 100ms+

✅ **Cost-effective:**
- No SaaS CMS fees ($50-200/month saved)
- Vercel Postgres Hobby tier is free for small sites

✅ **Future-proof:**
- Content can be migrated easily (it's just markdown)
- Can swap database if needed
- No vendor lock-in

**Alternatives considered:**
- **Pure SSG (Static Site Generation):** Build time scales linearly with content. 1000 posts = 10+ minute builds
- **Headless CMS (Contentful, Sanity):** Monthly costs, vendor lock-in, less portable
- **File-only approach:** Poor query performance, difficult search implementation

---

### Decision: Webhook-Driven Sync

**What:** GitHub webhook triggers content sync instead of polling

**Why:**

✅ **Real-time updates:**
- Content appears within seconds of git push
- No delay from polling interval

✅ **Efficient:**
- Only syncs when content changes
- No wasted API calls or compute time

✅ **Cost-effective:**
- Zero polling costs
- Pay only for actual syncs

**Alternatives considered:**
- **Polling:** Wasteful, introduces delay, costs more
- **Manual sync:** Error-prone, requires human intervention
- **Build-time only:** Forces full rebuild for any content change

---

### Decision: Incremental Static Regeneration (ISR)

**What:** Pages are statically generated and revalidated periodically

**Why:**

✅ **Fast page loads:**
- Static HTML served from edge
- No server rendering delay
- < 50ms response times

✅ **Fresh content:**
- Pages revalidate in background
- Users see updated content without full rebuild

✅ **Scalable:**
- Thousands of pages, no performance impact
- Edge caching handles traffic spikes

✅ **Cost-effective:**
- Most requests hit cache (free)
- Regeneration only when needed

**Configuration:**
```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

**Alternatives considered:**
- **Pure SSG:** Requires full rebuild for any change
- **SSR (Server-Side Rendering):** Slower, more expensive, less scalable
- **Client-Side Rendering:** Poor SEO, slow initial load

---

## Technology Choices

### Decision: Next.js 14 with App Router

**Why:**

✅ **Modern React patterns:**
- Server Components reduce client bundle
- Streaming for better UX
- Built-in optimizations

✅ **Excellent DX:**
- File-based routing
- TypeScript support
- Hot reload
- Built-in optimizations

✅ **Vercel integration:**
- Seamless deployment
- Edge network
- Analytics built-in

✅ **Future-proof:**
- React Server Components
- Partial pre-rendering (upcoming)
- Active development

**Alternatives considered:**
- **Gatsby:** Less flexible, smaller ecosystem, longer builds
- **Astro:** Good for content sites but less mature
- **Remix:** Great but less deployment options
- **Pages Router:** Older Next.js pattern, App Router is future

---

### Decision: PostgreSQL (via Vercel Postgres)

**Why:**

✅ **Relational data:**
- Posts → Authors (many-to-one)
- Posts → Tags (many-to-many)
- SQL is perfect for this

✅ **Full-text search:**
- Native PostgreSQL features
- No additional service needed
- Cost-effective

✅ **Developer friendly:**
- Standard SQL
- Great tooling
- Well-documented

✅ **Vercel integration:**
- Easy setup
- Connection pooling built-in
- Automatic backups

**Alternatives considered:**
- **MongoDB:** Overkill for this use case, relationships are awkward
- **SQLite:** No managed hosting options, scaling concerns
- **MySQL:** PostgreSQL has better full-text search
- **Supabase:** Similar but Vercel Postgres integrates better

---

### Decision: Direct SQL vs ORM

**What:** Using `@vercel/postgres` SQL template literals instead of ORM

**Why:**

✅ **Simplicity:**
- No ORM learning curve
- Direct control over queries
- Easy to debug

✅ **Performance:**
- No ORM overhead
- Optimized queries
- Less abstraction

✅ **Flexibility:**
- Complex queries are straightforward
- Full PostgreSQL features available

```typescript
// Direct SQL
const { rows } = await sql`
  SELECT * FROM posts
  WHERE status = 'published'
  ORDER BY published_at DESC
  LIMIT 20
`;
```

**When to use ORM:**
- Very complex schema
- Need migration tools
- Team prefers ORM

**ORM options if needed:**
- Drizzle (recommended: lightweight, TypeScript-first)
- Prisma (feature-rich but heavier)

---

### Decision: Tailwind CSS

**Why:**

✅ **Rapid development:**
- Utility-first approach
- No context switching
- Fast prototyping

✅ **Consistency:**
- Design system built-in
- Easy to maintain
- Prevents style drift

✅ **Performance:**
- Unused styles purged
- Minimal CSS bundle
- Production optimized

✅ **Typography plugin:**
- Perfect for blog content
- Beautiful defaults
- Customizable

**Alternatives considered:**
- **CSS Modules:** More boilerplate, harder to maintain
- **Styled Components:** Runtime cost, larger bundle
- **Plain CSS:** No constraints, leads to inconsistency

---

### Decision: Unified/Remark/Rehype for Markdown

**Why:**

✅ **Pluggable architecture:**
- Add features as needed
- Large plugin ecosystem
- Extensible

✅ **Industry standard:**
- Used by GitHub, Gatsby, etc.
- Well-maintained
- Great documentation

✅ **Features:**
- GitHub Flavored Markdown
- Syntax highlighting
- Auto-linking headings
- Custom transformations

**Alternatives considered:**
- **markdown-it:** Less extensible
- **marked:** Simpler but fewer features
- **MDX:** Overkill for content files (useful for interactive docs)

---

## Data Flow Decisions

### Decision: Parse Once, Store HTML

**What:** Convert markdown to HTML during sync, store both in database

**Why:**

✅ **Performance:**
- No markdown parsing on page load
- Faster response times
- Less CPU usage

✅ **Consistency:**
- Same HTML every time
- No client-side rendering issues
- Predictable output

**Trade-off:**
- Storage: Stores both markdown and HTML
- Update: Must resync if markdown processor changes

**Storage impact:**
- Average post: 10KB markdown → 15KB HTML
- 1000 posts: ~25MB total (negligible)

---

### Decision: Calculate Reading Time on Sync

**What:** Compute reading time when syncing, not on each request

**Why:**

✅ **Performance:**
- Calculate once vs every request
- Faster page loads
- Consistent values

✅ **Accuracy:**
- Based on actual word count
- Ignores code blocks
- Industry standard (200 words/minute)

**Implementation:**
```typescript
import readingTime from 'reading-time';

const stats = readingTime(markdownContent);
const minutes = Math.ceil(stats.minutes);
```

---

## Security Decisions

### Decision: Webhook Signature Verification

**What:** Verify GitHub webhook signatures using HMAC-SHA256

**Why:**

✅ **Security:**
- Prevents unauthorized sync triggers
- Protects against replay attacks
- Industry standard

✅ **Reliability:**
- Ensures webhook is from GitHub
- Validates payload integrity

**Implementation:**
```typescript
import { createHmac } from 'crypto';

const expectedSignature = 'sha256=' +
  createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

const isValid = signature === expectedSignature;
```

**Why SHA-256 not MD5:**
- SHA-256 is cryptographically secure
- MD5 is considered broken
- GitHub uses SHA-256 standard

---

### Decision: Parameterized Queries

**What:** Always use SQL template literals, never string concatenation

**Why:**

✅ **Security:**
- Prevents SQL injection
- Automatic escaping
- Safe by default

```typescript
// ✅ Safe
const { rows } = await sql`SELECT * FROM posts WHERE slug = ${slug}`;

// ❌ Dangerous - never do this!
const { rows } = await sql`SELECT * FROM posts WHERE slug = '${slug}'`;
```

---

## Deployment Decisions

### Decision: Vercel for Hosting

**Why:**

✅ **Next.js integration:**
- Built by same team
- Seamless deployment
- Optimized performance

✅ **Developer experience:**
- Git integration
- Preview deployments
- Easy rollbacks

✅ **Performance:**
- Global edge network
- Automatic caching
- Image optimization

✅ **Free tier:**
- Generous limits
- Hobby projects free
- Upgrade when needed

**Alternatives considered:**
- **Netlify:** Similar but less Next.js optimization
- **AWS Amplify:** More complex setup
- **Self-hosted:** More work, less features

---

### Decision: Serverless Functions for API

**What:** Use Next.js API routes (serverless functions)

**Why:**

✅ **Scalability:**
- Auto-scales to zero
- Handles traffic spikes
- No server management

✅ **Cost-effective:**
- Pay per use
- Free tier generous
- No idle costs

✅ **Simplicity:**
- Same codebase
- Easy deployment
- TypeScript support

**Alternatives considered:**
- **Traditional server:** Always running, more costs
- **Lambda functions:** More complex deployment
- **Edge functions:** Limited use cases for this project

---

## Content Management Decisions

### Decision: Markdown with YAML Frontmatter

**Why:**

✅ **Human-readable:**
- Easy to write
- Version control friendly
- No special tools needed

✅ **Portable:**
- Standard format
- Works with any editor
- Easy migration

✅ **Flexible:**
- Any frontmatter fields
- Supports all markdown features
- Extensible

**YAML vs TOML vs JSON:**
- YAML: Most readable, common in static site generators
- TOML: Less common, harder to read nested structures
- JSON: Valid but less human-friendly

---

### Decision: Date-Prefixed Filenames

**What:** Posts use `YYYY-MM-DD-slug.md` format

**Why:**

✅ **Sortable:**
- Files sort chronologically
- Easy to find recent posts
- Visual organization

✅ **Explicit dates:**
- Date visible in filename
- Matches git workflow
- Prevents confusion

**Example:**
```
2024-01-15-getting-started.md
2024-02-20-nextjs-tips.md
```

**Alternative:** Could use frontmatter only, but filename provides redundancy

---

## Trade-offs & Limitations

### Known Trade-offs

**Sync Delay:**
- Content appears after webhook processes (5-30 seconds)
- Trade-off for real-time updates without polling

**Storage Duplication:**
- Markdown stored in Git and database
- Trade-off for performance and portability

**Vercel Vendor Lock-in (Mild):**
- Using Vercel-specific features
- Mitigated by standard Next.js code
- Could migrate to other hosts if needed

---

### Future Considerations

**Potential Changes:**

1. **Add Redis caching** if query performance degrades
2. **Move to dedicated PostgreSQL** if Vercel Postgres limits reached
3. **Add search service** (Algolia) for advanced search features
4. **Implement queue** for large sync operations
5. **Add CDN** for images if needed

---

## When to Deviate

**These decisions work for:**
- Personal blogs
- Small-to-medium content sites
- Teams comfortable with Git
- Budget-conscious projects

**Consider different approach if:**
- Non-technical content editors (add visual CMS)
- Real-time collaboration needed (use headless CMS)
- Massive scale (millions of posts)
- Complex content workflows

---

## Decision Template

When making new architectural decisions, document:

```markdown
### Decision: [Name]

**What:** [Brief description]

**Why:**
✅ Reason 1
✅ Reason 2
✅ Reason 3

**Alternatives considered:**
- Option A: Why not chosen
- Option B: Why not chosen

**Trade-offs:**
- Pro: Benefit
- Con: Cost

**When to reconsider:**
- Condition 1
- Condition 2
```

---

## References

- [Architecture Overview](./overview.md)
- [Tech Stack Details](../reference/tech-stack.md)
- [Implementation Roadmap](../development/implementation-roadmap.md)

---

**Last Updated:** 2025-10-23
**Review:** Quarterly or when major changes proposed
