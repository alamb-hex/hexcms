# Components

This directory contains React components for the heXcms application.

## Structure

```
components/
├── ui/              # Reusable UI components (buttons, cards, etc.)
├── layout/          # Layout components (header, footer, sidebar)
├── posts/           # Post-specific components
├── authors/         # Author-specific components
└── shared/          # Shared utility components
```

## Component Guidelines

### File Naming

- Use PascalCase for component files: `PostCard.tsx`
- Use kebab-case for directories: `post-card/`
- One component per file
- Co-locate tests: `PostCard.test.tsx`
- Co-locate styles if needed: `PostCard.module.css`

### Component Structure

```typescript
import type { ComponentProps } from 'react';

interface PostCardProps {
  title: string;
  excerpt?: string;
  // ... other props
}

export function PostCard({ title, excerpt }: PostCardProps) {
  return (
    <article>
      <h2>{title}</h2>
      {excerpt && <p>{excerpt}</p>}
    </article>
  );
}
```

### Best Practices

1. **Use TypeScript**: Always type your props
2. **Server Components by default**: Only use 'use client' when needed
3. **Extract reusable logic**: Use custom hooks
4. **Keep components small**: Single responsibility principle
5. **Test components**: Write unit tests for complex logic

## TODO (Phase 1)

Components to implement:

### UI Components
- [ ] Button
- [ ] Card
- [ ] Badge
- [ ] Avatar
- [ ] Link (with active state)

### Layout Components
- [ ] Header
- [ ] Footer
- [ ] Container
- [ ] Sidebar (for blog layout)

### Post Components
- [ ] PostCard (for post listings)
- [ ] PostList
- [ ] PostContent (for full post display)
- [ ] PostMeta (author, date, reading time)
- [ ] PostNavigation (previous/next)

### Author Components
- [ ] AuthorCard
- [ ] AuthorBio
- [ ] AuthorAvatar

### Shared Components
- [ ] SearchBar
- [ ] Pagination
- [ ] TagList
- [ ] TableOfContents
- [ ] SocialLinks

## Example

See `src/app/page.tsx` for example of using components in pages.
