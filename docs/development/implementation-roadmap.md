# Implementation Roadmap

## Overview

This document outlines the recommended implementation phases for building the Git-based CMS. Each phase builds on the previous, allowing for incremental development and testing.

---

## Phase 1: Core Infrastructure (Week 1)

**Goal:** Set up the foundational project structure and database.

### Tasks

#### 1.1 Project Setup
```bash
# Create Next.js project
npx create-next-app@latest cms --typescript --tailwind --app
cd cms

# Install core dependencies
npm install @vercel/postgres gray-matter zod

# Set up Git
git init
git add .
git commit -m "Initial commit"
```

**Deliverables:**
- [ ] Next.js 14 project with TypeScript
- [ ] Tailwind CSS configured
- [ ] Git repository initialized
- [ ] Basic file structure

---

#### 1.2 Database Schema

**Files to create:**
- `scripts/init-db.ts` - Database initialization
- `src/types/database.ts` - TypeScript types

**Tasks:**
- [ ] Create Vercel Postgres database
- [ ] Write SQL schema (posts, authors, tags, etc.)
- [ ] Create initialization script
- [ ] Add TypeScript interfaces
- [ ] Test database connection

**Script example:**
```typescript
// scripts/init-db.ts
import { sql } from '@vercel/postgres';

async function main() {
  // Create tables
  await sql`CREATE TABLE posts (...)`;
  await sql`CREATE TABLE authors (...)`;
  // ... etc
  
  console.log('Database initialized');
}

main();
```

---

#### 1.3 Environment Configuration

**Files to create:**
- `.env.example` - Template for environment variables
- `.env.local` - Local development (not committed)

**Environment variables:**
```bash
POSTGRES_URL=
GITHUB_TOKEN=
GITHUB_WEBHOOK_SECRET=
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=
NEXT_PUBLIC_SITE_URL=
```

---

#### 1.4 Content Repository Setup

**Structure:**
```
blog-content/          # Separate repository
├── content/
│   ├── posts/
│   ├── authors/
│   └── pages/
└── README.md
```

**Tasks:**
- [ ] Create content repository
- [ ] Add example markdown files
- [ ] Document frontmatter structure
- [ ] Create content templates

---

### Phase 1 Checklist

- [ ] Project initialized
- [ ] Database created and schema applied
- [ ] Environment variables configured
- [ ] Content repository created
- [ ] Can connect to database
- [ ] TypeScript types defined

---

## Phase 2: Sync Service (Week 2)

**Goal:** Build the core sync functionality to parse markdown and sync to database.

### Tasks

#### 2.1 Markdown Parser

**Files to create:**
- `src/lib/markdown/processor.ts` - Markdown processing
- `src/lib/sync/parser.ts` - Frontmatter parsing

**Dependencies:**
```bash
npm install unified remark remark-gfm rehype rehype-highlight rehype-slug rehype-autolink-headings reading-time
```

**Key functions:**
```typescript
// Parse frontmatter and content
export function parseMarkdown(content: string) {
  const { data, content: markdownContent } = matter(content);
  return { frontmatter: data, markdown: markdownContent };
}

// Convert markdown to HTML
export async function markdownToHtml(markdown: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeStringify)
    .process(markdown);
  
  return result.toString();
}
```

---

#### 2.2 GitHub Integration

**Files to create:**
- `src/lib/sync/github.ts` - GitHub API functions

**Dependencies:**
```bash
npm install @octokit/rest
```

**Key functions:**
```typescript
// Fetch file content from GitHub
export async function fetchFileContent(path: string): Promise<string>

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean

// Get changed files from webhook
export function getChangedFiles(commits: any[]): string[]
```

---

#### 2.3 Database Operations

**Files to create:**
- `src/lib/db.ts` - Database client
- `src/lib/queries/posts.ts` - Post queries
- `src/lib/queries/authors.ts` - Author queries
- `src/lib/queries/tags.ts` - Tag queries

**Key functions:**
```typescript
// Upsert post
export async function upsertPost(post: Post): Promise<void>

// Get or create tag
export async function getOrCreateTag(name: string, slug: string): Promise<number>

// Link post to tags
export async function linkPostTags(postId: number, tagIds: number[]): Promise<void>
```

---

#### 2.4 Sync Orchestration

**Files to create:**
- `src/lib/sync/syncer.ts` - Main sync logic

**Key function:**
```typescript
export async function syncContent(webhookPayload: any) {
  // 1. Extract changed files
  const files = getChangedFiles(webhookPayload.commits);
  
  // 2. Process each file
  for (const file of files) {
    if (file.endsWith('.md')) {
      // Fetch content
      const content = await fetchFileContent(file);
      
      // Parse
      const { frontmatter, markdown } = parseMarkdown(content);
      
      // Convert to HTML
      const html = await markdownToHtml(markdown);
      
      // Calculate reading time
      const readingTime = calculateReadingTime(markdown);
      
      // Upsert to database
      await upsertPost({ ...frontmatter, content: markdown, html, readingTime });
    }
  }
  
  return { success: true, filesProcessed: files.length };
}
```

---

### Phase 2 Checklist

- [x] Markdown parser working
- [x] GitHub API integration complete
- [x] Database operations tested
- [x] Sync orchestration implemented
- [x] Can parse frontmatter
- [x] Can convert markdown to HTML
- [x] Can sync to database

**Completed:** 2025-01-15

**Deliverables:**
- ✅ Complete markdown processing library (`src/lib/markdown.ts`) with frontmatter parsing, HTML conversion, reading time calculation, excerpt extraction, TOC generation
- ✅ Full database query layer (`src/lib/db.ts`) with 15 functions for posts, authors, tags, and pages
- ✅ GitHub integration and sync orchestration (`src/lib/sync.ts`) with 12 functions for webhook processing, file fetching, and database upserts
- ✅ Comprehensive test suite with 149 passing tests (markdown: 74, db: 41, sync: 34)
- ✅ Type-safe validation with Zod schemas
- ✅ Production-ready error handling with isolated error processing

---

## Phase 3: Webhook Handler (Week 2-3)

**Goal:** Create API endpoint to receive GitHub webhooks.

### Tasks

#### 3.1 Webhook Endpoint

**Files to create:**
- `src/app/api/sync-content/route.ts` - Webhook handler

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // 1. Verify signature
  const signature = request.headers.get('x-hub-signature-256');
  const body = await request.text();
  
  if (!verifyWebhookSignature(body, signature, process.env.GITHUB_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // 2. Parse payload
  const payload = JSON.parse(body);
  
  // 3. Sync content
  const result = await syncContent(payload);
  
  // 4. Return result
  return NextResponse.json(result);
}
```

---

#### 3.2 Webhook Configuration

**Tasks:**
- [ ] Generate webhook secret
- [ ] Add to environment variables
- [ ] Deploy to Vercel
- [ ] Configure in GitHub
- [ ] Test webhook delivery

---

#### 3.3 Error Handling

**Add to webhook handler:**
```typescript
try {
  // ... webhook logic
} catch (error) {
  console.error('Webhook error:', error);
  
  // Log to database (optional)
  await logSyncError(error);
  
  return NextResponse.json(
    { error: 'Sync failed', details: error.message },
    { status: 500 }
  );
}
```

---

### Phase 3 Checklist

- [ ] Webhook endpoint created
- [ ] Signature verification working
- [ ] Error handling implemented
- [ ] GitHub webhook configured
- [ ] Webhook tested successfully
- [ ] Logs verified

---

## Phase 4: Content Rendering (Week 3-4)

**Goal:** Build Next.js pages to display content from the database.

### Tasks

#### 4.1 Blog Listing Page

**Files to create:**
- `src/app/blog/page.tsx` - Blog index

**Implementation:**
```typescript
import { sql } from '@vercel/postgres';

export const revalidate = 60; // ISR

export default async function BlogPage() {
  const { rows } = await sql`
    SELECT id, slug, title, excerpt, published_at, reading_time
    FROM posts
    WHERE status = 'published'
    ORDER BY published_at DESC
    LIMIT 20
  `;
  
  return (
    <div>
      <h1>Blog</h1>
      {rows.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

---

#### 4.2 Individual Post Page

**Files to create:**
- `src/app/blog/[slug]/page.tsx` - Single post

**Implementation:**
```typescript
export async function generateStaticParams() {
  const { rows } = await sql`SELECT slug FROM posts WHERE status = 'published'`;
  return rows.map(row => ({ slug: row.slug }));
}

export default async function PostPage({ params }) {
  const { rows } = await sql`
    SELECT * FROM posts WHERE slug = ${params.slug}
  `;
  
  const post = rows[0];
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html_content }} />
    </article>
  );
}
```

---

#### 4.3 Components

**Files to create:**
- `src/components/blog/PostCard.tsx`
- `src/components/blog/PostHeader.tsx`
- `src/components/blog/PostContent.tsx`
- `src/components/blog/TagList.tsx`

---

#### 4.4 Styling

**Tasks:**
- [ ] Install @tailwindcss/typography
- [ ] Style blog listing
- [ ] Style individual posts
- [ ] Add responsive design
- [ ] Style code blocks

**Typography plugin:**
```typescript
// In PostContent.tsx
<div className="prose prose-lg max-w-none">
  <div dangerouslySetInnerHTML={{ __html: post.html_content }} />
</div>
```

---

### Phase 4 Checklist

- [ ] Blog listing page working
- [ ] Individual post pages working
- [ ] Components created
- [ ] Styling applied
- [ ] ISR configured
- [ ] SEO metadata added

---

## Phase 5: Additional Features (Week 4-5)

**Goal:** Add tag filtering, search, and other enhancements.

### Tasks

#### 5.1 Tag Filtering

**Files to create:**
- `src/app/blog/tag/[tag]/page.tsx` - Tag filter page

**Query:**
```typescript
const { rows } = await sql`
  SELECT p.* FROM posts p
  JOIN post_tags pt ON p.id = pt.post_id
  JOIN tags t ON pt.tag_id = t.id
  WHERE t.slug = ${params.tag}
  AND p.status = 'published'
  ORDER BY p.published_at DESC
`;
```

---

#### 5.2 Author Pages

**Files to create:**
- `src/app/authors/[slug]/page.tsx` - Author profile

---

#### 5.3 Related Posts

**Add to post page:**
```typescript
const { rows: related } = await sql`
  SELECT DISTINCT p2.*
  FROM posts p1
  JOIN post_tags pt1 ON p1.id = pt1.post_id
  JOIN post_tags pt2 ON pt1.tag_id = pt2.tag_id
  JOIN posts p2 ON pt2.post_id = p2.id
  WHERE p1.slug = ${params.slug}
  AND p2.id != p1.id
  LIMIT 3
`;
```

---

#### 5.4 Search

**Option A: Database full-text search**
```typescript
const { rows } = await sql`
  SELECT * FROM posts
  WHERE status = 'published'
  AND (
    title ILIKE ${`%${query}%`}
    OR content ILIKE ${`%${query}%`}
  )
`;
```

**Option B: PostgreSQL tsvector** (better performance)

---

#### 5.5 Pagination

**Implementation:**
```typescript
const page = parseInt(searchParams.page || '1');
const perPage = 20;
const offset = (page - 1) * perPage;

const { rows } = await sql`
  SELECT * FROM posts
  WHERE status = 'published'
  ORDER BY published_at DESC
  LIMIT ${perPage} OFFSET ${offset}
`;
```

---

### Phase 5 Checklist

- [ ] Tag filtering working
- [ ] Author pages implemented
- [ ] Related posts showing
- [ ] Search functionality added
- [ ] Pagination implemented
- [ ] RSS feed (optional)

---

## Phase 6: Optimization & Polish (Week 5-6)

**Goal:** Optimize performance and add finishing touches.

### Tasks

#### 6.1 Performance

- [ ] Add database indexes
- [ ] Optimize images with next/image
- [ ] Implement caching strategies
- [ ] Optimize bundle size
- [ ] Add loading states
- [ ] Implement skeleton screens

---

#### 6.2 SEO

**Files to create:**
- `src/app/blog/[slug]/opengraph-image.tsx` - OG images
- `src/lib/seo.ts` - SEO utilities

**Metadata:**
```typescript
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: [post.featured_image],
    },
  };
}
```

---

#### 6.3 Analytics

**Install:**
```bash
npm install @vercel/analytics @vercel/speed-insights
```

**Add to layout:**
```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

#### 6.4 Error Handling

**Files to create:**
- `src/app/error.tsx` - Error boundary
- `src/app/not-found.tsx` - 404 page
- `src/app/blog/[slug]/not-found.tsx` - Post not found

---

#### 6.5 Sitemap & RSS

**Files to create:**
- `src/app/sitemap.ts` - XML sitemap
- `src/app/blog/rss.xml/route.ts` - RSS feed

---

### Phase 6 Checklist

- [ ] Performance optimized
- [ ] SEO implemented
- [ ] Analytics added
- [ ] Error pages created
- [ ] Sitemap generated
- [ ] RSS feed working

---

## Phase 7: Advanced Features (Optional)

**Goal:** Add nice-to-have features.

### Tasks

#### 7.1 Draft Preview

**Files to create:**
- `src/app/api/preview/route.ts` - Enable preview
- `src/app/api/preview/disable/route.ts` - Disable preview

**Usage:**
```
/api/preview?secret=xxx&slug=draft-post
```

---

#### 7.2 On-Demand Revalidation

**Files to create:**
- `src/app/api/revalidate/route.ts` - Revalidation endpoint

**Trigger from webhook:**
```typescript
await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
  method: 'POST',
  body: JSON.stringify({ secret: 'xxx', path: `/blog/${slug}` })
});
```

---

#### 7.3 Web Editor (Advanced)

**Consider using:**
- Tina CMS
- Netlify CMS
- Custom React editor

This allows non-technical users to edit content via web UI.

---

#### 7.4 Comments System

**Options:**
- Giscus (GitHub Discussions)
- Utterances (GitHub Issues)
- Disqus
- Custom solution

---

#### 7.5 Newsletter Integration

**Options:**
- ConvertKit
- Mailchimp
- Buttondown
- Resend

---

### Phase 7 Checklist

- [ ] Preview mode working
- [ ] On-demand revalidation
- [ ] Web editor (optional)
- [ ] Comments (optional)
- [ ] Newsletter (optional)

---

## Testing Strategy

### Unit Tests

**Files to test:**
- `src/lib/markdown/processor.ts`
- `src/lib/sync/parser.ts`
- `src/lib/sync/github.ts`

**Framework:** Jest or Vitest

```bash
npm install -D vitest @testing-library/react
```

---

### Integration Tests

**Test:**
- Database queries
- Sync workflow
- API endpoints

---

### E2E Tests

**Framework:** Playwright

```bash
npm install -D @playwright/test
```

**Test:**
- Page rendering
- Navigation
- Search functionality

---

## Deployment Timeline

### Week 1-2: MVP
- Core infrastructure
- Basic sync
- Simple rendering

### Week 3-4: Production Ready
- Full features
- Styling
- Testing

### Week 5-6: Polish
- Performance
- SEO
- Documentation

---

## Success Metrics

### Technical Metrics

- [ ] Build time < 2 minutes
- [ ] Page load < 1 second
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] TypeScript strict mode
- [ ] 100% uptime (Vercel)

### Content Metrics

- [ ] Can sync 100+ posts
- [ ] Webhook latency < 5 seconds
- [ ] Search results < 500ms
- [ ] Images optimized (WebP)
- [ ] Responsive on all devices

---

## Post-Launch

### Monitoring

- Set up Vercel Analytics
- Configure error tracking
- Monitor database performance
- Track webhook deliveries

### Maintenance

- Weekly: Check logs
- Monthly: Update dependencies
- Quarterly: Security audit

### Documentation

- Update README
- Write migration guide
- Create video tutorials
- Gather user feedback

---

## Resources

### Documentation
- Keep docs up to date
- Add code examples
- Include troubleshooting

### Community
- Create GitHub discussions
- Write blog posts
- Share on social media

### Support
- Set up issue templates
- Create FAQ
- Provide email support
