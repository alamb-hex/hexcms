# Contributing Guide

> How to contribute to heXcms development

---

## Welcome Contributors!

Thank you for your interest in contributing to heXcms! This guide will help you get started.

---

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards other community members

---

## Ways to Contribute

### 1. Report Bugs

**Before submitting:**
- Check if bug already reported in Issues
- Test with latest version
- Gather reproduction steps

**Bug report should include:**
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages/screenshots
- Minimal reproduction (if possible)

**Template:**
```markdown
**Bug Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: macOS/Windows/Linux
- Node: v20.x
- Next.js: v14.x
- Database: Vercel Postgres

**Error Messages:**
```
Paste error message here
```

**Screenshots:**
If applicable
```

---

### 2. Suggest Features

**Good feature requests include:**
- Clear use case
- Expected behavior
- Why existing features don't work
- Willingness to implement (if possible)

**Template:**
```markdown
**Feature Request:**
Brief description

**Problem:**
What problem does this solve?

**Proposed Solution:**
How should it work?

**Alternatives:**
What alternatives have you considered?

**Additional Context:**
Any other relevant information
```

---

### 3. Improve Documentation

Documentation improvements are always welcome!

**Areas to improve:**
- Fix typos
- Clarify confusing sections
- Add examples
- Update outdated information
- Add missing documentation

**How to contribute docs:**
1. Fork repository
2. Edit markdown files in `docs/`
3. Test links and formatting
4. Submit pull request

---

### 4. Submit Code

See "Development Workflow" below

---

## Development Setup

### Prerequisites

- Node.js 18+ installed
- Git installed
- Vercel account (for database)
- GitHub account

### Initial Setup

```bash
# 1. Fork repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/heXcms.git
cd heXcms

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/heXcms.git

# 4. Install dependencies
npm install

# 5. Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# 6. Initialize database (if needed)
npm run db:init

# 7. Start development server
npm run dev
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/my-feature
# or
git checkout -b fix/bug-name
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

Examples:
- `feature/add-search`
- `fix/webhook-timeout`
- `docs/update-api-guide`

---

### 2. Make Changes

**Follow these guidelines:**

#### Code Style

```typescript
// ✅ Use TypeScript
interface Post {
  title: string;
  content: string;
}

// ✅ Use descriptive names
function fetchPublishedPosts() { }

// ✅ Add JSDoc comments for public APIs
/**
 * Fetches all published posts from database
 * @returns Array of published posts
 */
export async function getPublishedPosts(): Promise<Post[]> {
  // ...
}

// ✅ Handle errors
try {
  const result = await syncContent();
} catch (error) {
  console.error('Sync failed:', error);
  throw error;
}
```

#### File Organization

```
src/
├── app/              # Routes only
├── components/       # Reusable components
├── lib/              # Business logic
├── types/            # TypeScript types
```

#### Import Order

```typescript
// 1. External packages
import { sql } from '@vercel/postgres';
import matter from 'gray-matter';

// 2. Internal modules
import { markdownToHtml } from '@/lib/markdown/processor';
import { Post } from '@/types/database';

// 3. Relative imports
import { PostCard } from './PostCard';
```

---

### 3. Test Your Changes

```bash
# Run type check
npm run type-check

# Run linter
npm run lint

# Build locally
npm run build

# Run tests (when implemented)
npm test
```

**Manual testing:**
- Test in development: `npm run dev`
- Test in production build: `npm run build && npm run start`
- Test on different browsers
- Test responsive design
- Test error cases

---

### 4. Commit Changes

**Use conventional commits:**

```bash
# Format: type(scope): description

git commit -m "feat: add full-text search functionality"
git commit -m "fix: resolve webhook signature validation"
git commit -m "docs: update deployment guide"
git commit -m "refactor: simplify markdown processing"
git commit -m "test: add unit tests for sync logic"
git commit -m "chore: update dependencies"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

**Good commit messages:**
- Clear and descriptive
- Present tense ("add feature" not "added feature")
- Imperative mood ("fix bug" not "fixes bug")
- Reference issue if applicable (#123)

**Examples:**
```bash
git commit -m "feat: implement tag filtering page (#42)"
git commit -m "fix: prevent duplicate posts in sync (#38)"
git commit -m "docs: add troubleshooting section for webhooks"
```

---

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/my-feature

# Create pull request on GitHub
# Go to your fork and click "New Pull Request"
```

**Pull Request Guidelines:**

**Title:**
- Clear and descriptive
- Follow conventional commit format
- Example: `feat: add search functionality`

**Description should include:**
```markdown
## Changes
- List of changes made
- Why changes were needed

## Related Issue
Closes #123

## Testing
- How you tested the changes
- Manual testing steps
- Test coverage (if applicable)

## Screenshots
If UI changes, include before/after screenshots

## Checklist
- [ ] Code follows project style
- [ ] TypeScript types added/updated
- [ ] Documentation updated
- [ ] Tests added/updated (if applicable)
- [ ] Builds locally without errors
- [ ] No console errors
```

---

## Code Review Process

### What to Expect

1. **Automated checks:**
   - Build verification
   - TypeScript type checking
   - Linting
   - Tests (when implemented)

2. **Code review:**
   - Maintainer will review your code
   - May request changes
   - Discussion and feedback

3. **Approval and merge:**
   - Once approved, PR will be merged
   - Your changes will be in next release

### Responding to Feedback

- Be open to suggestions
- Ask questions if unclear
- Make requested changes
- Push updates to same branch
- Thank reviewers!

---

## Development Guidelines

### TypeScript

- **Always use TypeScript** (no `.js` files)
- Enable strict mode
- Define types for all public APIs
- Avoid `any` type
- Use interfaces for object shapes

```typescript
// ✅ Good
interface PostData {
  title: string;
  content: string;
  publishedAt: Date;
}

function processPost(data: PostData): void {
  // ...
}

// ❌ Bad
function processPost(data: any) {
  // ...
}
```

---

### Error Handling

- Always handle errors
- Provide meaningful error messages
- Use try-catch for async operations
- Log errors appropriately

```typescript
// ✅ Good
try {
  await sql`INSERT INTO posts ...`;
} catch (error) {
  console.error('Failed to insert post:', error);
  throw new Error(`Database insert failed: ${error.message}`);
}

// ❌ Bad
await sql`INSERT INTO posts ...`; // No error handling
```

---

### Database Queries

- Use parameterized queries (never string concatenation)
- Add indexes for frequently queried columns
- Use transactions for related operations
- Close connections properly

```typescript
// ✅ Good
const { rows } = await sql`
  SELECT * FROM posts
  WHERE slug = ${slug}
`;

// ❌ Bad - SQL injection risk
const { rows } = await sql`
  SELECT * FROM posts
  WHERE slug = '${slug}'
`;
```

---

### React Components

- Use functional components
- Use TypeScript for props
- Keep components focused and small
- Extract reusable logic to hooks

```typescript
// ✅ Good
interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  return (
    <article onClick={onClick}>
      <h2>{post.title}</h2>
    </article>
  );
}

// ❌ Bad
export function PostCard(props: any) {
  return <article>{props.post.title}</article>;
}
```

---

### Performance

- Use ISR where appropriate
- Optimize database queries
- Minimize client bundle size
- Use `next/image` for images
- Lazy load heavy components

---

## Testing Guidelines

### Types of Tests

**Unit Tests:**
- Test individual functions
- Mock external dependencies
- Fast and isolated

**Integration Tests:**
- Test multiple components together
- Test API endpoints
- Test database operations

**E2E Tests (optional):**
- Test user workflows
- Test in real browser
- Most comprehensive but slowest

### Test Structure

```typescript
// Example unit test
describe('markdownToHtml', () => {
  it('converts markdown to HTML', async () => {
    const markdown = '# Hello';
    const html = await markdownToHtml(markdown);
    expect(html).toContain('<h1>Hello</h1>');
  });

  it('handles code blocks', async () => {
    const markdown = '```js\ncode\n```';
    const html = await markdownToHtml(markdown);
    expect(html).toContain('<code');
  });
});
```

**See:** `docs/development/testing.md` for more details

---

## Documentation Standards

### Markdown Files

- Use clear headings
- Include code examples
- Link to related docs
- Keep up to date

### Code Comments

```typescript
// ✅ Good comments explain "why"
// Cache parsed markdown to avoid re-processing on every request
const cache = new Map();

// ❌ Bad comments explain "what" (code already says that)
// Create a new Map
const cache = new Map();
```

### JSDoc

```typescript
/**
 * Converts markdown content to HTML
 * @param markdown - Raw markdown string
 * @param options - Processing options
 * @returns Processed HTML string
 * @throws {Error} If markdown is invalid
 */
export async function markdownToHtml(
  markdown: string,
  options?: ProcessOptions
): Promise<string> {
  // ...
}
```

---

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features (backward compatible)
- **Patch** (0.0.1): Bug fixes

### Changelog

- Update `CHANGELOG.md` with changes
- Group by Added/Changed/Fixed/Removed
- Include PR references

---

## Getting Help

### Questions?

- Check documentation in `docs/`
- Search existing issues
- Ask in GitHub Discussions
- Join Discord (if available)

### Stuck?

- Review [Troubleshooting Guide](../guides/troubleshooting.md)
- Ask for help in PR comments
- Tag maintainers if urgent

---

## Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Credited in release notes
- Appreciated immensely!

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

## Thank You!

Every contribution, no matter how small, is valuable. Thank you for helping make heXcms better!

---

**Questions?** Open an issue or discussion on GitHub.

**Last Updated:** 2025-10-23
