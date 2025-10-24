# System Architecture

## Overview

This CMS uses a hybrid architecture combining the benefits of Git-based content management with database-backed performance.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ Content Layer (Git Repository)                               │
│                                                               │
│  content/                                                     │
│  ├─ posts/                                                    │
│  │  ├─ 2024-01-15-hello-world.md                            │
│  │  └─ 2024-02-20-nextjs-tips.md                            │
│  ├─ authors/                                                  │
│  │  └─ john-doe.md                                           │
│  └─ pages/                                                    │
│     └─ about.md                                              │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ (1) Git Push
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ GitHub Webhook                                                │
│ POST /api/sync-content                                        │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ (2) Webhook Event
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ Sync Service (Vercel Serverless Function)                    │
│                                                               │
│  1. Verify webhook signature                                  │
│  2. Fetch changed files via GitHub API                        │
│  3. Parse Markdown + Frontmatter                              │
│  4. Extract metadata                                          │
│  5. Upsert to Postgres                                        │
│  6. Trigger ISR revalidation                                  │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ (3) Store Content
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ Database Layer (Vercel Postgres)                             │
│                                                               │
│  Tables:                                                      │
│  • posts                                                      │
│  • authors                                                    │
│  • tags                                                       │
│  • post_tags                                                  │
│  • pages                                                      │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ (4) Query Data
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ Application Layer (Next.js)                                  │
│                                                               │
│  Pages:                                                       │
│  • /blog → ISR (revalidate: 60)                              │
│  • /blog/[slug] → ISR                                         │
│  • /api/revalidate → On-demand ISR trigger                   │
│                                                               │
│  Features:                                                    │
│  • Fast queries (no MD parsing)                               │
│  • Search functionality                                       │
│  • Tag filtering                                              │
│  • Draft previews                                             │
└──────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Content Layer

**Repository Structure:**
```
content/
├─ posts/
│  └─ YYYY-MM-DD-slug.md
├─ authors/
│  └─ author-slug.md
└─ pages/
   └─ page-slug.md
```

**Responsibilities:**
- Single source of truth for all content
- Version control and history
- Collaboration via Git workflow (PRs, reviews)
- Can be a separate repository or monorepo

**Benefits:**
- Portable format (Markdown)
- Easy backups
- No vendor lock-in
- Git-based workflow

---

### 2. Sync Service

**Location:** `/api/sync-content/route.ts`

**Workflow:**
```
Webhook → Verify → Fetch Files → Parse → Transform → Upsert → Revalidate
```

**Key Functions:**

#### A. Webhook Verification
```typescript
// Verify GitHub webhook signature
verifyWebhookSignature(payload, signature, secret)
```

#### B. File Detection
```typescript
// Extract changed .md files from commits
getChangedFiles(commits) → string[]
```

#### C. Content Parsing
```typescript
// Parse frontmatter and content
parseMarkdown(fileContent) → {
  frontmatter: Object,
  content: string
}
```

#### D. Markdown Processing
```typescript
// Convert markdown to HTML with plugins
processMarkdown(content) → htmlString
```

#### E. Database Sync
```typescript
// Upsert post to database
upsertPost(postData) → Promise<void>
```

#### F. Cache Invalidation
```typescript
// Trigger ISR revalidation
revalidatePath(`/blog/${slug}`)
```

**Error Handling:**
- Webhook verification failures → 401 response
- Parsing errors → Log and continue with other files
- Database errors → Retry logic
- Partial sync on failure

---

### 3. Database Layer

**Technology:** Vercel Postgres (PostgreSQL)

**Schema Design:**

```sql
posts ──┬──→ authors (many-to-one)
        │
        └──→ post_tags ──→ tags (many-to-many)
```

**Key Tables:**
- `posts` - Blog posts with content
- `authors` - Author information
- `tags` - Tag definitions
- `post_tags` - Junction table
- `pages` - Standalone pages
- `sync_logs` - Sync history (optional)

**Indexes:**
- Slug lookups (unique)
- Published date sorting
- Status filtering
- Full-text search (optional)

See [DATABASE.md](./DATABASE.md) for complete schema.

---

### 4. Application Layer

**Framework:** Next.js 14 (App Router)

**Rendering Strategy:**

#### ISR (Incremental Static Regeneration)
```typescript
// Blog post page
export const revalidate = 60; // 60 seconds

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map(post => ({ slug: post.slug }));
}
```

**Key Routes:**

| Route | Type | Revalidation |
|-------|------|--------------|
| `/blog` | ISR | 60s |
| `/blog/[slug]` | ISR | 60s |
| `/blog/tag/[tag]` | ISR | 300s |
| `/api/sync-content` | API | N/A |
| `/api/revalidate` | API | N/A |
| `/api/preview` | API | N/A |

---

## Data Flow

### Content Creation Flow

```
1. Writer creates post.md
   └─> content/posts/2024-01-15-new-post.md

2. Git commit & push
   └─> GitHub receives push

3. GitHub webhook fires
   └─> POST /api/sync-content

4. Sync service processes
   ├─> Verify signature
   ├─> Fetch changed files via GitHub API
   ├─> Parse: frontmatter + markdown
   ├─> Process: markdown → HTML
   └─> Upsert to database

5. Database updated
   └─> Post stored with metadata

6. ISR revalidation triggered
   └─> /blog/new-post regenerates on next request

7. User visits page
   └─> Fresh content served
```

### Read Flow (User Request)

```
1. User requests /blog/new-post
   │
   ├─> ISR cache hit?
   │   ├─> Yes: Serve cached page (< 50ms)
   │   └─> No: Generate page
   │
2. Generate page (if needed)
   ├─> Query database for post
   ├─> Query related posts/tags
   ├─> Render React components
   └─> Cache result
   │
3. Serve HTML to user
   └─> Fast response (< 200ms)
```

---

## Key Design Decisions

### Why Database + Git?

| Approach | Build Time | Query Speed | Flexibility | Cost |
|----------|------------|-------------|-------------|------|
| **Only Git (SSG)** | Slow (scales poorly) | N/A | Low | Free |
| **Only Database** | Fast | Fast | High | $$$ |
| **Git + DB (This)** | Fast | Fast | High | $ |

### Why Webhook Instead of Polling?

**Webhook (Chosen):**
- ✅ Real-time updates
- ✅ No wasted API calls
- ✅ Event-driven architecture
- ✅ Lower costs

**Polling (Alternative):**
- ❌ Delays in updates
- ❌ Wasted API calls
- ❌ Higher resource usage
- ❌ More complex to implement

### Why ISR Instead of Pure SSG?

**ISR (Chosen):**
- ✅ Update content without full rebuild
- ✅ Stale-while-revalidate pattern
- ✅ Scales to thousands of pages
- ✅ On-demand revalidation

**Pure SSG (Alternative):**
- ❌ Full rebuild on any change
- ❌ Long build times (100+ posts)
- ❌ Slow CI/CD pipeline
- ❌ Poor developer experience

### Why Serverless Functions?

**Benefits:**
- Automatic scaling
- Pay-per-use pricing
- No server management
- Vercel optimized
- Fast cold starts

---

## Performance Characteristics

### Build Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Build time | < 2 min | ~1 min |
| DB queries during build | < 100 | ~50 |
| Pages generated at build | 20-50 | 30 |
| Total build size | < 10MB | ~5MB |

### Runtime Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load (cached) | < 50ms | ~30ms |
| Page load (uncached) | < 200ms | ~150ms |
| Database query | < 10ms | ~5ms |
| Sync duration | < 30s | ~15s |

### Scalability

| Posts | Build Time | Query Time |
|-------|------------|------------|
| 100 | 1 min | 5ms |
| 1,000 | 1 min | 8ms |
| 10,000 | 1 min | 12ms |

---

## Security Architecture

### Webhook Security
- HMAC signature verification (SHA-256)
- Signature in `X-Hub-Signature-256` header
- Constant-time comparison

### API Security
- Secret-based authentication for revalidation
- Rate limiting on sync endpoint
- CORS restrictions
- Environment variable protection

### Database Security
- Parameterized queries (SQL injection prevention)
- Connection pooling
- SSL/TLS connections
- Principle of least privilege

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│ Vercel Platform                         │
│                                         │
│  ┌────────────────────────────────┐   │
│  │ Edge Network (CDN)             │   │
│  │ • Static assets                │   │
│  │ • Cached ISR pages             │   │
│  └────────────────────────────────┘   │
│                                         │
│  ┌────────────────────────────────┐   │
│  │ Serverless Functions           │   │
│  │ • /api/sync-content            │   │
│  │ • /api/revalidate              │   │
│  │ • Next.js SSR/ISR              │   │
│  └────────────────────────────────┘   │
│                                         │
│  ┌────────────────────────────────┐   │
│  │ Vercel Postgres                │   │
│  │ • Content storage              │   │
│  │ • Indexed queries              │   │
│  └────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Key Metrics to Track

**Sync Service:**
- Webhook success/failure rate
- Sync duration
- Files processed per sync
- Error types and frequency

**Application:**
- Page load times
- Database query duration
- ISR cache hit rate
- 404 errors

**Database:**
- Connection pool usage
- Query performance
- Storage size
- Slow queries

### Logging Strategy

```typescript
// Structured logging
{
  timestamp: "2024-01-15T10:30:00Z",
  level: "info",
  service: "sync",
  action: "parse_markdown",
  file: "posts/hello-world.md",
  duration: 125
}
```

---

## Future Enhancements

1. **Caching Layer**: Add Redis for query caching
2. **Search**: Implement full-text search with PostgreSQL or Algolia
3. **Media Management**: CDN integration for images
4. **Analytics**: View counts and popular posts
5. **Web Editor**: Simple WYSIWYG interface
6. **Multi-tenancy**: Support multiple blogs/sites
7. **Webhooks**: Notify external services on publish
8. **Localization**: Multi-language support
