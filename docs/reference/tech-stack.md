# Tech Stack & Dependencies

## Core Technologies

### Framework & Runtime
- **Next.js 14+** - React framework with App Router
- **React 18+** - UI library
- **TypeScript 5+** - Type safety
- **Node.js 18+** - Runtime environment

### Database
- **PostgreSQL** - Relational database
- **Vercel Postgres** - Managed PostgreSQL service
- **@vercel/postgres** - Vercel's Postgres client

### Styling
- **Tailwind CSS 3.4+** - Utility-first CSS framework
- **@tailwindcss/typography** - Beautiful typographic defaults for markdown content
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## Content Processing

### Markdown Parsing
- **gray-matter** - Parse YAML frontmatter from markdown files
- **unified** - Text processing framework
- **remark** - Markdown processor
- **rehype** - HTML processor

### Markdown Plugins
- **remark-gfm** - GitHub Flavored Markdown support (tables, strikethrough, task lists)
- **remark-html** - Convert markdown to HTML
- **rehype-highlight** - Syntax highlighting for code blocks
- **rehype-slug** - Add IDs to headings
- **rehype-autolink-headings** - Add links to headings
- **rehype-stringify** - Serialize HTML

---

## External APIs

### GitHub Integration
- **@octokit/rest** - GitHub REST API client
- **crypto** (Node.js built-in) - Webhook signature verification

---

## Utilities

### Date & Time
- **date-fns** or **dayjs** - Modern date utility library

### Validation
- **zod** - TypeScript-first schema validation

### Content Analysis
- **reading-time** - Estimate reading time for articles

---

## Complete Dependencies

### package.json

```json
{
  "name": "git-based-cms",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:init": "tsx scripts/init-db.ts",
    "sync": "tsx scripts/manual-sync.ts",
    "sync:full": "tsx scripts/manual-sync.ts --full"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    
    "@vercel/postgres": "^0.9.0",
    
    "gray-matter": "^4.0.3",
    "unified": "^11.0.4",
    "remark": "^15.0.1",
    "remark-gfm": "^4.0.0",
    "remark-html": "^16.0.1",
    "rehype": "^13.0.1",
    "rehype-highlight": "^7.0.0",
    "rehype-slug": "^6.0.0",
    "rehype-autolink-headings": "^7.1.0",
    "rehype-stringify": "^10.0.0",
    
    "@octokit/rest": "^20.1.1",
    
    "date-fns": "^3.6.0",
    "reading-time": "^1.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    
    "tailwindcss": "^3.4.3",
    "@tailwindcss/typography": "^0.5.13",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    
    "tsx": "^4.7.2"
  }
}
```

---

## Optional Dependencies

### ORM (Choose One)

#### Option 1: Drizzle ORM (Recommended)
```json
{
  "dependencies": {
    "drizzle-orm": "^0.30.10",
    "@vercel/postgres": "^0.9.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.21.1"
  }
}
```

**Pros:**
- Lightweight and fast
- Excellent TypeScript support
- SQL-like syntax
- Easy migration management

**Example Usage:**
```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';

const db = drizzle(sql);
const posts = await db.select().from(postsTable).limit(10);
```

#### Option 2: Prisma
```json
{
  "dependencies": {
    "@prisma/client": "^5.13.0"
  },
  "devDependencies": {
    "prisma": "^5.13.0"
  }
}
```

**Pros:**
- Mature ecosystem
- Great migration tools
- Prisma Studio for database management

**Example Usage:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const posts = await prisma.post.findMany({ take: 10 });
```

---

### Caching (Optional)

```json
{
  "dependencies": {
    "@upstash/redis": "^1.31.0"
  }
}
```

For caching frequently accessed data.

---

### Search (Optional)

#### Option 1: PostgreSQL Full-Text Search
Built into PostgreSQL, no additional dependencies needed.

#### Option 2: Algolia
```json
{
  "dependencies": {
    "algoliasearch": "^4.23.0"
  }
}
```

---

### Analytics (Optional)

```json
{
  "dependencies": {
    "@vercel/analytics": "^1.2.2",
    "@vercel/speed-insights": "^1.0.10"
  }
}
```

---

## Configuration Files

### TypeScript Configuration

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### Tailwind Configuration

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'inherit',
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5282',
              },
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

---

### PostCSS Configuration

**postcss.config.js**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### Next.js Configuration

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'your-image-domain.com',
      // Add domains for external images
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable experimental features if needed
  experimental: {
    // serverActions: true,
  },

  // Webpack customization if needed
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig
```

---

### ESLint Configuration

**.eslintrc.json**
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

---

## Environment Variables

**.env.example**
```bash
# Database
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# GitHub
GITHUB_TOKEN="ghp_..."
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
GITHUB_REPO_OWNER="your-username"
GITHUB_REPO_NAME="blog-content"
GITHUB_CONTENT_PATH="content"

# Next.js
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
REVALIDATION_SECRET="your-revalidation-secret"

# Optional Features
ENABLE_DRAFT_MODE="true"
```

---

## Dependency Selection Rationale

### Why gray-matter?
- Standard in the ecosystem
- Simple API
- Supports YAML, JSON, TOML frontmatter
- Well-maintained

### Why unified/remark/rehype?
- Pluggable architecture
- Large ecosystem of plugins
- Industry standard for markdown processing
- Future-proof (MDX support available)

### Why @octokit/rest?
- Official GitHub SDK
- Type-safe
- Well-documented
- Handles authentication and rate limiting

### Why date-fns over moment?
- Smaller bundle size (tree-shakeable)
- Immutable API
- Modern ES6+ syntax
- No need to import entire library

### Why Tailwind CSS?
- Utility-first approach
- Excellent for rapid development
- Built-in responsive design
- Typography plugin perfect for blog content
- Production optimizations (PurgeCSS built-in)

---

## Version Compatibility

### Node.js Versions
- **Minimum**: Node.js 18.17.0
- **Recommended**: Node.js 20.x (LTS)
- **Tested**: Node.js 18.x, 20.x, 21.x

### Next.js Features Used
- App Router (stable in 13.4+)
- Server Components
- Server Actions (if used)
- ISR (Incremental Static Regeneration)
- Route Handlers (API routes)

---

## Installation Instructions

### Fresh Install

```bash
# Create new Next.js project
npx create-next-app@latest my-cms --typescript --tailwind --app

cd my-cms

# Install dependencies
npm install @vercel/postgres gray-matter unified remark remark-gfm remark-html rehype rehype-highlight rehype-slug rehype-autolink-headings rehype-stringify @octokit/rest date-fns reading-time zod

# Install dev dependencies
npm install -D @tailwindcss/typography tsx

# Initialize Git
git init
```

---

### Adding to Existing Project

```bash
# Install core dependencies
npm install @vercel/postgres gray-matter unified remark remark-gfm rehype rehype-highlight rehype-slug rehype-autolink-headings @octokit/rest date-fns reading-time zod

# Install Tailwind (if not already installed)
npm install -D tailwindcss @tailwindcss/typography postcss autoprefixer
npx tailwindcss init -p
```

---

## Build & Bundle Size Optimization

### Code Splitting
Next.js automatically code-splits by route.

### Dynamic Imports
```typescript
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### Dependency Analysis
```bash
# Analyze bundle
npm run build

# Use webpack-bundle-analyzer (optional)
npm install -D @next/bundle-analyzer
```

### Expected Bundle Sizes
- Initial JS: ~80-100KB (gzipped)
- Total page weight: ~150-200KB (first load)
- Subsequent pages: ~20-30KB

---

## Development Tools

### Recommended VSCode Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- PostCSS Language Support
- TypeScript Error Translator

### VSCode Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## Update Strategy

### Keeping Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update all to latest (be careful)
npm update

# Update specific package
npm install package-name@latest

# Use npm-check-updates (optional)
npx npm-check-updates -u
npm install
```

### Major Version Updates
Test thoroughly before upgrading:
- Next.js major versions
- React major versions
- Database clients

---

## Security Considerations

### Dependency Auditing

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (when possible)
npm audit fix

# Check specific package
npm audit --package=package-name
```

### Keep Updated
- Review security advisories
- Update dependencies regularly
- Use Dependabot or Renovate for automated updates

---

## Performance Monitoring

### Recommended Tools
- **Vercel Analytics** - Built-in analytics
- **Vercel Speed Insights** - Core Web Vitals monitoring
- **Sentry** - Error tracking (optional)
- **LogRocket** - Session replay (optional)

### Bundle Size Tools
```bash
# Install bundle analyzer
npm install -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true npm run build
```
