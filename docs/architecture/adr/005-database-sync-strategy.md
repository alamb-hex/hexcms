# ADR-005: Database Sync Strategy

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** heXcms Core Team

## Context

We need to keep the PostgreSQL database synchronized with content stored in Git repositories. The sync strategy must handle:

- New content files added to the repository
- Updated content files (modified Markdown or frontmatter)
- Deleted content files
- Moved or renamed files
- Multiple concurrent changes
- Failed sync operations and retries
- Performance with thousands of files

Key requirements:
- Sync triggered by Git webhooks (GitHub, GitLab, Gitea)
- Process only changed files (not full resync every time)
- Handle errors gracefully with logging
- Complete sync within seconds
- Support incremental updates
- Maintain referential integrity (authors, tags, posts)
- Rollback capability on errors

Constraints:
- Webhook payload size limits (5MB for GitHub)
- Serverless function timeouts (10 seconds for Vercel Edge, 60s for Node.js)
- API rate limits for Git providers
- Database connection pool limits

## Decision

We will implement a **webhook-triggered incremental sync strategy** with the following design:

1. **Webhook endpoint** receives push events from Git providers
2. **Change detection** identifies added/modified/deleted files
3. **Selective parsing** processes only changed Markdown files
4. **Upsert operations** insert new records or update existing ones
5. **Cascade deletes** remove posts when files are deleted
6. **Sync logging** tracks all operations for debugging
7. **Async processing** for large changesets (queue system)

Architecture:
```
Git Push → Webhook → API Route → Parse Changed Files → Upsert to DB → Log Sync
```

## Consequences

### Positive

- **Fast syncs**: Only process changed files (not full repository)
- **Real-time updates**: Content live within seconds of Git push
- **Audit trail**: Complete log of all sync operations
- **Error recovery**: Failed syncs logged for retry
- **Scalable**: Handles repos with thousands of files efficiently
- **Automatic**: Zero manual intervention required
- **Git-native**: Standard Git workflows work seamlessly
- **Rollback support**: Can restore to previous Git commit

### Negative

- **Webhook dependency**: Relies on webhook reliability
- **Complexity**: More complex than full resync every time
- **Edge cases**: Renamed files detected as delete + add
- **Sync delays**: Not instant (webhook + processing time)
- **Failure modes**: Webhook failures can cause drift between Git and DB
- **Debugging**: Sync issues can be harder to debug than simple full refresh

### Risks

- **Webhook failures**: Webhooks can fail silently or be blocked by firewalls
- **Race conditions**: Rapid pushes could cause concurrent sync operations
- **Large changesets**: Bulk updates might timeout serverless functions
- **Partial failures**: Some files sync successfully, others fail
- **Database drift**: If webhook missed, DB and Git can become inconsistent

## Alternatives Considered

### Alternative 1: Full Resync on Every Push

- **Pros:**
  - Simple implementation
  - No risk of drift (always in sync)
  - Easy to understand and debug
  - No state tracking needed
- **Cons:**
  - Slow for large repositories (parse all files every time)
  - Wasteful (reprocess unchanged content)
  - High database writes (update every record)
  - Long deployment times (blocks until complete)
  - Doesn't scale beyond ~100 posts
- **Reason for rejection:** Performance doesn't scale. A 1000-post blog would take minutes to sync. We need subsecond updates.

### Alternative 2: Polling Git Repository

- **Pros:**
  - No webhook dependency
  - Works with any Git provider
  - Can detect changes autonomously
  - Retry mechanism built-in
- **Cons:**
  - Not real-time (poll interval of 1-5 minutes)
  - Wastes resources (polling even with no changes)
  - API rate limits (GitHub: 5000 requests/hour)
  - Increased costs (cron job running constantly)
  - Less responsive user experience
- **Reason for rejection:** Webhooks provide instant updates. Polling is wasteful and slower. Modern Git platforms all support webhooks.

### Alternative 3: Manual Sync Command

- **Pros:**
  - Full control over when sync happens
  - Can sync from local filesystem
  - No webhook setup required
  - Simple implementation
- **Cons:**
  - Manual intervention required (not automated)
  - Easy to forget to sync
  - Poor user experience
  - Not suitable for multi-author teams
  - No CI/CD integration
- **Reason for rejection:** Automation is a core requirement. Content should be live as soon as it's pushed to Git.

### Alternative 4: Git Clone + Full Parse

- **Pros:**
  - Always 100% accurate
  - Works offline (clone once, parse locally)
  - No webhook dependency
  - Simple logic
- **Cons:**
  - Very slow (clone entire repo every time)
  - Large disk space requirements
  - High network bandwidth usage
  - Doesn't scale (1GB repo takes minutes)
  - Serverless functions can't store large repos
- **Reason for rejection:** Cloning the entire repo on every sync is prohibitively slow and wasteful.

### Alternative 5: Build-Time Static Generation

- **Pros:**
  - No runtime sync needed
  - Fast queries (everything pre-rendered)
  - Simple deployment
  - No database required
- **Cons:**
  - Slow builds for large sites (1000+ posts)
  - No dynamic queries (can't filter by tag efficiently)
  - Must rebuild entire site for one change
  - Doesn't work with Vercel's ISR (Incremental Static Regeneration has limits)
  - No real-time search
- **Reason for rejection:** This is how Gatsby/Hugo work. We specifically want runtime database queries for flexibility and performance.

## Implementation Notes

### Webhook Endpoint

API route at `/api/sync`:

```typescript
// src/app/api/sync/route.ts
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/lib/webhook';
import { syncRepository } from '@/lib/sync';

export async function POST(request: Request) {
  // Verify webhook signature (security)
  const signature = headers().get('x-hub-signature-256');
  const body = await request.text();

  if (!verifyWebhookSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = JSON.parse(body);

  // Extract changed files from webhook payload
  const { added, modified, removed } = extractChanges(payload);

  // Process changes
  await syncRepository({
    added,
    modified,
    removed,
    commitSha: payload.head_commit.id
  });

  return new Response('Sync complete', { status: 200 });
}
```

### Change Detection

GitHub webhook payload includes changed files:

```json
{
  "head_commit": {
    "id": "abc123...",
    "added": ["content/posts/2024-01-15-new-post.md"],
    "modified": ["content/posts/2024-01-10-updated.md"],
    "removed": ["content/posts/2024-01-01-deleted.md"]
  }
}
```

Extract and filter content files only:

```typescript
function extractChanges(payload: WebhookPayload) {
  const contentFiles = (files: string[]) =>
    files.filter(f => f.startsWith('content/') && f.endsWith('.md'));

  return {
    added: contentFiles(payload.head_commit.added),
    modified: contentFiles(payload.head_commit.modified),
    removed: contentFiles(payload.head_commit.removed)
  };
}
```

### File Processing

Fetch and parse only changed files:

```typescript
async function processFile(path: string, commitSha: string) {
  // Fetch file from GitHub API
  const content = await fetchFileFromGitHub(path, commitSha);

  // Parse frontmatter and content
  const { data, content: markdown } = matter(content);

  // Determine resource type from path
  if (path.startsWith('content/posts/')) {
    return { type: 'post', data, content: markdown };
  } else if (path.startsWith('content/authors/')) {
    return { type: 'author', data };
  } else if (path.startsWith('content/pages/')) {
    return { type: 'page', data, content: markdown };
  }
}
```

### Upsert to Database

Insert or update based on slug:

```typescript
async function upsertPost(post: Post, commitSha: string) {
  // Find or create author
  const author = await db.query(
    'SELECT id FROM authors WHERE slug = $1',
    [post.author]
  );

  // Upsert post
  await db.query(`
    INSERT INTO posts (
      slug, title, excerpt, content, content_html,
      author_id, status, published_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (slug)
    DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      content = EXCLUDED.content,
      content_html = EXCLUDED.content_html,
      status = EXCLUDED.status,
      published_at = EXCLUDED.published_at,
      updated_at = NOW()
  `, [
    post.slug,
    post.title,
    post.excerpt,
    post.content,
    await renderMarkdown(post.content),
    author.id,
    post.status,
    post.publishedAt
  ]);

  // Sync tags (delete old, insert new)
  await syncTags(post.slug, post.tags);

  // Log sync operation
  await logSync('post', post.slug, commitSha, 'success');
}
```

### Delete Handling

Remove from database when file is deleted:

```typescript
async function deletePost(path: string, commitSha: string) {
  const slug = extractSlugFromPath(path);

  await db.query('DELETE FROM posts WHERE slug = $1', [slug]);

  // Cascade deletes will remove post_tags entries automatically

  await logSync('post', slug, commitSha, 'deleted');
}
```

### Sync Logging

Track all operations:

```sql
INSERT INTO sync_logs (
  event_type, resource_type, resource_id,
  file_path, commit_sha, status, metadata
) VALUES (
  'sync', 'post', $1, $2, $3, 'success',
  '{"operation": "upsert"}'::jsonb
);
```

Query logs to debug issues:

```typescript
// Get recent sync operations
const logs = await db.query(`
  SELECT * FROM sync_logs
  ORDER BY created_at DESC
  LIMIT 50
`);

// Get failed syncs
const failures = await db.query(`
  SELECT * FROM sync_logs
  WHERE status = 'error'
  ORDER BY created_at DESC
`);
```

### Error Handling

Wrap sync in try/catch and log errors:

```typescript
try {
  await syncRepository(changes);
} catch (error) {
  await logSync('post', slug, commitSha, 'error', {
    error_message: error.message,
    stack: error.stack
  });

  // Don't throw - return 200 to prevent webhook retries
  // Log error for manual review
  console.error('Sync failed:', error);
}
```

### Large Changeset Handling

For bulk updates (100+ files), queue for background processing:

```typescript
if (totalChanges > 100) {
  // Queue for background processing
  await queue.add('bulk-sync', {
    added,
    modified,
    removed,
    commitSha
  });

  return new Response('Queued for processing', { status: 202 });
}
```

Use Vercel Cron Jobs or Queue system for processing.

### Manual Resync

Provide admin command for full resync:

```bash
npm run sync:full
```

Fetches all content files and resyncs database. Useful for:
- Initial setup
- Recovering from webhook failures
- Migrating to new database

## References

- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [Webhook Signature Verification](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [PostgreSQL Upsert (ON CONFLICT)](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)
- [gray-matter (Frontmatter Parser)](https://github.com/jonschlinkert/gray-matter)

---

**Related ADRs:**
- [ADR-002: Use PostgreSQL Over MongoDB](./002-use-postgresql-over-mongodb.md)
- [ADR-003: Git-Based Content Management](./003-git-based-content.md)
