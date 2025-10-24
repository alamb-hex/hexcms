/**
 * Content Sync Engine
 *
 * This module handles syncing content from Git repositories to the database.
 *
 * Features:
 * - GitHub webhook processing
 * - File fetching from GitHub API
 * - Content parsing and rendering
 * - Database upsert operations
 * - Sync logging and error tracking
 */

import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import {
  parsePostFrontmatter,
  parseAuthorFrontmatter,
  parsePageFrontmatter,
  markdownToHtml,
  calculateReadingTime,
  extractExcerpt,
} from './markdown';
import { getTagBySlug, getAuthorBySlug } from './db';
import type {
  GitHubWebhookPayload,
  SyncResult,
  PostFrontmatter,
  AuthorFrontmatter,
  PageFrontmatter,
} from '@/types';

// Initialize Neon serverless SQL client
const sql = neon(process.env.DATABASE_URL!);

// ===========================================================================
// GitHub Configuration
// ===========================================================================

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_REPO_OWNER!;
const repo = process.env.GITHUB_REPO_NAME!;

// ===========================================================================
// Webhook Processing
// ===========================================================================

/**
 * Process GitHub webhook payload
 *
 * Extracts changed files, processes additions/modifications/deletions,
 * and returns comprehensive sync results.
 *
 * @param payload - GitHub webhook payload
 * @returns Sync result with success status, count, errors, and duration
 */
export async function processWebhook(
  payload: GitHubWebhookPayload
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: Array<{ file: string; error: string }> = [];
  let processed = 0;

  try {
    // Extract changed files
    const { added, modified, removed } = payload.head_commit;
    const commitSha = payload.head_commit.id;

    // Filter to content files only
    const addedContent = filterContentFiles(added);
    const modifiedContent = filterContentFiles(modified);
    const removedContent = filterContentFiles(removed);

    // Process added and modified files
    for (const file of [...addedContent, ...modifiedContent]) {
      try {
        await processFile(file, commitSha);
        processed++;
      } catch (error) {
        errors.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Process deleted files
    for (const file of removedContent) {
      try {
        await processDeletedFile(file, commitSha);
        processed++;
      } catch (error) {
        errors.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      processed,
      errors,
      duration,
    };
  } catch (error) {
    throw new Error(
      `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify webhook signature
 *
 * Uses HMAC SHA-256 to verify the webhook payload signature.
 * Performs timing-safe comparison to prevent timing attacks.
 *
 * @param payload - Raw webhook payload string
 * @param signature - x-hub-signature-256 header value
 * @param secret - GitHub webhook secret
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    // If lengths don't match, timingSafeEqual throws - return false
    return false;
  }
}

// ===========================================================================
// File Processing
// ===========================================================================

/**
 * Fetch file content from GitHub
 *
 * Uses GitHub API to fetch file content at a specific commit.
 *
 * @param path - File path in repository
 * @param commitSha - Commit SHA to fetch from
 * @returns File content as UTF-8 string
 * @throws {Error} If file not found or API request fails
 */
export async function fetchFileFromGitHub(
  path: string,
  commitSha: string
): Promise<string> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: commitSha,
    });

    // Data should be a file, not a directory
    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Path is not a file: ${path}`);
    }

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (error) {
    throw new Error(
      `Failed to fetch file from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process added or modified file
 *
 * Fetches file content, parses frontmatter, renders content,
 * and upserts to database based on resource type.
 *
 * @param path - File path in repository
 * @param commitSha - Commit SHA
 * @throws {Error} If processing fails
 */
export async function processFile(path: string, commitSha: string): Promise<void> {
  // Determine resource type
  const resourceType = getResourceTypeFromPath(path);
  if (!resourceType) {
    throw new Error(`Invalid content path: ${path}`);
  }

  // Extract slug from path
  const slug = extractSlugFromPath(path);

  // Fetch file content
  const fileContent = await fetchFileFromGitHub(path, commitSha);

  // Process based on resource type
  if (resourceType === 'post') {
    const { data: frontmatter, content } = parsePostFrontmatter(fileContent);
    await upsertPost(slug, frontmatter, content, commitSha);
  } else if (resourceType === 'author') {
    const frontmatter = parseAuthorFrontmatter(fileContent);
    await upsertAuthor(slug, frontmatter, commitSha);
  } else if (resourceType === 'page') {
    const { data: frontmatter, content } = parsePageFrontmatter(fileContent);
    await upsertPage(slug, frontmatter, content, commitSha);
  }
}

/**
 * Process deleted file
 *
 * Extracts slug and deletes corresponding record from database.
 *
 * @param path - File path in repository
 * @param commitSha - Commit SHA
 * @throws {Error} If deletion fails
 */
export async function processDeletedFile(
  path: string,
  commitSha: string
): Promise<void> {
  // Determine resource type
  const resourceType = getResourceTypeFromPath(path);
  if (!resourceType) {
    throw new Error(`Invalid content path: ${path}`);
  }

  // Extract slug from path
  const slug = extractSlugFromPath(path);

  try {
    // Delete based on resource type
    if (resourceType === 'post') {
      const rows = await sql`
        DELETE FROM posts WHERE slug = ${slug} RETURNING id
      `;
      if (rows.length > 0) {
        await logSync(
          'delete',
          resourceType,
          rows[0].id,
          commitSha,
          'success',
          { path, slug }
        );
      }
    } else if (resourceType === 'author') {
      const rows = await sql`
        DELETE FROM authors WHERE slug = ${slug} RETURNING id
      `;
      if (rows.length > 0) {
        await logSync(
          'delete',
          resourceType,
          rows[0].id,
          commitSha,
          'success',
          { path, slug }
        );
      }
    } else if (resourceType === 'page') {
      const rows = await sql`
        DELETE FROM pages WHERE slug = ${slug} RETURNING id
      `;
      if (rows.length > 0) {
        await logSync(
          'delete',
          resourceType,
          rows[0].id,
          commitSha,
          'success',
          { path, slug }
        );
      }
    }
  } catch (error) {
    await logSync('delete', resourceType, slug, commitSha, 'error', {
      path,
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ===========================================================================
// Upsert Operations
// ===========================================================================

/**
 * Upsert post to database
 *
 * Finds or creates author, renders markdown, calculates reading time,
 * upserts post, and syncs tags.
 *
 * @param slug - Post slug
 * @param frontmatter - Validated post frontmatter
 * @param content - Markdown content
 * @param commitSha - Commit SHA
 * @throws {Error} If upsert fails
 */
export async function upsertPost(
  slug: string,
  frontmatter: PostFrontmatter,
  content: string,
  commitSha: string
): Promise<void> {
  try {
    // Find or create author
    let author = await getAuthorBySlug(frontmatter.author);

    if (!author) {
      // Create placeholder author if not found
      const rows = await sql`
        INSERT INTO authors (slug, name)
        VALUES (${frontmatter.author}, ${frontmatter.author})
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `;
      if (rows.length > 0) {
        author = { id: rows[0].id } as any;
      } else {
        // If conflict occurred, fetch the existing author
        author = await getAuthorBySlug(frontmatter.author);
        if (!author) {
          throw new Error(`Failed to find or create author: ${frontmatter.author}`);
        }
      }
    }

    // Render markdown to HTML
    const contentHtml = await markdownToHtml(content);

    // Calculate reading time
    const readingTime = calculateReadingTime(content);

    // Extract excerpt if not provided
    const excerpt = frontmatter.excerpt || extractExcerpt(content);

    // Parse published date
    const publishedAt = frontmatter.publishedAt || null;

    // Default status
    const status = frontmatter.status || 'draft';

    // At this point, author is guaranteed to be non-null
    const authorId = author!.id;

    // Upsert post
    const rows = await sql`
      INSERT INTO posts (
        slug, title, excerpt, content, content_html, author_id,
        status, featured_image, reading_time, published_at
      ) VALUES (
        ${slug}, ${frontmatter.title}, ${excerpt}, ${content}, ${contentHtml}, ${authorId},
        ${status}, ${frontmatter.featuredImage || null}, ${readingTime}, ${publishedAt}
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        content = EXCLUDED.content,
        content_html = EXCLUDED.content_html,
        author_id = EXCLUDED.author_id,
        status = EXCLUDED.status,
        featured_image = EXCLUDED.featured_image,
        reading_time = EXCLUDED.reading_time,
        published_at = EXCLUDED.published_at,
        updated_at = NOW()
      RETURNING id
    `;

    const postId = rows[0].id;

    // Sync tags
    if (frontmatter.tags && frontmatter.tags.length > 0) {
      // Delete old tags
      await sql`
        DELETE FROM post_tags WHERE post_id = ${postId}
      `;

      // Insert new tags
      for (const tagSlug of frontmatter.tags) {
        // Find or create tag
        let tag = await getTagBySlug(tagSlug);

        if (!tag) {
          const tagRows = await sql`
            INSERT INTO tags (slug, name)
            VALUES (${tagSlug}, ${tagSlug})
            ON CONFLICT (slug) DO NOTHING
            RETURNING id
          `;
          if (tagRows.length > 0) {
            tag = { id: tagRows[0].id } as any;
          } else {
            // If conflict occurred, fetch the existing tag
            tag = await getTagBySlug(tagSlug);
            if (!tag) {
              throw new Error(`Failed to find or create tag: ${tagSlug}`);
            }
          }
        }

        // At this point, tag is guaranteed to be non-null
        const tagId = tag!.id;

        // Create post-tag relationship
        await sql`
          INSERT INTO post_tags (post_id, tag_id)
          VALUES (${postId}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // Log successful sync
    await logSync('sync', 'post', postId, commitSha, 'success', {
      slug,
      title: frontmatter.title,
      tags: frontmatter.tags || [],
    });
  } catch (error) {
    await logSync('sync', 'post', slug, commitSha, 'error', {
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Upsert author to database
 *
 * Inserts or updates author with frontmatter data.
 *
 * @param slug - Author slug
 * @param frontmatter - Validated author frontmatter
 * @param commitSha - Commit SHA
 * @throws {Error} If upsert fails
 */
export async function upsertAuthor(
  slug: string,
  frontmatter: AuthorFrontmatter,
  commitSha: string
): Promise<void> {
  try {
    // Prepare social JSONB
    const social = frontmatter.social ? JSON.stringify(frontmatter.social) : '{}';

    // Upsert author
    const rows = await sql`
      INSERT INTO authors (
        slug, name, email, bio, avatar_url, website, social
      ) VALUES (
        ${slug}, ${frontmatter.name}, ${frontmatter.email || null},
        ${frontmatter.bio || null}, ${frontmatter.avatar || null},
        ${frontmatter.social?.website || null}, ${social}::jsonb
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        website = EXCLUDED.website,
        social = EXCLUDED.social,
        updated_at = NOW()
      RETURNING id
    `;

    const authorId = rows[0].id;

    // Log successful sync
    await logSync('sync', 'author', authorId, commitSha, 'success', {
      slug,
      name: frontmatter.name,
    });
  } catch (error) {
    await logSync('sync', 'author', slug, commitSha, 'error', {
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Upsert page to database
 *
 * Renders markdown and inserts or updates page.
 *
 * @param slug - Page slug
 * @param frontmatter - Validated page frontmatter
 * @param content - Markdown content
 * @param commitSha - Commit SHA
 * @throws {Error} If upsert fails
 */
export async function upsertPage(
  slug: string,
  frontmatter: PageFrontmatter,
  content: string,
  commitSha: string
): Promise<void> {
  try {
    // Render markdown to HTML
    const contentHtml = await markdownToHtml(content);

    // Parse published date
    const publishedAt = frontmatter.publishedAt || null;

    // Default status
    const status = frontmatter.status || 'draft';

    // Upsert page
    const rows = await sql`
      INSERT INTO pages (
        slug, title, content, content_html, status, template,
        meta_description, published_at
      ) VALUES (
        ${slug}, ${frontmatter.title}, ${content}, ${contentHtml},
        ${status}, ${frontmatter.template || null},
        ${frontmatter.metaDescription || null}, ${publishedAt}
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        content_html = EXCLUDED.content_html,
        status = EXCLUDED.status,
        template = EXCLUDED.template,
        meta_description = EXCLUDED.meta_description,
        published_at = EXCLUDED.published_at,
        updated_at = NOW()
      RETURNING id
    `;

    const pageId = rows[0].id;

    // Log successful sync
    await logSync('sync', 'page', pageId, commitSha, 'success', {
      slug,
      title: frontmatter.title,
    });
  } catch (error) {
    await logSync('sync', 'page', slug, commitSha, 'error', {
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ===========================================================================
// Sync Logging
// ===========================================================================

/**
 * Log sync operation
 *
 * Inserts sync event into sync_logs table with metadata.
 *
 * @param eventType - Type of sync event
 * @param resourceType - Type of resource being synced
 * @param resourceId - Resource ID or slug
 * @param commitSha - Git commit SHA
 * @param status - Sync status
 * @param metadata - Additional metadata
 * @throws {Error} If logging fails
 */
export async function logSync(
  eventType: 'sync' | 'create' | 'update' | 'delete',
  resourceType: 'post' | 'author' | 'page' | 'tag',
  resourceId: string,
  commitSha: string,
  status: 'success' | 'error' | 'skipped',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const errorMessage = status === 'error' && metadata?.error
      ? String(metadata.error)
      : null;

    const metadataJson = metadata ? JSON.stringify(metadata) : '{}';

    await sql`
      INSERT INTO sync_logs (
        event_type, resource_type, resource_id, commit_sha,
        status, error_message, metadata
      ) VALUES (
        ${eventType}, ${resourceType}, ${resourceId}, ${commitSha},
        ${status}, ${errorMessage}, ${metadataJson}::jsonb
      )
    `;
  } catch (error) {
    // Don't throw on logging errors - log to console instead
    console.error('Failed to log sync operation:', error);
  }
}

// ===========================================================================
// Utility Functions
// ===========================================================================

/**
 * Extract slug from file path
 *
 * Removes directory prefix, date prefix (for posts), and .md extension.
 *
 * @param path - File path in repository
 * @returns Extracted slug
 *
 * @example
 * extractSlugFromPath('content/posts/2024-01-15-hello-world.md') // 'hello-world'
 * extractSlugFromPath('content/authors/john-doe.md') // 'john-doe'
 * extractSlugFromPath('content/pages/about.md') // 'about'
 */
export function extractSlugFromPath(path: string): string {
  // Remove directory prefix
  let filename = path.split('/').pop() || '';

  // Remove .md extension
  filename = filename.replace(/\.md$/, '');

  // For posts: remove date prefix (YYYY-MM-DD-)
  if (path.startsWith('content/posts/')) {
    filename = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  }

  return filename;
}

/**
 * Determine resource type from path
 *
 * Detects whether a file path is a post, author, or page.
 *
 * @param path - File path in repository
 * @returns Resource type or null if not a content file
 */
export function getResourceTypeFromPath(
  path: string
): 'post' | 'author' | 'page' | null {
  if (path.startsWith('content/posts/')) return 'post';
  if (path.startsWith('content/authors/')) return 'author';
  if (path.startsWith('content/pages/')) return 'page';
  return null;
}

/**
 * Filter content files from changed files list
 *
 * Returns only .md files in content/ directory.
 *
 * @param files - Array of file paths
 * @returns Filtered array of content files
 */
export function filterContentFiles(files: string[]): string[] {
  return files.filter(
    (file) => file.startsWith('content/') && file.endsWith('.md')
  );
}
