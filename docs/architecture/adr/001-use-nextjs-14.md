# ADR-001: Use Next.js 14 as Framework

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** heXcms Core Team

## Context

We need a modern, performant framework for building the heXcms headless CMS. The framework must support:

- Server-side rendering (SSR) and static site generation (SSG)
- React Server Components for optimal performance
- Built-in routing and API routes
- TypeScript support out of the box
- Strong ecosystem and community
- Edge runtime support for global performance
- Built-in caching and revalidation strategies

Key requirements:
- Fast page loads and optimal Core Web Vitals
- Developer experience with hot reload and TypeScript
- Production-ready with minimal configuration
- Scalable to handle thousands of content pages
- SEO-friendly with server-side rendering

## Decision

We will use **Next.js 14** with the App Router as the foundational framework for heXcms.

Specifically:
- Next.js 14.x (latest stable)
- App Router (not Pages Router)
- React Server Components by default
- TypeScript for all code
- Turbopack for faster development builds

## Consequences

### Positive

- **React Server Components**: Zero JavaScript shipped for static content, dramatically improving performance
- **Streaming SSR**: Instant page loads with progressive rendering
- **Built-in optimization**: Automatic image optimization, font optimization, and code splitting
- **Developer experience**: Fast refresh, TypeScript support, excellent error messages
- **Vercel deployment**: First-class support for Vercel's edge network
- **Ecosystem**: Massive community, plugins, and third-party integrations
- **Future-proof**: Active development, regular updates, backing by Vercel
- **SEO-friendly**: Server-side rendering ensures content is crawlable

### Negative

- **Learning curve**: App Router is newer and has different patterns than Pages Router
- **Framework lock-in**: Tight coupling to Next.js ecosystem
- **Bundle size**: Next.js itself adds ~90KB to the bundle (but worth it for features)
- **Breaking changes**: Next.js major versions occasionally have breaking changes
- **Deployment constraints**: Works best on Vercel; other platforms require more configuration

### Risks

- **Rapid evolution**: App Router is relatively new (stable since Next.js 13.4)
- **Migration complexity**: Upgrading major versions may require code changes
- **Edge runtime limitations**: Some Node.js APIs not available in edge runtime
- **Vendor dependence**: Vercel controls the roadmap

## Alternatives Considered

### Alternative 1: Remix

- **Pros:**
  - Excellent developer experience
  - Web standards focused (Web Fetch API, FormData)
  - Great data loading patterns
  - Strong TypeScript support
- **Cons:**
  - Smaller ecosystem than Next.js
  - No built-in static generation (SSG)
  - Less mature image optimization
  - Smaller community and fewer resources
- **Reason for rejection:** Next.js has better static generation support, which is crucial for a CMS. The ecosystem and community are also significantly larger.

### Alternative 2: Astro

- **Pros:**
  - Partial hydration ("Islands Architecture")
  - Multi-framework support (React, Vue, Svelte)
  - Excellent performance by default
  - Great for content-heavy sites
- **Cons:**
  - Limited dynamic routing capabilities
  - Smaller ecosystem
  - Less suitable for complex web apps
  - React Server Components not supported
- **Reason for rejection:** While great for static content, Astro is less suitable for the dynamic, database-driven aspects of heXcms. Next.js provides better flexibility.

### Alternative 3: SvelteKit

- **Pros:**
  - Excellent performance
  - Less JavaScript shipped to client
  - Clean, simple syntax
  - Fast builds
- **Cons:**
  - Smaller ecosystem than React
  - Fewer developers familiar with Svelte
  - Less enterprise adoption
  - Fewer third-party integrations
- **Reason for rejection:** React's ecosystem and developer familiarity won out. We need a large talent pool for an open-source project.

### Alternative 4: Custom React + Vite

- **Pros:**
  - Complete control over architecture
  - No framework lock-in
  - Minimal dependencies
  - Maximum flexibility
- **Cons:**
  - Need to implement routing, SSR, data fetching ourselves
  - No built-in optimizations
  - Significant development time
  - Maintenance burden
- **Reason for rejection:** Reinventing the wheel. Next.js provides battle-tested solutions for routing, SSR, and optimization that would take months to build from scratch.

## Implementation Notes

### App Router Migration

We're using the App Router exclusively (not the older Pages Router):

```
src/app/
├── layout.tsx      # Root layout
├── page.tsx        # Home page
├── posts/
│   ├── [slug]/
│   │   └── page.tsx
│   └── page.tsx
└── api/
    └── sync/
        └── route.ts
```

### React Server Components

Default to Server Components for all pages:

```typescript
// src/app/posts/[slug]/page.tsx
export default async function PostPage({ params }: { params: { slug: string } }) {
  // This runs on the server
  const post = await db.getPost(params.slug);
  return <PostContent post={post} />;
}
```

Use Client Components only when needed:

```typescript
'use client';

export function LikeButton() {
  const [likes, setLikes] = useState(0);
  return <button onClick={() => setLikes(likes + 1)}>Like ({likes})</button>;
}
```

### TypeScript Configuration

Use strict mode for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## References

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

**Related ADRs:**
- [ADR-004: Deploy to Vercel Platform](./004-deploy-to-vercel.md)
