# Security Guide

> Comprehensive security practices for heXcms

---

## Security Philosophy

**Zero-Trust Approach:** Assume all input is malicious, validate everything, and fail securely.

### Core Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal permissions required
3. **Secure by Default** - Security built-in, not bolted-on
4. **Fail Securely** - Errors don't expose vulnerabilities
5. **Keep it Simple** - Complexity is the enemy of security

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation & Sanitization](#input-validation--sanitization)
3. [SQL Injection Prevention](#sql-injection-prevention)
4. [XSS Protection](#xss-protection)
5. [CSRF Protection](#csrf-protection)
6. [Webhook Security](#webhook-security)
7. [Environment Variables & Secrets](#environment-variables--secrets)
8. [Dependency Security](#dependency-security)
9. [Rate Limiting](#rate-limiting)
10. [Logging & Monitoring](#logging--monitoring)
11. [Deployment Security](#deployment-security)
12. [Incident Response](#incident-response)

---

## Authentication & Authorization

### API Authentication

**Webhook Secret Verification:**

```typescript
// ✅ CORRECT: Constant-time comparison
import { timingSafeEqual } from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = 'sha256=' +
    createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    const receivedBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    return receivedBuffer.length === expectedBuffer.length &&
           timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ❌ WRONG: Simple string comparison (timing attack vulnerable)
return signature === expectedSignature;
```

**Secret Validation:**

```typescript
// src/lib/auth/secrets.ts
export function validateSecret(provided: string, expected: string): boolean {
  if (!provided || !expected) {
    return false;
  }

  // Use timing-safe comparison
  try {
    return timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}
```

**API Route Protection:**

```typescript
// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateSecret } from '@/lib/auth/secrets';

export async function POST(request: NextRequest) {
  const { secret } = await request.json();

  // Validate secret
  if (!validateSecret(secret, process.env.REVALIDATION_SECRET!)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Continue with authenticated logic...
}
```

---

## Input Validation & Sanitization

### Zod Schema Validation

**Always validate input with Zod:**

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

export const webhookPayloadSchema = z.object({
  ref: z.string(),
  commits: z.array(z.object({
    id: z.string(),
    message: z.string(),
    added: z.array(z.string()),
    modified: z.array(z.string()),
    removed: z.array(z.string()),
  })),
  repository: z.object({
    name: z.string(),
    full_name: z.string(),
  }),
});

export const postFrontmatterSchema = z.object({
  title: z.string().min(1).max(500),
  excerpt: z.string().max(1000).optional(),
  author: z.string().regex(/^[a-z0-9-]+$/), // Slug format only
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string()).max(10),
  status: z.enum(['draft', 'published', 'archived']),
});
```

**Usage in API routes:**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate input
  const result = webhookPayloadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Invalid payload',
        details: result.error.issues
      },
      { status: 400 }
    );
  }

  // Now safely use validated data
  const payload = result.data;
  // ...
}
```

### Sanitize File Paths

```typescript
// ✅ CORRECT: Validate and sanitize file paths
import path from 'path';

export function sanitizeFilePath(filepath: string): string | null {
  // Remove any path traversal attempts
  const normalized = path.normalize(filepath);

  // Ensure file is within content directory
  if (normalized.includes('..') || normalized.startsWith('/')) {
    return null; // Reject path traversal attempts
  }

  // Ensure it's a markdown file
  if (!normalized.endsWith('.md')) {
    return null;
  }

  return normalized;
}

// Usage
const userProvidedPath = getPathFromWebhook();
const safePath = sanitizeFilePath(userProvidedPath);

if (!safePath) {
  throw new Error('Invalid file path');
}
```

---

## SQL Injection Prevention

### ALWAYS Use Parameterized Queries

```typescript
// ✅ CORRECT: Parameterized queries
import { sql } from '@vercel/postgres';

export async function getPostBySlug(slug: string) {
  // Parameter is safely escaped
  const { rows } = await sql`
    SELECT * FROM posts
    WHERE slug = ${slug}
    AND status = 'published'
  `;

  return rows[0];
}

// ❌ WRONG: String concatenation (SQL INJECTION!)
const { rows } = await sql`
  SELECT * FROM posts
  WHERE slug = '${slug}'
`;
```

### Dynamic Column Names (Use Allowlist)

```typescript
// ✅ CORRECT: Allowlist for column names
const ALLOWED_SORT_COLUMNS = ['published_at', 'title', 'view_count'] as const;
type SortColumn = typeof ALLOWED_SORT_COLUMNS[number];

export async function getPosts(sortBy: string = 'published_at') {
  // Validate against allowlist
  if (!ALLOWED_SORT_COLUMNS.includes(sortBy as SortColumn)) {
    sortBy = 'published_at'; // Default fallback
  }

  // Now safe to use in query
  const { rows } = await sql`
    SELECT * FROM posts
    ORDER BY ${sql.unsafe(sortBy)} DESC
  `;

  return rows;
}

// ❌ WRONG: Direct user input in column name
const { rows } = await sql`
  SELECT * FROM posts
  ORDER BY ${userInput} DESC
`;
```

### Use Prepared Statements for Repeated Queries

```typescript
// For high-frequency queries
export async function batchInsertPosts(posts: Post[]) {
  // Use transaction for atomicity
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO posts (slug, title, content, author_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE
      SET title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = NOW()
    `;

    for (const post of posts) {
      await client.query(insertQuery, [
        post.slug,
        post.title,
        post.content,
        post.authorId
      ]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## XSS Protection

### Output Encoding

**React automatically escapes by default:**

```tsx
// ✅ SAFE: React escapes automatically
<h1>{post.title}</h1>
<p>{post.excerpt}</p>

// ⚠️ DANGEROUS: Only use for trusted HTML
<div dangerouslySetInnerHTML={{ __html: post.htmlContent }} />
```

### Sanitize HTML Content

```typescript
// src/lib/markdown/processor.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize) // ✅ Sanitizes HTML
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}
```

### Content Security Policy (CSP)

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com", // Vercel Analytics
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: '/:path*',
};
```

---

## CSRF Protection

### API Routes with Secret Tokens

```typescript
// All state-changing operations require secret
export async function POST(request: NextRequest) {
  const { secret, ...data } = await request.json();

  // Verify secret
  if (!validateSecret(secret, process.env.API_SECRET!)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

  // Process request...
}
```

### SameSite Cookies (If Using Sessions)

```typescript
// If implementing authentication with cookies
import { cookies } from 'next/headers';

export function setAuthCookie(token: string) {
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}
```

---

## Webhook Security

### Complete Webhook Verification

```typescript
// src/app/api/sync-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/sync/github';

export async function POST(request: NextRequest) {
  // 1. Check signature header exists
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 401 }
    );
  }

  // 2. Get raw body (important for signature verification)
  const body = await request.text();

  // 3. Verify signature
  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.GITHUB_WEBHOOK_SECRET!
  );

  if (!isValid) {
    console.error('Invalid webhook signature');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // 4. Parse and validate payload
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // 5. Validate with Zod
  const result = webhookPayloadSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid payload structure' },
      { status: 400 }
    );
  }

  // 6. Process webhook
  // ...
}
```

### Webhook Event Validation

```typescript
// Only accept push events
export async function POST(request: NextRequest) {
  const event = request.headers.get('x-github-event');

  if (event !== 'push') {
    return NextResponse.json(
      { error: 'Only push events accepted' },
      { status: 400 }
    );
  }

  // Continue...
}
```

---

## Environment Variables & Secrets

### Secret Management

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  POSTGRES_URL: z.string().url(),

  // GitHub
  GITHUB_TOKEN: z.string().min(20),
  GITHUB_WEBHOOK_SECRET: z.string().min(32),
  GITHUB_REPO_OWNER: z.string(),
  GITHUB_REPO_NAME: z.string(),

  // API Secrets
  REVALIDATION_SECRET: z.string().min(32),
  ADMIN_SECRET: z.string().min(32).optional(),

  // App
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);

// Now TypeScript knows these are validated
// env.GITHUB_TOKEN is guaranteed to exist and be > 20 chars
```

### .env File Security

```bash
# .gitignore
.env
.env.local
.env.*.local
.env.production

# NEVER commit:
# ❌ .env
# ❌ .env.local
# ❌ Any file with real secrets
```

### Secret Rotation

```typescript
// src/scripts/rotate-secrets.ts

/**
 * Rotate secrets regularly (quarterly recommended)
 *
 * Process:
 * 1. Generate new secret
 * 2. Update in Vercel
 * 3. Update in GitHub webhook
 * 4. Deploy
 * 5. Verify
 * 6. Remove old secret
 */

export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

console.log('New webhook secret:', generateSecret());
console.log('New revalidation secret:', generateSecret());
```

---

## Dependency Security

### Regular Audits

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (use with caution)
npm audit fix

# Fix all including breaking changes
npm audit fix --force

# Check specific package
npm audit --package=package-name
```

### Dependency Updates

```json
// package.json - Use exact versions for production
{
  "dependencies": {
    "next": "14.2.0",  // ✅ Exact version
    "react": "^18.3.0" // ⚠️ Caret allows minor updates
  }
}
```

### Automated Security Checks

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  push:
    branches: [main]
  pull_request:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Check for outdated packages
        run: npm outdated || true
```

### Dependency Review

- **Before installing:** Check npm package reputation
- **Review bundle size:** Large packages = attack surface
- **Check last update:** Abandoned packages are risky
- **Review dependencies:** Avoid packages with many deps

---

## Rate Limiting

### Simple In-Memory Rate Limiter

```typescript
// src/lib/rate-limit.ts
interface RateLimitStore {
  [key: string]: number[];
}

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = identifier;

  // Get existing requests
  const requests = store[key] || [];

  // Filter out requests outside the window
  const recentRequests = requests.filter(time => now - time < windowMs);

  // Check if limit exceeded
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }

  // Add current request
  recentRequests.push(now);
  store[key] = recentRequests;

  return true; // Request allowed
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    store[key] = store[key].filter(time => now - time < 60000);
    if (store[key].length === 0) {
      delete store[key];
    }
  }
}, 60000);
```

### Usage in API Routes

```typescript
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit: 20 requests per minute
  if (!rateLimit(ip, 20, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Process request...
}
```

### Vercel Edge Config (Production)

For production, use Vercel's Edge Config or Upstash Redis for distributed rate limiting.

---

## Logging & Monitoring

### Structured Logging

```typescript
// src/lib/logger.ts
type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: string;
}

export function log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error?.message,
  };

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (Sentry, LogRocket, etc.)
    console.log(JSON.stringify(entry));
  } else {
    // Pretty print in development
    console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context || '');
  }
}

// Usage
log('info', 'Webhook received', { repository: 'blog-content' });
log('error', 'Sync failed', { file: 'post.md' }, error);
```

### Security Event Logging

```typescript
// Log security-relevant events
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical'
) {
  log('warn', `SECURITY: ${event}`, {
    ...details,
    severity,
    timestamp: new Date().toISOString(),
  });

  // In production, send to security monitoring
  if (process.env.NODE_ENV === 'production' && severity === 'critical') {
    // Alert security team
  }
}

// Usage
logSecurityEvent('invalid_webhook_signature', {
  ip: request.headers.get('x-forwarded-for'),
  signature: signature.substring(0, 10) + '...',
}, 'high');
```

---

## Deployment Security

### Vercel Security Settings

1. **Enable Password Protection** (for preview deployments)
2. **Configure Edge Config** for secrets
3. **Enable DDoS Protection**
4. **Use Environment Variables** (never hardcode secrets)
5. **Enable Vercel Firewall** (Pro plan)

### Secure Headers

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

---

## Incident Response

### Security Incident Playbook

**If you discover a vulnerability:**

1. **Assess severity**
   - Critical: Immediate action required
   - High: Fix within 24 hours
   - Medium: Fix within 1 week
   - Low: Include in next release

2. **Contain the issue**
   - Disable affected feature if needed
   - Rotate compromised secrets
   - Block malicious IPs

3. **Fix the vulnerability**
   - Patch the code
   - Deploy immediately
   - Verify fix

4. **Post-incident**
   - Document what happened
   - Update security procedures
   - Inform affected users if needed

### Emergency Contacts

```markdown
# Create SECURITY.md in repo root

## Reporting Security Issues

**Do NOT create a public GitHub issue for security vulnerabilities.**

Instead, email security@yourdomain.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your contact information

We will respond within 24 hours.
```

---

## Security Checklist

See [Security Checklist](./security-checklist.md) for a complete audit checklist.

---

## Security Resources

### Tools
- **npm audit** - Dependency vulnerabilities
- **Snyk** - Continuous security monitoring
- **Dependabot** - Automated dependency updates
- **OWASP ZAP** - Web application security scanner

### References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#security)
- [Vercel Security](https://vercel.com/docs/security/secure-your-application)

---

**Last Updated:** 2025-10-23
**Next Review:** Quarterly

**See also:**
- [Security Checklist](./security-checklist.md)
- [Deployment Guide](./deployment.md)
- [API Documentation](../reference/api.md)
