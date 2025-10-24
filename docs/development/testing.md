# Testing Guide

> Testing strategy and practices for heXcms

---

## Testing Philosophy

**Goals:**
- Catch bugs early
- Enable confident refactoring
- Document behavior
- Maintain code quality

**Balance:**
- Test important functionality
- Don't over-test simple code
- Focus on user-facing features
- Test edge cases

---

## Testing Stack

### Recommended Tools

```json
{
  "devDependencies": {
    "vitest": "^1.3.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@playwright/test": "^1.42.0"
  }
}
```

### Why These Tools?

**Vitest:**
- Fast (native ESM, multithreading)
- Vite-compatible
- Jest-compatible API
- Great DX

**Testing Library:**
- User-centric testing
- Encourages good practices
- Works with React Server Components

**Playwright:**
- Cross-browser E2E testing
- Fast and reliable
- Great debugging tools

---

## Test Types

### 1. Unit Tests

**What to test:**
- Utility functions
- Markdown processing
- Data transformations
- Business logic

**Example: Markdown Processor**

```typescript
// src/lib/markdown/__tests__/processor.test.ts
import { describe, it, expect } from 'vitest';
import { markdownToHtml, calculateReadingTime } from '../processor';

describe('markdownToHtml', () => {
  it('converts markdown to HTML', async () => {
    const markdown = '# Hello World';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('<h1>Hello World</h1>');
  });

  it('handles code blocks with syntax highlighting', async () => {
    const markdown = '```javascript\nconst x = 10;\n```';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('<code');
    expect(html).toContain('javascript');
  });

  it('auto-links headings', async () => {
    const markdown = '## My Heading';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('id="my-heading"');
  });
});

describe('calculateReadingTime', () => {
  it('calculates reading time correctly', () => {
    const content = 'word '.repeat(200); // 200 words
    const time = calculateReadingTime(content);

    expect(time).toBe(1); // 1 minute
  });

  it('rounds up partial minutes', () => {
    const content = 'word '.repeat(250); // 250 words
    const time = calculateReadingTime(content);

    expect(time).toBe(2); // Rounds up to 2 minutes
  });
});
```

---

### 2. Integration Tests

**What to test:**
- API endpoints
- Database operations
- Sync workflow
- Component interactions

**Example: API Endpoint**

```typescript
// src/app/api/sync-content/__tests__/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../route';
import { createMocks } from 'node-mocks-http';

describe('POST /api/sync-content', () => {
  it('returns 401 for invalid signature', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'x-hub-signature-256': 'sha256=invalid',
      },
      body: JSON.stringify({ commits: [] }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid signature');
  });

  it('syncs content on valid webhook', async () => {
    // Create valid signature
    const payload = JSON.stringify({
      commits: [{
        added: ['content/posts/test.md'],
        modified: [],
        removed: [],
      }],
    });

    const signature = createSignature(payload);

    const { req } = createMocks({
      method: 'POST',
      headers: {
        'x-hub-signature-256': signature,
      },
      body: payload,
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.filesProcessed).toBe(1);
  });
});
```

---

**Example: Database Queries**

```typescript
// src/lib/queries/__tests__/posts.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPublishedPosts, getPostBySlug, upsertPost } from '../posts';

describe('Post Queries', () => {
  beforeEach(async () => {
    // Set up test database
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Clean up
    await teardownTestDatabase();
  });

  it('fetches published posts only', async () => {
    await seedPosts([
      { slug: 'post-1', status: 'published' },
      { slug: 'post-2', status: 'draft' },
    ]);

    const posts = await getPublishedPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe('post-1');
  });

  it('gets post by slug', async () => {
    await seedPosts([
      { slug: 'test-post', title: 'Test Post' },
    ]);

    const post = await getPostBySlug('test-post');

    expect(post).toBeDefined();
    expect(post?.title).toBe('Test Post');
  });

  it('upserts post correctly', async () => {
    const postData = {
      slug: 'new-post',
      title: 'New Post',
      content: 'Content',
      status: 'published',
    };

    await upsertPost(postData);

    const post = await getPostBySlug('new-post');
    expect(post?.title).toBe('New Post');
  });
});
```

---

### 3. Component Tests

**What to test:**
- Component rendering
- User interactions
- Props handling
- Conditional rendering

**Example: Post Card Component**

```typescript
// src/components/blog/__tests__/PostCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from '../PostCard';

describe('PostCard', () => {
  const mockPost = {
    id: 1,
    slug: 'test-post',
    title: 'Test Post',
    excerpt: 'This is a test post',
    publishedAt: new Date('2024-01-15'),
    readingTime: 5,
    authorName: 'John Doe',
  };

  it('renders post information', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('This is a test post')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays reading time', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText(/5 min read/i)).toBeInTheDocument();
  });

  it('links to correct post URL', () => {
    render(<PostCard post={mockPost} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/test-post');
  });
});
```

---

### 4. E2E Tests

**What to test:**
- Critical user flows
- Page navigation
- Form submissions
- Search functionality

**Example: Blog Navigation**

```typescript
// tests/e2e/blog.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test('displays blog posts', async ({ page }) => {
    await page.goto('/blog');

    // Check page loaded
    await expect(page.locator('h1')).toContainText('Blog');

    // Check posts are displayed
    const posts = page.locator('[data-testid="post-card"]');
    await expect(posts).toHaveCount(20); // Assuming 20 posts per page
  });

  test('navigates to single post', async ({ page }) => {
    await page.goto('/blog');

    // Click first post
    const firstPost = page.locator('[data-testid="post-card"]').first();
    const title = await firstPost.locator('h2').textContent();
    await firstPost.click();

    // Check navigated to post page
    await expect(page.locator('article h1')).toContainText(title!);
  });

  test('filters by tag', async ({ page }) => {
    await page.goto('/blog');

    // Click a tag
    const tag = page.locator('[data-testid="tag"]').first();
    const tagName = await tag.textContent();
    await tag.click();

    // Check filtered page
    await expect(page).toHaveURL(/\/blog\/tag\//);
    await expect(page.locator('h1')).toContainText(`Posts tagged "${tagName}"`);
  });
});
```

---

## Test Configuration

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup

```typescript
// test/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
beforeAll(() => {
  process.env.POSTGRES_URL = 'postgres://test';
  process.env.GITHUB_TOKEN = 'test-token';
  process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';
});
```

---

## Testing Patterns

### Mocking

**Mock external dependencies:**

```typescript
import { vi } from 'vitest';

// Mock GitHub API
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => ({
    repos: {
      getContent: vi.fn(() => ({
        data: { content: Buffer.from('# Test').toString('base64') },
      })),
    },
  })),
}));

// Mock database
vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(() => Promise.resolve({ rows: [] })),
}));
```

---

### Fixtures

**Create reusable test data:**

```typescript
// test/fixtures/posts.ts
export const mockPost = {
  id: 1,
  slug: 'test-post',
  title: 'Test Post',
  content: 'Content',
  htmlContent: '<p>Content</p>',
  status: 'published',
  publishedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

export const mockPosts = [
  mockPost,
  { ...mockPost, id: 2, slug: 'test-post-2', title: 'Test Post 2' },
  { ...mockPost, id: 3, slug: 'test-post-3', title: 'Test Post 3' },
];
```

---

### Test Helpers

```typescript
// test/helpers/database.ts
export async function setupTestDatabase() {
  // Create test database tables
  await sql`CREATE TABLE IF NOT EXISTS posts (...)`;
}

export async function teardownTestDatabase() {
  // Clean up test database
  await sql`DROP TABLE IF EXISTS posts`;
}

export async function seedPosts(posts: Partial<Post>[]) {
  for (const post of posts) {
    await upsertPost(post);
  }
}
```

---

## Coverage

### Run Coverage Report

```bash
npm test -- --coverage
```

### Coverage Goals

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

### What to Prioritize

**High priority:**
- Business logic
- Data transformations
- API endpoints
- Critical user flows

**Lower priority:**
- Simple components
- Type definitions
- Configuration files

---

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Testing implementation details
it('calls processMarkdown', () => {
  const spy = vi.spyOn(processor, 'processMarkdown');
  syncContent(payload);
  expect(spy).toHaveBeenCalled();
});

// ✅ Good: Testing behavior
it('syncs markdown content to database', async () => {
  await syncContent(payload);
  const post = await getPostBySlug('test-post');
  expect(post).toBeDefined();
});
```

---

### 2. Keep Tests Independent

```typescript
// ❌ Bad: Tests depend on each other
it('creates post', async () => {
  post = await createPost({ title: 'Test' });
});

it('updates post', async () => {
  await updatePost(post.id, { title: 'Updated' });
});

// ✅ Good: Independent tests
it('creates post', async () => {
  const post = await createPost({ title: 'Test' });
  expect(post).toBeDefined();
});

it('updates post', async () => {
  const post = await createPost({ title: 'Test' });
  await updatePost(post.id, { title: 'Updated' });
  const updated = await getPost(post.id);
  expect(updated.title).toBe('Updated');
});
```

---

### 3. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { });
it('test 1', () => { });

// ✅ Good
it('returns 401 when webhook signature is invalid', () => { });
it('syncs all changed files from webhook payload', () => { });
```

---

### 4. Test Edge Cases

```typescript
describe('getPostBySlug', () => {
  it('returns post when found', async () => { });
  it('returns null when post not found', async () => { });
  it('handles special characters in slug', async () => { });
  it('handles very long slugs', async () => { });
  it('is case-insensitive', async () => { });
});
```

---

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm test -- --watch
```

### Specific File

```bash
npm test processor.test.ts
```

### Coverage

```bash
npm test -- --coverage
```

### E2E Tests

```bash
npx playwright test
npx playwright test --ui  # With UI
npx playwright test --debug  # Debug mode
```

---

## Debugging Tests

### Vitest

```typescript
import { describe, it } from 'vitest';

it('debugs test', () => {
  debugger; // Will pause in VS Code
  const result = myFunction();
  console.log('Result:', result);
});
```

### Playwright

```bash
# Run with debugger
npx playwright test --debug

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

---

## Resources

- [Vitest Docs](https://vitest.dev)
- [Testing Library Docs](https://testing-library.com)
- [Playwright Docs](https://playwright.dev)

---

**Last Updated:** 2025-10-23
**See also:** [Contributing Guide](./contributing.md)
