# API Documentation

## Overview

This CMS exposes several API endpoints for content synchronization, revalidation, and preview functionality.

## Base URL

```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

---

## Endpoints

### 1. Sync Content Webhook

Receives GitHub webhook events and syncs content to the database.

**Endpoint:** `POST /api/sync-content`

**Authentication:** GitHub webhook signature (HMAC-SHA256)

**Headers:**
```
Content-Type: application/json
X-Hub-Signature-256: sha256=<signature>
X-GitHub-Event: push
X-GitHub-Delivery: <uuid>
```

**Request Body:** GitHub webhook payload

```json
{
  "ref": "refs/heads/main",
  "before": "abc123...",
  "after": "def456...",
  "repository": {
    "id": 123456,
    "name": "blog-content",
    "full_name": "username/blog-content",
    "owner": {
      "name": "username"
    }
  },
  "commits": [
    {
      "id": "def456",
      "message": "Add new blog post",
      "timestamp": "2024-01-15T10:30:00Z",
      "added": ["content/posts/new-post.md"],
      "modified": [],
      "removed": []
    }
  ],
  "head_commit": {
    "id": "def456",
    "message": "Add new blog post"
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "filesProcessed": 3,
  "postsAdded": 2,
  "postsUpdated": 1,
  "postsDeleted": 0,
  "duration": 1250,
  "message": "Content synced successfully"
}
```

**Error Responses:**

`401 Unauthorized` - Invalid webhook signature
```json
{
  "error": "Invalid signature"
}
```

`400 Bad Request` - Invalid payload
```json
{
  "error": "Invalid webhook payload"
}
```

`500 Internal Server Error` - Sync failed
```json
{
  "error": "Sync failed",
  "details": "Database connection error"
}
```

**Implementation Example:**

```typescript
// src/app/api/sync-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/sync/github';
import { syncContent } from '@/lib/sync/syncer';

export async function POST(request: NextRequest) {
  try {
    // Get signature from headers
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const body = await request.text();
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.GITHUB_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);

    // Process webhook
    const result = await syncContent(payload);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### 2. On-Demand Revalidation

Triggers ISR revalidation for specific paths.

**Endpoint:** `POST /api/revalidate`

**Authentication:** Secret token

**Headers:**
```
Content-Type: application/json
```

**Request Body:**

```json
{
  "secret": "your-revalidation-secret",
  "path": "/blog/my-post-slug",
  "type": "post"
}
```

**Parameters:**
- `secret` (required) - Revalidation secret from environment
- `path` (optional) - Specific path to revalidate
- `type` (optional) - Type of content: 'post', 'tag', 'author', 'all'

**Response:** `200 OK`

```json
{
  "revalidated": true,
  "paths": ["/blog/my-post-slug", "/blog"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

`401 Unauthorized` - Invalid secret
```json
{
  "message": "Invalid token"
}
```

`400 Bad Request` - Missing parameters
```json
{
  "message": "Missing required parameters"
}
```

**Implementation Example:**

```typescript
// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, path, type } = body;

  // Verify secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    );
  }

  try {
    const paths: string[] = [];

    // Revalidate based on type
    if (path) {
      revalidatePath(path);
      paths.push(path);
    }

    if (type === 'post' && path) {
      // Also revalidate blog listing
      revalidatePath('/blog');
      paths.push('/blog');
    }

    if (type === 'all') {
      // Revalidate common paths
      revalidatePath('/blog');
      revalidatePath('/');
      paths.push('/blog', '/');
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error revalidating', error: error.message },
      { status: 500 }
    );
  }
}
```

---

### 3. Draft Preview

Enable preview mode for draft posts.

**Endpoint:** `GET /api/preview`

**Authentication:** Secret token

**Query Parameters:**
- `secret` (required) - Preview secret
- `slug` (required) - Post slug to preview
- `redirect` (optional) - Custom redirect path

**Example:**
```
GET /api/preview?secret=your-secret&slug=draft-post
```

**Response:** `307 Temporary Redirect`

Sets preview cookies and redirects to the post:
```
Location: /blog/draft-post
Set-Cookie: __prerender_bypass=...; __next_preview_data=...
```

**Error Responses:**

`401 Unauthorized` - Invalid secret
```json
{
  "message": "Invalid token"
}
```

`404 Not Found` - Post not found
```json
{
  "message": "Post not found"
}
```

**Implementation Example:**

```typescript
// src/app/api/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { getPostBySlug } from '@/lib/queries/posts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');

  // Verify secret
  if (secret !== process.env.PREVIEW_SECRET) {
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    );
  }

  if (!slug) {
    return NextResponse.json(
      { message: 'Missing slug parameter' },
      { status: 400 }
    );
  }

  // Check if post exists
  const post = await getPostBySlug(slug, true); // Include drafts
  if (!post) {
    return NextResponse.json(
      { message: 'Post not found' },
      { status: 404 }
    );
  }

  // Enable Draft Mode
  draftMode().enable();

  // Redirect to the post
  const redirect = searchParams.get('redirect') || `/blog/${slug}`;
  return NextResponse.redirect(new URL(redirect, request.url));
}
```

---

### 4. Disable Preview

Exit preview mode.

**Endpoint:** `GET /api/preview/disable`

**Response:** `307 Temporary Redirect`

Clears preview cookies and redirects to home:
```
Location: /
Set-Cookie: __prerender_bypass=; __next_preview_data=; Max-Age=0
```

**Implementation Example:**

```typescript
// src/app/api/preview/disable/route.ts
import { NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

export async function GET() {
  draftMode().disable();
  return NextResponse.redirect(new URL('/', request.url));
}
```

---

### 5. Manual Sync (Optional)

Trigger a manual full sync of all content.

**Endpoint:** `POST /api/sync/manual`

**Authentication:** Admin secret

**Headers:**
```
Content-Type: application/json
```

**Request Body:**

```json
{
  "secret": "admin-secret",
  "type": "full",
  "dryRun": false
}
```

**Parameters:**
- `secret` (required) - Admin secret
- `type` (optional) - 'full' or 'incremental' (default: 'incremental')
- `dryRun` (optional) - Preview changes without applying (default: false)

**Response:** `200 OK`

```json
{
  "success": true,
  "type": "full",
  "filesProcessed": 150,
  "postsAdded": 5,
  "postsUpdated": 10,
  "postsDeleted": 2,
  "authorsProcessed": 3,
  "tagsProcessed": 20,
  "duration": 5420,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Implementation Example:**

```typescript
// src/app/api/sync/manual/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { syncAllContent } from '@/lib/sync/syncer';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, type = 'incremental', dryRun = false } = body;

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await syncAllContent({ type, dryRun });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### 6. Health Check

Check API and database health.

**Endpoint:** `GET /api/health`

**Response:** `200 OK`

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

**Implementation Example:**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Test database connection
    await sql`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message
      },
      { status: 503 }
    );
  }
}
```

---

## Webhook Setup (GitHub)

### Configure GitHub Webhook

1. Go to your content repository on GitHub
2. Settings → Webhooks → Add webhook

**Configuration:**
- Payload URL: `https://yourdomain.com/api/sync-content`
- Content type: `application/json`
- Secret: Your webhook secret
- Events: Select "Just the push event"
- Active: ✓ Checked

### Webhook Signature Verification

```typescript
// src/lib/sync/github.ts
import { createHmac } from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = 
    'sha256=' + 
    createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  return signature === expectedSignature;
}
```

---

## Rate Limiting

### Recommended Limits

```typescript
// Simple in-memory rate limiter
const rateLimits = new Map<string, number[]>();

function rateLimit(ip: string, limit = 10, window = 60000): boolean {
  const now = Date.now();
  const requests = rateLimits.get(ip) || [];
  
  // Filter out old requests
  const recentRequests = requests.filter(time => now - time < window);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimits.set(ip, recentRequests);
  return true;
}
```

**Recommended Limits:**
- `/api/sync-content`: 20 requests per minute
- `/api/revalidate`: 60 requests per minute
- `/api/preview`: 100 requests per minute

---

## Error Handling

### Standard Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
  timestamp: string;
  path: string;
}
```

### Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |
| 503 | Service Unavailable - Database/service down |

---

## Testing

### Test Webhook Locally

Use ngrok to expose local server:

```bash
# Start ngrok
ngrok http 3000

# Use ngrok URL in GitHub webhook
https://abc123.ngrok.io/api/sync-content
```

### Manual Testing

```bash
# Test sync endpoint (simulate GitHub webhook)
curl -X POST http://localhost:3000/api/sync-content \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d @webhook-payload.json

# Test revalidation
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-secret",
    "path": "/blog/test-post"
  }'

# Test preview
curl http://localhost:3000/api/preview?secret=your-secret&slug=draft-post

# Test health
curl http://localhost:3000/api/health
```

---

## Security Best Practices

### 1. Webhook Security
- Always verify signatures
- Use HTTPS in production
- Keep secrets secure
- Implement rate limiting

### 2. API Authentication
- Use strong secrets (32+ characters)
- Rotate secrets periodically
- Never expose secrets in client-side code
- Use environment variables

### 3. Input Validation
- Validate all inputs
- Sanitize user-provided data
- Use Zod schemas for validation
- Prevent SQL injection with parameterized queries

### 4. Error Messages
- Don't expose sensitive information
- Log detailed errors server-side
- Return generic messages to clients

---

## Monitoring & Logging

### Log Format

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  action: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: string;
}
```

### Example Logging

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  service: 'sync',
  action: 'webhook_received',
  metadata: {
    repository: payload.repository.name,
    commits: payload.commits.length,
    branch: payload.ref
  }
}));
```

### Metrics to Track

- Webhook success/failure rate
- Sync duration
- API response times
- Error rates by endpoint
- Rate limit hits
- Database query performance

---

## API Client Examples

### JavaScript/TypeScript

```typescript
// Trigger revalidation
async function revalidate(path: string) {
  const response = await fetch('/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: process.env.REVALIDATION_SECRET,
      path,
    }),
  });

  if (!response.ok) {
    throw new Error('Revalidation failed');
  }

  return response.json();
}
```

### cURL

```bash
# Revalidate a path
curl -X POST https://yourdomain.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-secret","path":"/blog/my-post"}'
```

### Python

```python
import requests

def revalidate(path: str, secret: str):
    response = requests.post(
        'https://yourdomain.com/api/revalidate',
        json={'secret': secret, 'path': path}
    )
    response.raise_for_status()
    return response.json()
```
