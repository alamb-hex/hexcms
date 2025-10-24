# Project Structure

## Complete Directory Layout

```
my-cms-project/
├── .next/                          # Next.js build output (auto-generated)
├── node_modules/                   # Dependencies (auto-generated)
├── public/                         # Static assets
│   ├── images/
│   │   ├── posts/                  # Blog post images
│   │   ├── authors/                # Author avatars
│   │   └── og/                     # Open Graph images
│   └── favicon.ico
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API routes
│   │   │   ├── health/
│   │   │   │   └── route.ts       # Health check endpoint
│   │   │   ├── preview/
│   │   │   │   ├── route.ts       # Enable preview mode
│   │   │   │   └── disable/
│   │   │   │       └── route.ts   # Disable preview mode
│   │   │   ├── revalidate/
│   │   │   │   └── route.ts       # ISR revalidation
│   │   │   └── sync-content/
│   │   │       └── route.ts       # GitHub webhook handler
│   │   ├── blog/
│   │   │   ├── [slug]/
│   │   │   │   ├── page.tsx       # Individual blog post
│   │   │   │   ├── not-found.tsx  # Post not found page
│   │   │   │   └── opengraph-image.tsx  # OG image generation
│   │   │   ├── tag/
│   │   │   │   └── [tag]/
│   │   │   │       └── page.tsx   # Tag filter page
│   │   │   └── page.tsx           # Blog listing page
│   │   ├── authors/
│   │   │   └── [slug]/
│   │   │       └── page.tsx       # Author profile page
│   │   ├── error.tsx              # Global error boundary
│   │   ├── layout.tsx             # Root layout
│   │   ├── not-found.tsx          # Global 404 page
│   │   ├── page.tsx               # Homepage
│   │   └── sitemap.ts             # Dynamic sitemap
│   │
│   ├── components/                 # React components
│   │   ├── blog/
│   │   │   ├── PostCard.tsx       # Blog post preview card
│   │   │   ├── PostContent.tsx    # Post content renderer
│   │   │   ├── PostHeader.tsx     # Post header with metadata
│   │   │   ├── PostMeta.tsx       # Author, date, reading time
│   │   │   ├── RelatedPosts.tsx   # Related posts section
│   │   │   └── TagList.tsx        # Tag chips
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Site header
│   │   │   ├── Footer.tsx         # Site footer
│   │   │   └── Navigation.tsx     # Main navigation
│   │   ├── search/
│   │   │   ├── SearchBar.tsx      # Search input
│   │   │   └── SearchResults.tsx  # Search results list
│   │   └── ui/                     # Shared UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Badge.tsx
│   │
│   ├── lib/                        # Core logic
│   │   ├── db.ts                   # Database client/connection
│   │   ├── constants.ts            # App constants
│   │   ├── utils.ts                # Utility functions
│   │   ├── markdown/
│   │   │   └── processor.ts       # Markdown → HTML processing
│   │   ├── queries/                # Database queries
│   │   │   ├── posts.ts           # Post queries
│   │   │   ├── authors.ts         # Author queries
│   │   │   ├── tags.ts            # Tag queries
│   │   │   └── search.ts          # Search queries
│   │   ├── sync/                   # Content sync logic
│   │   │   ├── github.ts          # GitHub API functions
│   │   │   ├── parser.ts          # Frontmatter parser
│   │   │   └── syncer.ts          # Main sync orchestration
│   │   └── seo/
│   │       └── metadata.ts        # SEO metadata helpers
│   │
│   ├── types/                      # TypeScript types
│   │   ├── database.ts            # Database types
│   │   ├── frontmatter.ts         # Frontmatter types
│   │   ├── api.ts                 # API types
│   │   └── index.ts               # Exported types
│   │
│   └── styles/                     # Global styles (if needed)
│       └── globals.css            # Global CSS
│
├── scripts/                        # Utility scripts
│   ├── init-db.ts                 # Database initialization
│   ├── manual-sync.ts             # Manual content sync
│   ├── seed-db.ts                 # Seed sample data
│   └── validate-content.ts        # Validate markdown files
│
├── docs/                           # Documentation
│   ├── README.md                  # Main readme
│   ├── ARCHITECTURE.md            # Architecture docs
│   ├── DATABASE.md                # Database schema
│   ├── TECH_STACK.md              # Tech stack details
│   ├── API.md                     # API documentation
│   ├── CONTENT_FORMAT.md          # Content format guide
│   ├── DEPLOYMENT.md              # Deployment guide
│   ├── IMPLEMENTATION.md          # Implementation roadmap
│   └── PROJECT_STRUCTURE.md       # This file
│
├── .env.example                    # Environment variables template
├── .env.local                      # Local environment (not committed)
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore rules
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies & scripts
├── postcss.config.js               # PostCSS configuration
├── README.md                       # Project readme
├── tailwind.config.js              # Tailwind CSS configuration
└── tsconfig.json                   # TypeScript configuration
```

---

## Content Repository Structure

```
blog-content/                       # Separate Git repository
├── content/
│   ├── posts/
│   │   ├── 2024-01-15-first-post.md
│   │   ├── 2024-01-20-second-post.md
│   │   └── 2024-02-01-third-post.md
│   ├── authors/
│   │   ├── john-doe.md
│   │   └── jane-smith.md
│   └── pages/
│       ├── about.md
│       └── contact.md
├── .github/
│   └── workflows/
│       └── sync.yml               # Optional: GitHub Actions
└── README.md
```

---

## File Descriptions

### Root Configuration Files

#### `next.config.js`
Next.js configuration including:
- Image domains
- Experimental features
- Webpack customization
- Environment variables

#### `tailwind.config.js`
Tailwind CSS configuration:
- Content paths
- Theme extensions
- Typography plugin settings
- Custom utilities

#### `tsconfig.json`
TypeScript compiler options:
- Strict mode settings
- Path aliases (@/*)
- Include/exclude patterns

#### `package.json`
Project metadata and scripts:
- Dependencies
- Dev dependencies
- NPM scripts
- Project info

---

### App Router (`src/app/`)

#### Layout & Pages

**`layout.tsx`** - Root layout
- HTML structure
- Global providers
- Analytics integration
- Common UI elements

**`page.tsx`** - Homepage
- Hero section
- Latest posts
- Featured content

**`error.tsx`** - Error boundary
- Error handling
- Retry functionality
- User-friendly messages

**`not-found.tsx`** - 404 page
- Custom 404 design
- Navigation suggestions
- Search functionality

---

#### Blog Routes (`app/blog/`)

**`page.tsx`** - Blog index
- Post listing
- Pagination
- Filters/sorting
- ISR configuration

**`[slug]/page.tsx`** - Individual post
- Post content rendering
- Related posts
- Author info
- Comments (optional)

**`tag/[tag]/page.tsx`** - Tag filter
- Posts by tag
- Tag description
- Related tags

---

#### API Routes (`app/api/`)

**`sync-content/route.ts`** - Webhook handler
- Receives GitHub webhooks
- Verifies signatures
- Triggers sync process
- Returns status

**`revalidate/route.ts`** - ISR revalidation
- On-demand revalidation
- Secret authentication
- Path revalidation

**`preview/route.ts`** - Draft preview
- Enable preview mode
- Verify secrets
- Set preview cookies

**`health/route.ts`** - Health check
- Database connectivity
- API status
- Version info

---

### Components (`src/components/`)

#### Blog Components

**`PostCard.tsx`**
- Post preview card
- Featured image
- Excerpt
- Metadata

**`PostContent.tsx`**
- Markdown rendering
- Typography styles
- Code highlighting
- Image optimization

**`PostHeader.tsx`**
- Post title
- Author info
- Publication date
- Reading time

**`PostMeta.tsx`**
- Author avatar
- Date formatting
- Tags
- Share buttons

**`RelatedPosts.tsx`**
- Similar posts
- Algorithm-based
- Thumbnail grid

**`TagList.tsx`**
- Tag chips
- Tag links
- Tag counts

---

#### Layout Components

**`Header.tsx`**
- Site logo
- Navigation menu
- Search bar
- Mobile menu

**`Footer.tsx`**
- Copyright
- Social links
- Legal links
- Newsletter signup

**`Navigation.tsx`**
- Menu items
- Active state
- Dropdowns
- Responsive

---

### Library Code (`src/lib/`)

#### Database (`db.ts`)

```typescript
// Database connection and client
import { sql } from '@vercel/postgres';

export { sql };

// Helper functions
export async function query<T>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  // Query execution logic
}
```

---

#### Markdown Processing (`markdown/processor.ts`)

```typescript
// Parse frontmatter
export function parseFrontmatter(content: string) {
  // gray-matter parsing
}

// Convert markdown to HTML
export async function markdownToHtml(markdown: string) {
  // unified/remark/rehype pipeline
}

// Calculate reading time
export function calculateReadingTime(content: string) {
  // reading-time library
}
```

---

#### Queries (`queries/`)

**`posts.ts`**
- `getPublishedPosts()` - List all published posts
- `getPostBySlug()` - Get single post
- `getRelatedPosts()` - Find related posts
- `upsertPost()` - Create/update post

**`authors.ts`**
- `getAuthor()` - Get author details
- `getAuthorPosts()` - Posts by author
- `upsertAuthor()` - Create/update author

**`tags.ts`**
- `getAllTags()` - List all tags
- `getPostsByTag()` - Posts by tag
- `getOrCreateTag()` - Get or create tag

**`search.ts`**
- `searchPosts()` - Full-text search
- `autocomplete()` - Search suggestions

---

#### Sync (`sync/`)

**`github.ts`**
```typescript
// Fetch file from GitHub
export async function fetchFileContent(path: string): Promise<string>

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean

// Get changed files
export function getChangedFiles(commits: any[]): string[]
```

**`parser.ts`**
```typescript
// Parse markdown file
export function parseMarkdownFile(content: string) {
  // Return { frontmatter, content, html }
}

// Validate frontmatter
export function validateFrontmatter(data: any, type: string) {
  // Zod validation
}
```

**`syncer.ts`**
```typescript
// Main sync function
export async function syncContent(webhookPayload: any) {
  // Orchestrate entire sync process
}

// Full sync (all content)
export async function fullSync() {
  // Sync entire repository
}
```

---

### Types (`src/types/`)

#### `database.ts`
```typescript
export interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  // ... all database columns
}

export interface Author {
  // ...
}

export interface Tag {
  // ...
}
```

#### `frontmatter.ts`
```typescript
export interface PostFrontmatter {
  title: string;
  author: string;
  publishedAt: string;
  tags?: string[];
  // ... all frontmatter fields
}

export interface AuthorFrontmatter {
  // ...
}
```

---

### Scripts (`scripts/`)

#### `init-db.ts`
```typescript
// Initialize database schema
// Create all tables
// Add indexes
// Seed initial data
```

#### `manual-sync.ts`
```typescript
// Manually trigger full sync
// Useful for:
// - Initial setup
// - Recovery
// - Testing
```

#### `seed-db.ts`
```typescript
// Seed database with sample data
// For development/testing
```

#### `validate-content.ts`
```typescript
// Validate all markdown files
// Check frontmatter
// Verify file structure
```

---

## File Naming Conventions

### Components
- PascalCase: `PostCard.tsx`
- React components: `.tsx` extension
- Collocate tests: `PostCard.test.tsx`

### Utilities
- camelCase: `markdownProcessor.ts`
- TypeScript files: `.ts` extension
- Index exports: `index.ts`

### API Routes
- kebab-case folders: `sync-content/`
- Route files: `route.ts`

### Pages
- kebab-case: `[slug]/page.tsx`
- Dynamic routes: `[param]/page.tsx`

---

## Import Aliases

Configured in `tsconfig.json`:

```typescript
// Instead of:
import { PostCard } from '../../../components/blog/PostCard';

// Use:
import { PostCard } from '@/components/blog/PostCard';
```

**Aliases:**
- `@/*` → `src/*`
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/types` → `src/types`

---

## Module Organization

### Barrel Exports

Use `index.ts` files to export multiple items:

```typescript
// src/lib/queries/index.ts
export * from './posts';
export * from './authors';
export * from './tags';

// Usage:
import { getPost, getAuthor } from '@/lib/queries';
```

### Feature-Based Structure

Group related functionality:

```
src/
└── features/
    ├── blog/
    │   ├── components/
    │   ├── hooks/
    │   └── utils/
    └── search/
        ├── components/
        └── hooks/
```

---

## Environment-Specific Files

### Development
- `.env.local` - Local overrides
- `vercel.json` - Local Vercel config

### Production
- Environment variables in Vercel dashboard
- No local env files committed

### Testing
- `.env.test` - Test environment
- Mock data in `__mocks__/`

---

## Build Output

### `.next/` Directory
Generated during build:
- Static pages
- Server bundles
- Client bundles
- Cache

**Important:** Never commit this directory

---

## Best Practices

### File Organization
1. Keep related files together
2. Use consistent naming
3. Limit nesting depth (3-4 levels max)
4. Create index files for clean imports

### Component Structure
```typescript
// 1. Imports
import { ... } from '...';

// 2. Types
interface Props { ... }

// 3. Component
export function Component({ ... }: Props) {
  // 4. Hooks
  // 5. Handlers
  // 6. Render
}

// 7. Exports
export default Component;
```

### File Size
- Components: < 200 lines
- Utilities: < 300 lines
- If larger, split into multiple files

---

## Code Splitting

### Dynamic Imports
```typescript
// Heavy component
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

### Route-Based Splitting
Next.js automatically code-splits by route.

---

## Assets Organization

### Images
```
public/images/
├── posts/          # Blog images
├── authors/        # Avatars
├── og/            # Open Graph images
└── icons/         # UI icons
```

### Fonts (if custom)
```
public/fonts/
├── inter-regular.woff2
└── inter-bold.woff2
```

---

## Testing Structure

```
src/
├── __tests__/              # Test files
│   ├── components/
│   ├── lib/
│   └── utils/
└── __mocks__/              # Mock files
    ├── data/
    └── modules/
```

---

## Documentation Location

Keep docs in `docs/` folder:
- Markdown format
- Link from README
- Include diagrams
- Update regularly

---

## Version Control

### `.gitignore` Essentials
```
node_modules/
.next/
.env.local
.vercel/
*.log
.DS_Store
```

### Commit Structure
```
feat: add tag filtering
fix: resolve webhook timeout
docs: update API documentation
chore: upgrade dependencies
```
