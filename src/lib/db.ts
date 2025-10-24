/**
 * Database Connection and Query Utilities
 *
 * This module provides database connection management and query helpers
 * for interacting with PostgreSQL using Neon serverless driver.
 */

import { neon } from '@neondatabase/serverless';
import type { Post, Author, Tag, Page, PostFilters, PaginatedResponse } from '@/types';

// ===========================================================================
// Database Connection
// ===========================================================================

/**
 * Execute a SQL query
 * Using Neon's serverless driver optimized for Vercel edge runtime
 */
const sql = neon(process.env.DATABASE_URL!);
export const db = sql;

// ===========================================================================
// Post Queries
// ===========================================================================

/**
 * Get all published posts with filters
 *
 * Supports filtering by status, author, tag, featured status, and search query.
 * Includes pagination and sorting options.
 *
 * @param filters - Post filtering and pagination options
 * @returns Paginated response with posts and metadata
 */
export async function getPosts(filters: PostFilters = {}): Promise<PaginatedResponse<Post>> {
  try {
    const {
      status,
      authorId,
      tag,
      featured,
      search,
      limit = 10,
      offset = 0,
      orderBy = 'publishedAt',
      orderDirection = 'desc'
    } = filters;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (authorId) {
      conditions.push(`p.author_id = $${paramIndex}`);
      params.push(authorId);
      paramIndex++;
    }

    if (featured !== undefined) {
      conditions.push(`p.featured = $${paramIndex}`);
      params.push(featured);
      paramIndex++;
    }

    if (search) {
      conditions.push(`p.search_vector @@ plainto_tsquery('english', $${paramIndex})`);
      params.push(search);
      paramIndex++;
    }

    // Handle tag filter (requires join)
    let fromClause = 'FROM posts p';
    if (tag) {
      fromClause = `
        FROM posts p
        INNER JOIN post_tags pt ON p.id = pt.post_id
        INNER JOIN tags t ON pt.tag_id = t.id
      `;
      conditions.push(`t.slug = $${paramIndex}`);
      params.push(tag);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate and build ORDER BY clause
    const validOrderFields: Record<string, string> = {
      publishedAt: 'p.published_at',
      createdAt: 'p.created_at',
      views: 'p.views',
      title: 'p.title'
    };

    const orderField = validOrderFields[orderBy] || validOrderFields.publishedAt;
    const orderDir = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      ${fromClause}
      ${whereClause}
    `;

    const countRows = await (sql as any)(countQuery, params);
    const total = parseInt(countRows[0].total, 10);

    // Get paginated results
    const dataQuery = `
      SELECT DISTINCT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.content,
        p.content_html,
        p.author_id,
        p.status,
        p.featured_image,
        p.featured,
        p.reading_time,
        p.views,
        p.published_at,
        p.created_at,
        p.updated_at
      ${fromClause}
      ${whereClause}
      ORDER BY ${orderField} ${orderDir}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataRows = await (sql as any)(dataQuery, [...params, limit, offset]);

    const data = dataRows.map(mapRowToPost);

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single post by slug
 *
 * Joins with authors table to include author information.
 *
 * @param slug - Post slug
 * @returns Post object or null if not found
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const rows = await sql`
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.content,
        p.content_html,
        p.author_id,
        p.status,
        p.featured_image,
        p.featured,
        p.reading_time,
        p.views,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM posts p
      WHERE p.slug = ${slug}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    return mapRowToPost(rows[0]);
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    throw new Error(`Failed to fetch post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get featured posts
 *
 * Returns published posts marked as featured, ordered by publish date.
 *
 * @param limit - Maximum number of posts to return (default: 3)
 * @returns Array of featured posts
 */
export async function getFeaturedPosts(limit: number = 3): Promise<Post[]> {
  try {
    const rows = await sql`
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.content,
        p.content_html,
        p.author_id,
        p.status,
        p.featured_image,
        p.featured,
        p.reading_time,
        p.views,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM posts p
      WHERE p.featured = true
        AND p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ${limit}
    `;

    return rows.map(mapRowToPost);
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    throw new Error(`Failed to fetch featured posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search posts using full-text search
 *
 * Uses PostgreSQL's tsvector for full-text search with relevance ranking.
 * Only searches published posts.
 *
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of posts ordered by relevance
 */
export async function searchPosts(query: string, limit: number = 20): Promise<Post[]> {
  try {
    const rows = await sql`
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.content,
        p.content_html,
        p.author_id,
        p.status,
        p.featured_image,
        p.featured,
        p.reading_time,
        p.views,
        p.published_at,
        p.created_at,
        p.updated_at,
        ts_rank(p.search_vector, plainto_tsquery('english', ${query})) AS rank
      FROM posts p
      WHERE p.search_vector @@ plainto_tsquery('english', ${query})
        AND p.status = 'published'
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    return rows.map(mapRowToPost);
  } catch (error) {
    console.error('Error searching posts:', error);
    throw new Error(`Failed to search posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get posts by tag
 *
 * Returns all published posts associated with a specific tag.
 *
 * @param tagSlug - Tag slug to filter by
 * @returns Array of posts with the specified tag
 */
export async function getPostsByTag(tagSlug: string): Promise<Post[]> {
  try {
    const rows = await sql`
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.content,
        p.content_html,
        p.author_id,
        p.status,
        p.featured_image,
        p.featured,
        p.reading_time,
        p.views,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM posts p
      INNER JOIN post_tags pt ON p.id = pt.post_id
      INNER JOIN tags t ON pt.tag_id = t.id
      WHERE t.slug = ${tagSlug}
        AND p.status = 'published'
      ORDER BY p.published_at DESC
    `;

    return rows.map(mapRowToPost);
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    throw new Error(`Failed to fetch posts by tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get posts by author
 *
 * Returns all published posts by a specific author.
 *
 * @param authorSlug - Author slug to filter by
 * @returns Array of posts by the specified author
 */
export async function getPostsByAuthor(authorSlug: string): Promise<Post[]> {
  try {
    const rows = await sql`
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.content,
        p.content_html,
        p.author_id,
        p.status,
        p.featured_image,
        p.featured,
        p.reading_time,
        p.views,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM posts p
      INNER JOIN authors a ON p.author_id = a.id
      WHERE a.slug = ${authorSlug}
        AND p.status = 'published'
      ORDER BY p.published_at DESC
    `;

    return rows.map(mapRowToPost);
  } catch (error) {
    console.error('Error fetching posts by author:', error);
    throw new Error(`Failed to fetch posts by author: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Increment post view count
 *
 * Atomically increments the view counter for a post.
 *
 * @param slug - Post slug
 */
export async function incrementPostViews(slug: string): Promise<void> {
  try {
    await sql`
      UPDATE posts
      SET views = views + 1
      WHERE slug = ${slug}
    `;
  } catch (error) {
    console.error('Error incrementing post views:', error);
    throw new Error(`Failed to increment post views: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===========================================================================
// Author Queries
// ===========================================================================

/**
 * Get all authors
 *
 * Returns all authors ordered alphabetically by name.
 *
 * @returns Array of all authors
 */
export async function getAuthors(): Promise<Author[]> {
  try {
    const rows = await sql`
      SELECT
        id,
        slug,
        name,
        email,
        bio,
        avatar_url,
        website,
        social,
        created_at,
        updated_at
      FROM authors
      ORDER BY name ASC
    `;

    return rows.map(mapRowToAuthor);
  } catch (error) {
    console.error('Error fetching authors:', error);
    throw new Error(`Failed to fetch authors: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get author by slug
 *
 * Returns a single author by their slug.
 *
 * @param slug - Author slug
 * @returns Author object or null if not found
 */
export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  try {
    const rows = await sql`
      SELECT
        id,
        slug,
        name,
        email,
        bio,
        avatar_url,
        website,
        social,
        created_at,
        updated_at
      FROM authors
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    return mapRowToAuthor(rows[0]);
  } catch (error) {
    console.error('Error fetching author by slug:', error);
    throw new Error(`Failed to fetch author: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===========================================================================
// Tag Queries
// ===========================================================================

/**
 * Get all tags
 *
 * Returns all tags ordered alphabetically by name.
 *
 * @returns Array of all tags
 */
export async function getTags(): Promise<Tag[]> {
  try {
    const rows = await sql`
      SELECT
        id,
        slug,
        name,
        description,
        created_at
      FROM tags
      ORDER BY name ASC
    `;

    return rows.map(mapRowToTag);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error(`Failed to fetch tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get tag by slug
 *
 * Returns a single tag by its slug.
 *
 * @param slug - Tag slug
 * @returns Tag object or null if not found
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  try {
    const rows = await sql`
      SELECT
        id,
        slug,
        name,
        description,
        created_at
      FROM tags
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    return mapRowToTag(rows[0]);
  } catch (error) {
    console.error('Error fetching tag by slug:', error);
    throw new Error(`Failed to fetch tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get tags for a post
 *
 * Returns all tags associated with a specific post.
 *
 * @param postId - Post UUID
 * @returns Array of tags for the post
 */
export async function getTagsForPost(postId: string): Promise<Tag[]> {
  try {
    const rows = await sql`
      SELECT
        t.id,
        t.slug,
        t.name,
        t.description,
        t.created_at
      FROM tags t
      INNER JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ${postId}
      ORDER BY t.name ASC
    `;

    return rows.map(mapRowToTag);
  } catch (error) {
    console.error('Error fetching tags for post:', error);
    throw new Error(`Failed to fetch tags for post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===========================================================================
// Page Queries
// ===========================================================================

/**
 * Get all published pages
 *
 * Returns all pages with published status, ordered by title.
 *
 * @returns Array of published pages
 */
export async function getPages(): Promise<Page[]> {
  try {
    const rows = await sql`
      SELECT
        id,
        slug,
        title,
        content,
        content_html,
        status,
        template,
        meta_description,
        published_at,
        created_at,
        updated_at
      FROM pages
      WHERE status = 'published'
      ORDER BY title ASC
    `;

    return rows.map(mapRowToPage);
  } catch (error) {
    console.error('Error fetching pages:', error);
    throw new Error(`Failed to fetch pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get page by slug
 *
 * Returns a single published page by its slug.
 *
 * @param slug - Page slug
 * @returns Page object or null if not found
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const rows = await sql`
      SELECT
        id,
        slug,
        title,
        content,
        content_html,
        status,
        template,
        meta_description,
        published_at,
        created_at,
        updated_at
      FROM pages
      WHERE slug = ${slug}
        AND status = 'published'
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    return mapRowToPage(rows[0]);
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===========================================================================
// Utility Functions
// ===========================================================================

/**
 * Test database connection
 *
 * Performs a simple query to verify database connectivity.
 *
 * @returns true if connection is successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    await db`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// ===========================================================================
// Row Mapping Helpers
// ===========================================================================

/**
 * Map database row to Post type
 *
 * Handles NULL values and type conversions from database format to TypeScript.
 */
function mapRowToPost(row: any): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || undefined,
    content: row.content,
    contentHtml: row.content_html || undefined,
    authorId: row.author_id || undefined,
    status: row.status,
    featuredImage: row.featured_image || undefined,
    featured: row.featured,
    readingTime: row.reading_time || undefined,
    views: row.views,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map database row to Author type
 *
 * Handles NULL values and JSONB parsing for social links.
 */
function mapRowToAuthor(row: any): Author {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    email: row.email || undefined,
    bio: row.bio || undefined,
    avatarUrl: row.avatar_url || undefined,
    website: row.website || undefined,
    social: typeof row.social === 'string' ? JSON.parse(row.social) : (row.social || {}),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map database row to Tag type
 *
 * Handles NULL values for optional fields.
 */
function mapRowToTag(row: any): Tag {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Map database row to Page type
 *
 * Handles NULL values and type conversions.
 */
function mapRowToPage(row: any): Page {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    contentHtml: row.content_html || undefined,
    status: row.status,
    template: row.template || undefined,
    metaDescription: row.meta_description || undefined,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
